import json
import re
import uuid
import logging
import jwt
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend import config
from backend.database import db
from backend.auth import get_current_user, TEST_AUTH_ENABLED, MOCK_USERS
from backend.memory_search import rank_docs

logger = logging.getLogger(__name__)


def _rate_limit_key(request: Request) -> str:
    """Rate-limit by authenticated user so one user can't be throttled (or
    spoofed) via a shared proxy IP. Falls back to the client IP for
    unauthenticated requests."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if token:
        try:
            if TEST_AUTH_ENABLED and token in MOCK_USERS:
                return f"user:{MOCK_USERS[token]['id']}"
            sub = jwt.decode(token, options={"verify_signature": False}).get("sub")
            if sub:
                return f"user:{sub}"
        except Exception:
            pass
    return get_remote_address(request)


# Initialize rate limiter keyed on the authenticated user (IP fallback)
limiter = Limiter(key_func=_rate_limit_key)

router = APIRouter(prefix="/ai", tags=["AI"])

# ========== PYDANTIC MODELS ==========

class EnhanceIdeaRequest(BaseModel):
    idea: str

class ArchitectRequest(BaseModel):
    idea: str
    tech_preferences: List[str] = []
    team_size: int = 1
    timeline: str = "4 weeks"
    project_id: Optional[str] = None

class CTORequest(BaseModel):
    question: str
    context: str = ""
    project_id: Optional[str] = None
    tech_stack: List[str] = []
    category: str = "architecture"

class QueryRequest(BaseModel):
    query: str
    project_id: Optional[str] = None

class SprintGenerateRequest(BaseModel):
    idea: str
    blueprint: str = ""
    team_size: int = 2
    num_sprints: int = 3
    sprint_duration: str = "2 weeks"
    project_id: Optional[str] = None

# ========== HELPERS ==========

def _parse_json_tasks(content: str) -> list:
    """Extract JSON task array from AI response, handles code blocks and raw JSON."""
    m = re.search(r'```(?:json)?\s*(\[[\s\S]+?\])\s*```', content)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception as e:
            logger.warning(f"Code block parse failed: {e}")
    m = re.search(r'(\[[\s\S]+\])', content)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception as e:
            logger.warning(f"Direct JSON parse failed: {e}")
    return []

async def stream_openrouter(messages: list, model: str = None):
    primary_model = model or config.DEFAULT_MODEL
    fallback_models = ["deepseek/deepseek-chat:free", "liquid/lfm-2.5-1.2b-instruct:free"]
    
    # Filter primary_model from fallback list if it is already primary
    fallback_models = [m for m in fallback_models if m != primary_model]
    
    async def generate():
        models_to_try = [primary_model] + fallback_models
        for current_model in models_to_try:
            logger.info(f"Attempting to stream from model: {current_model}")
            try:
                async with httpx.AsyncClient(timeout=120) as client:
                    async with client.stream(
                        "POST",
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://archon.ai",
                            "X-Title": "Archon AI"
                        },
                        json={
                            "model": current_model,
                            "messages": messages,
                            "stream": True,
                            "max_tokens": 4096
                        }
                    ) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line and line.startswith("data: "):
                                    yield f"{line}\n\n"
                            return
                        else:
                            body = await response.aread()
                            logger.warning(f"Model {current_model} failed with status {response.status_code}: {body.decode(errors='ignore')}")
                            if current_model == models_to_try[-1]:
                                # Emit a distinct error event the frontend can style/handle
                                # rather than impersonating model output.
                                err_payload = json.dumps({"error": {"message": "The AI service is temporarily unavailable. Please try again."}})
                                yield f"data: {err_payload}\n\n"
                                yield "data: [DONE]\n\n"
                                return
            except Exception as e:
                logger.error(f"Error streaming from {current_model}: {e}")
                if current_model == models_to_try[-1]:
                    err_payload = json.dumps({"error": {"message": "The AI service is temporarily unavailable. Please try again."}})
                    yield f"data: {err_payload}\n\n"
                    yield "data: [DONE]\n\n"
                    return

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

# ========== ROUTES ==========

@router.post("/enhance-idea")
@limiter.limit("10/minute")
async def enhance_idea(request: Request, data: EnhanceIdeaRequest, current_user=Depends(get_current_user)):
    # Log query
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "enhance_idea",
        "query": data.idea[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    system = """You are an elite Product Manager and Technical Lead for Archon AI.
Your task is to take a simple, brief project idea and enhance it into a highly detailed, comprehensive, and well-structured project description. This enhanced description will serve as the prompt context for other AI systems to generate technical blueprints and sprint tasks.

Structure your response with the following Markdown headers:
## Project Concept & Vision
Explain the core purpose, target audience, and the main problem it solves.

## Target User Personas
Identify who will use this application and their primary goals.

## Core Modules & Functional Requirements
Break down the main modules/features (at least 4-5 core elements) that must be implemented in the MVP.

## Suggested Technical Stack
Propose a modern frontend, backend, database, and hosting architecture that fits this scale.

## Future AI & Scale Enhancements
Identify how artificial intelligence (e.g. LLMs, predictive models, intelligence analysis) or scaling mechanisms can be integrated to add premium value.

Constraints:
- Be highly descriptive, specific, and professional.
- Do NOT use generic placeholders or filler text.
- Do NOT include greetings, introductions, or conversational preambles. Start directly with the first heading.
- Aim for a comprehensive explanation of about 250-400 words."""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Project Idea: {data.idea}\n\nGenerate the enhanced structured description."}
    ]
    return await stream_openrouter(messages)

@router.post("/architect")
@limiter.limit("10/minute")
async def ai_architect(request: Request, data: ArchitectRequest, current_user=Depends(get_current_user)):
    # Log query
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "architect",
        "query": data.idea[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    system = """ROLE
You are an Elite Prompt Architect, Principal Software Engineer, AI Engineer, Solutions Architect, Product Strategist, Research Analyst, and Requirements Engineer.

Your sole purpose is to transform any user input into a set of highly optimized, production-grade prompts that can be executed by Claude, ChatGPT, Gemini, Grok, DeepSeek, Cursor, Windsurf, Copilot, and other advanced AI systems.

You do not answer the user's request directly.
You only generate optimized prompts.

---
PRIMARY OBJECTIVE
Convert any user input into a structured prompt execution workflow.
The user may provide:
- A rough idea
- A simple sentence
- A coding problem
- A startup idea
- A SaaS concept
- A project requirement
- A feature request
- A business idea
- A research topic
- A product concept
- A technical challenge
- Messy notes
- Brain dumps

Your task is to understand the user's true intent and transform it into a professional execution plan.

---
INTELLIGENT REQUIREMENT ANALYSIS
Before generating prompts:
Identify:
- User's main goal
- Desired outcome
- Hidden objectives
- Technical domain
- Business requirements
- Functional requirements
- Non-functional requirements
- Expected deliverables
- Complexity level
- Missing information

Infer missing context intelligently.
Use reasonable assumptions.
Avoid asking follow-up questions unless absolutely necessary.

---
DOMAIN DETECTION
Automatically detect:
- Full Stack Development
- Frontend Development
- Backend Development
- Mobile Development
- AI Engineering
- Machine Learning
- Agent Systems
- SaaS Products
- Automation
- APIs
- Databases
- DevOps
- Cloud Infrastructure
- Cybersecurity
- Data Engineering
- UI/UX Design
- Product Design
- Business Strategy
- Research
- Content Systems

Adapt prompt quality and structure accordingly.

---
DEVELOPER-FIRST OPTIMIZATION
When the request involves software, AI, automation, web development, mobile apps, APIs, SaaS, or technical systems:
Automatically include relevant details such as:
- System Architecture
- Folder Structure
- Database Design
- API Design
- Authentication
- Authorization
- Security
- Scalability
- Error Handling
- Validation
- Logging
- Monitoring
- Testing
- CI/CD
- Deployment
- Performance Optimization
- Best Practices
- Maintainability
- Edge Cases

Assume the user wants production-level quality.

---
CRITICAL OUTPUT RULE
DO NOT generate one giant master prompt.
Instead, divide the solution into THREE optimized prompts.
This improves performance when used with coding agents and AI development tools.

---
OUTPUT FORMAT
You must first output a detailed project analysis section marked with:
PROJECT UNDERSTANDING
Provide a comprehensive explanation (2-3 paragraphs) of what the project is about, who it is for, what user requirements/goals it meets, and why this setup fits perfectly. End this section with: "Review the compiled stage prompts below to proceed."

Then, output exactly three prompts:
PROMPT 1
PROMPT 2
PROMPT 3

---
PROMPT 1 — PLANNING & ARCHITECTURE
Purpose:
Create a complete implementation blueprint.
Include:
- Requirements analysis
- Project scope
- Architecture design
- Tech stack recommendations (suggest modern choices like: Next.js/Vite/FastAPI/NestJS/Go/Rust/PostgreSQL/Supabase/Prisma/Drizzle/Docker/Kubernetes/GitHub Actions/AWS/Vercel/Clerk/Stripe/TailwindCSS/Shadcn UI)
- Database design
- API structure
- Folder structure
- Development roadmap
- Key technical decisions
- Security considerations
- Scalability planning

This prompt should focus on THINKING and PLANNING.
Do not focus on coding.

---
PROMPT 2 — IMPLEMENTATION
Purpose:
Build the actual solution.
Include:
- Complete implementation instructions
- Production-quality code generation guidance
- Feature implementation requirements
- Frontend requirements
- Backend requirements
- Database implementation
- API implementation
- Integrations
- Validation
- Error handling
- Best practices

This prompt should focus on BUILDING.
Do not focus on architecture discussions.

---
PROMPT 3 — REVIEW, TESTING & OPTIMIZATION
Purpose:
Audit and improve the generated solution.
Include:
- Code review
- Security review
- Bug detection
- Edge-case analysis
- Performance optimization
- Refactoring opportunities
- Test generation
- Deployment readiness review
- Documentation review
- Production readiness validation

This prompt should focus on VERIFYING and IMPROVING.

---
TOKEN EFFICIENCY MODE
Do not generate unnecessarily long prompts.
Optimize for:
- High information density
- Clarity
- Precision
- Actionability

Avoid:
- Fluff
- Repetition
- Generic advice
- Unnecessary explanations

Generate prompts that are concise but complete.

---
FORMATTING RULES (CRITICAL)
Never use markdown heading syntax inside the prompts.
Do NOT use #, ##, or ### anywhere.
Instead:
- Use **Bold Label:** for section titles (e.g. **Tech Stack:** or **1. Setup Architecture:**)
- Use numbered lists (1. 2. 3.) for sequential steps
- Use bullet points (-) for non-sequential items
- Use plain line breaks to separate sections
This ensures the prompts are clean and readable when pasted into coding agents like Cursor, Windsurf, and Copilot.

---
OUTPUT RESTRICTIONS
Never explain your reasoning outside the PROJECT UNDERSTANDING.
Never explain what was optimized.
Never provide notes.
Never provide summaries.
Never provide introductions.
Never provide conclusions.
Never provide recommendations outside the prompts.
Never use phrases like:
- "Here is your prompt"
- "Optimized Prompt"
- "Master Prompt Generated"

Always output exactly:
PROJECT UNDERSTANDING
[content]
PROMPT 1
[content]
PROMPT 2
[content]
PROMPT 3
[content]
Nothing else. Ensure the labels "PROJECT UNDERSTANDING", "PROMPT 1", "PROMPT 2", and "PROMPT 3" are on their own lines, followed by their contents.
"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"""Project Idea: {data.idea}

Tech Preferences: {', '.join(data.tech_preferences) or 'None (recommend best options)'}
Team Size: {data.team_size} developer(s)
Timeline: {data.timeline}

Generate the three-stage execution workflow prompts for this project."""}
    ]
    return await stream_openrouter(messages)

@router.post("/cto")
@limiter.limit("10/minute")
async def ai_cto(request: Request, data: CTORequest, current_user=Depends(get_current_user)):
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "cto",
        "query": data.question[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    system = """You are an elite AI CTO and Principal Technical Advisor for Archon AI.

You provide expert technical guidance on:
- System architecture and design patterns
- Technology stack selection and evaluation  
- Code quality, scalability, performance
- Security best practices
- DevOps and deployment strategies
- Cost optimization and trade-offs

Be direct, specific, and pragmatic. Use markdown formatting. Think like a battle-tested CTO who has shipped real products."""

    context_str = f"\n\nProject Context: {data.context}" if data.context else ""
    tech_str = f"\n\nCurrent Tech Stack: {', '.join(data.tech_stack)}" if data.tech_stack else ""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"""Technical Question [{data.category.upper()}]: {data.question}{context_str}{tech_str}

Provide expert CTO-level advice."""}
    ]
    return await stream_openrouter(messages)

@router.post("/query")
@limiter.limit("10/minute")
async def ai_query_memory(request: Request, data: QueryRequest, current_user=Depends(get_current_user)):
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "rag",
        "query": data.query[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    q = {"user_id": current_user["id"]}
    if data.project_id:
        q["project_id"] = data.project_id
    docs = await db.memory_docs.find(q).to_list(100)

    top_docs = rank_docs(data.query, docs, 3)

    context = "\n\n---\n\n".join([f"**{d['title']}**\n{d['content'][:2000]}" for _, d in top_docs]) if top_docs else "No relevant documents found in knowledge base."

    system_prompt = """You are an AI knowledge base assistant for Archon AI. Answer questions using ONLY the provided context documents.

Guidelines:
- Be specific and reference actual content from the documents
- Use clear markdown formatting (headers, bold, lists) for complex answers
- If the context is insufficient, clearly state what is missing
- Keep responses focused and actionable
- Do not add generic advice outside the provided context"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"""Context documents from knowledge base:

{context}

---
Question: {data.query}

Answer based on the context above."""}
    ]
    return await stream_openrouter(messages)

@router.post("/sprint")
@limiter.limit("10/minute")
async def generate_sprint(request: Request, data: SprintGenerateRequest, current_user=Depends(get_current_user)):
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "sprint",
        "query": data.idea[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    system = """You are an expert Agile Sprint Planner for software projects. Generate a detailed sprint plan.

Return ONLY a valid JSON array of task objects. No explanations, no markdown text, just the JSON array.

Each task object must have exactly these fields:
{
  "title": "Action verb + specific task (max 60 chars)",
  "description": "1-2 sentence description of what needs to be done. IMPORTANT: You must append the rationale at the end by adding two newlines, followed by '**AI Rationale:** ' and a 1-2 sentence explanation of why this task was generated and its architectural importance.",
  "priority": "critical" or "high" or "medium" or "low",
  "story_points": 1 or 2 or 3 or 5 or 8 or 13,
  "sprint": <sprint number integer>,
  "type": "feature" or "bug" or "chore" or "research",
  "status": "todo"
}

Guidelines:
- Generate 15-25 tasks total
- Sprint 1 = foundation/setup, Sprint 2 = core features, Sprint 3 = polish/scale
- Use Fibonacci story points reflecting complexity
- Start every title with an action verb: Build, Create, Implement, Design, Set up, Configure, Add, Integrate"""

    user_msg = f"""Project: {data.idea}
Team size: {data.team_size} developer(s)
Number of sprints: {data.num_sprints}
Sprint duration: {data.sprint_duration}"""
    if data.blueprint:
        user_msg += f"\n\nProject Blueprint:\n{data.blueprint[:2000]}"
    user_msg += "\n\nReturn the JSON array of tasks only."

    primary_model = config.DEFAULT_MODEL
    fallback_models = ["deepseek/deepseek-chat:free", "liquid/lfm-2.5-1.2b-instruct:free"]
    fallback_models = [m for m in fallback_models if m != primary_model]
    models_to_try = [primary_model] + fallback_models

    content = None
    last_error_status = 200
    for current_model in models_to_try:
        try:
            logger.info(f"Attempting sprint generation using model: {current_model}")
            async with httpx.AsyncClient(timeout=90) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://archon.ai",
                        "X-Title": "Archon AI"
                    },
                    json={"model": current_model, "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user_msg}
                    ], "stream": False, "max_tokens": 4096}
                )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                logger.info(f"Successfully generated sprint plan using model: {current_model}")
                break
            else:
                last_error_status = resp.status_code
                body = await resp.aread()
                logger.warning(f"Sprint model {current_model} failed with status {resp.status_code}: {body.decode(errors='ignore')}")
        except Exception as e:
            logger.error(f"Sprint generation error with model {current_model}: {e}")

    if not content:
        raise HTTPException(status_code=500, detail=f"AI did not return response. Upstream returned status {last_error_status}")

    raw_tasks = _parse_json_tasks(content)
    if not raw_tasks:
        raise HTTPException(status_code=500, detail="AI did not return parseable tasks. Try again.")

    try:
        def _safe_int(value, default):
            try:
                return int(value)
            except (TypeError, ValueError):
                return default

        tasks = []
        for t in raw_tasks:
            tasks.append({
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "project_id": data.project_id or "",
                "title": str(t.get("title", "Untitled"))[:100],
                "description": str(t.get("description", ""))[:500],
                "status": "todo",
                "priority": t.get("priority", "medium") if t.get("priority") in ["critical","high","medium","low"] else "medium",
                "story_points": _safe_int(t.get("story_points"), 3),
                "sprint": _safe_int(t.get("sprint"), 1),
                "type": t.get("type", "feature") if t.get("type") in ["feature","bug","chore","research"] else "feature",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        # Persist the whole sprint in a single request: it either all lands or
        # none of it does — no orphaned half-sprint on a mid-loop failure.
        await db.sprint_tasks.insert_many(tasks)
        for task in tasks:
            task["_id"] = str(task.get("_id", task["id"]))
        return {"tasks": tasks, "count": len(tasks)}
    except Exception as e:
        logger.error(f"Sprint saving/processing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save generated sprint tasks.")
