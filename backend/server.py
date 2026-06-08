from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, List
import os, logging, uuid, jwt, bcrypt, httpx, json, re
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
_client = AsyncIOMotorClient(mongo_url)
db = _client[os.environ['DB_NAME']]

# ========== SETTINGS ==========
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-key")
JWT_ALGORITHM = "HS256"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
DEFAULT_MODEL = os.environ.get("AI_MODEL", "deepseek/deepseek-chat")

# ========== AUTH UTILS ==========

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== MODELS ==========

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    idea: str = ""
    tech_stack: List[str] = []

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ai_blueprint: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    status: Optional[str] = None

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

class MemoryDocCreate(BaseModel):
    title: str
    content: str
    source_type: str = "text"
    project_id: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    project_id: Optional[str] = None
    limit: int = 5

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

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "medium"
    story_points: int = 3
    sprint: int = 1
    type: str = "feature"
    project_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    story_points: Optional[int] = None
    sprint: Optional[int] = None
    type: Optional[str] = None

# ========== AI UTILS ==========

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
    model = model or DEFAULT_MODEL

    async def generate():
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://ghostboard.ai",
                        "X-Title": "GhostBoard AI"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": True,
                        "max_tokens": 4096
                    }
                ) as response:
                    if response.status_code != 200:
                        await response.aread()
                        yield f"data: {{\"choices\":[{{\"delta\":{{\"content\":\"Error: API returned {response.status_code}\"}}}}]}}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    async for line in response.aiter_lines():
                        if line and line.startswith("data: "):
                            yield f"{line}\n\n"
        except Exception as e:
            logger.error(f"OpenRouter stream error: {e}")
            yield f"data: {{\"choices\":[{{\"delta\":{{\"content\":\"Stream error: {str(e)}\"}}}}]}}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

# ========== API ROUTER ==========

api_router = APIRouter(prefix="/api")

# --- AUTH ---

@api_router.post("/auth/register")
async def register(data: RegisterRequest):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email.lower(),
        "name": data.name,
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_access_token(user_id, data.email.lower())
    return {"token": token, "user": {"id": user_id, "email": user["email"], "name": user["name"], "role": "user"}}

@api_router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user.get("role", "user")}}

@api_router.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    return current_user

# --- PROJECTS ---

@api_router.get("/projects")
async def list_projects(current_user=Depends(get_current_user)):
    projects = await db.projects.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    for p in projects:
        p["_id"] = str(p["_id"])
    return projects

@api_router.post("/projects")
async def create_project(data: ProjectCreate, current_user=Depends(get_current_user)):
    project = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": data.title,
        "description": data.description,
        "idea": data.idea,
        "ai_blueprint": "",
        "tech_stack": data.tech_stack,
        "status": "ideation",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project)
    project["_id"] = str(project["_id"])
    return project

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    p = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    p["_id"] = str(p["_id"])
    return p

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, current_user=Depends(get_current_user)):
    p = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.projects.update_one({"id": project_id}, {"$set": update_data})
    p = await db.projects.find_one({"id": project_id})
    p["_id"] = str(p["_id"])
    return p

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Deleted"}

# --- AI ENDPOINTS ---

@api_router.post("/ai/architect")
async def ai_architect(data: ArchitectRequest, current_user=Depends(get_current_user)):
    # Log query
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "architect",
        "query": data.idea[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    system = """You are an elite AI Project Architect for GhostBoard AI. Generate comprehensive, production-ready project blueprints.

Structure your response with these sections using markdown:

## Project Overview
Brief vision, problem, solution

## Recommended Tech Stack
Technologies with justification

## System Architecture
Components and their interactions

## Core MVP Features
Top 5-7 features prioritized by impact

## Database Schema
Key collections/tables and relationships

## API Design
Key endpoints (REST or GraphQL)

## Sprint Plan (4 sprints)
Week-by-week deliverables

## Potential Risks & Mitigations
Top 3-5 risks

## Success Metrics
KPIs and milestones

Be specific, actionable, and think like a Senior Principal Engineer."""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"""Project Idea: {data.idea}

Tech Preferences: {', '.join(data.tech_preferences) or 'None (recommend best options)'}
Team Size: {data.team_size} developer(s)
Timeline: {data.timeline}

Generate a comprehensive project blueprint."""}
    ]
    return await stream_openrouter(messages)

@api_router.post("/ai/cto")
async def ai_cto(data: CTORequest, current_user=Depends(get_current_user)):
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "cto",
        "query": data.question[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    system = """You are an elite AI CTO and Principal Technical Advisor for GhostBoard AI.

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

@api_router.post("/ai/query")
async def ai_query_memory(data: QueryRequest, current_user=Depends(get_current_user)):
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "rag",
        "query": data.query[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    query_words = data.query.lower().split()
    q = {"user_id": current_user["id"]}
    if data.project_id:
        q["project_id"] = data.project_id
    docs = await db.memory_docs.find(q).to_list(100)

    scored = []
    for doc in docs:
        score = sum(1 for w in query_words if w in doc.get("content", "").lower() or w in doc.get("title", "").lower())
        if score > 0:
            scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    top_docs = scored[:3]

    context = "\n\n---\n\n".join([f"**{d['title']}**\n{d['content'][:2000]}" for _, d in top_docs]) if top_docs else "No relevant documents found in knowledge base."

    messages = [
        {"role": "system", "content": "You are an AI assistant with access to the user's personal knowledge base. Answer questions based on the provided context. If context is insufficient, clearly state what information is missing."},
        {"role": "user", "content": f"""Context from knowledge base:

{context}

---
Question: {data.query}"""}
    ]
    return await stream_openrouter(messages)

# --- SPRINT PLANNER ---

@api_router.post("/ai/sprint")
async def generate_sprint(data: SprintGenerateRequest, current_user=Depends(get_current_user)):
    await db.ai_queries.insert_one({
        "user_id": current_user["id"], "type": "sprint",
        "query": data.idea[:200], "created_at": datetime.now(timezone.utc).isoformat()
    })
    system = """You are an expert Agile Sprint Planner for software projects. Generate a detailed sprint plan.

Return ONLY a valid JSON array of task objects. No explanations, no markdown text, just the JSON array.

Each task object must have exactly these fields:
{
  "title": "Action verb + specific task (max 60 chars)",
  "description": "1-2 sentence description of what needs to be done",
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

    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ghostboard.ai",
                    "X-Title": "GhostBoard AI"
                },
                json={"model": DEFAULT_MODEL, "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg}
                ], "stream": False, "max_tokens": 4096}
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"AI API error: {resp.status_code}")

        content = resp.json()["choices"][0]["message"]["content"]
        raw_tasks = _parse_json_tasks(content)
        if not raw_tasks:
            raise HTTPException(status_code=500, detail="AI did not return parseable tasks. Try again.")

        saved = []
        for t in raw_tasks:
            task = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "project_id": data.project_id or "",
                "title": str(t.get("title", "Untitled"))[:100],
                "description": str(t.get("description", ""))[:500],
                "status": "todo",
                "priority": t.get("priority", "medium") if t.get("priority") in ["critical","high","medium","low"] else "medium",
                "story_points": int(t.get("story_points", 3)),
                "sprint": int(t.get("sprint", 1)),
                "type": t.get("type", "feature") if t.get("type") in ["feature","bug","chore","research"] else "feature",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.sprint_tasks.insert_one(task)
            task["_id"] = str(task["_id"])
            saved.append(task)
        return {"tasks": saved, "count": len(saved)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sprint generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- TASKS CRUD ---

@api_router.get("/tasks")
async def list_tasks(project_id: Optional[str] = None, current_user=Depends(get_current_user)):
    q = {"user_id": current_user["id"]}
    if project_id:
        q["project_id"] = project_id
    tasks = await db.sprint_tasks.find(q).sort("sprint", 1).to_list(500)
    for t in tasks:
        t["_id"] = str(t["_id"])
    return tasks

@api_router.post("/tasks")
async def create_task(data: TaskCreate, current_user=Depends(get_current_user)):
    task = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "project_id": data.project_id or "",
        "title": data.title,
        "description": data.description,
        "status": data.status,
        "priority": data.priority,
        "story_points": data.story_points,
        "sprint": data.sprint,
        "type": data.type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sprint_tasks.insert_one(task)
    task["_id"] = str(task["_id"])
    return task

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: TaskUpdate, current_user=Depends(get_current_user)):
    t = await db.sprint_tasks.find_one({"id": task_id, "user_id": current_user["id"]})
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.sprint_tasks.update_one({"id": task_id}, {"$set": update_data})
    t = await db.sprint_tasks.find_one({"id": task_id})
    t["_id"] = str(t["_id"])
    return t

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user=Depends(get_current_user)):
    result = await db.sprint_tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Deleted"}

# --- MEMORY ---

@api_router.get("/memory")
async def list_memory_docs(project_id: Optional[str] = None, current_user=Depends(get_current_user)):
    q = {"user_id": current_user["id"]}
    if project_id:
        q["project_id"] = project_id
    docs = await db.memory_docs.find(q).sort("created_at", -1).to_list(200)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

@api_router.post("/memory")
async def create_memory_doc(data: MemoryDocCreate, current_user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": data.title,
        "content": data.content,
        "source_type": data.source_type,
        "project_id": data.project_id,
        "word_count": len(data.content.split()),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.memory_docs.insert_one(doc)
    doc["_id"] = str(doc["_id"])
    return doc

@api_router.delete("/memory/{doc_id}")
async def delete_memory_doc(doc_id: str, current_user=Depends(get_current_user)):
    result = await db.memory_docs.delete_one({"id": doc_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Deleted"}

@api_router.post("/memory/search")
async def search_memory_docs(data: SearchRequest, current_user=Depends(get_current_user)):
    query_words = data.query.lower().split()
    q = {"user_id": current_user["id"]}
    if data.project_id:
        q["project_id"] = data.project_id
    docs = await db.memory_docs.find(q).to_list(500)
    scored = []
    for doc in docs:
        score = sum(1 for w in query_words if w in doc.get("content", "").lower() or w in doc.get("title", "").lower())
        if score > 0:
            scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [d for _, d in scored[:data.limit]]
    for d in results:
        d["_id"] = str(d["_id"])
    return results

# --- STATS ---

@api_router.get("/stats")
async def get_stats(current_user=Depends(get_current_user)):
    projects_count = await db.projects.count_documents({"user_id": current_user["id"]})
    memory_count = await db.memory_docs.count_documents({"user_id": current_user["id"]})
    ai_queries_count = await db.ai_queries.count_documents({"user_id": current_user["id"]})
    recent_projects = await db.projects.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(5)
    for p in recent_projects:
        p["_id"] = str(p["_id"])
    return {
        "projects_count": projects_count,
        "memory_count": memory_count,
        "ai_queries_count": ai_queries_count,
        "recent_projects": recent_projects
    }

# ========== APP ==========

app = FastAPI(title="GhostBoard AI API", docs_url="/api/docs")
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.projects.create_index("user_id")
    await db.memory_docs.create_index("user_id")
    await db.ai_queries.create_index("user_id")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@ghostboard.ai")
    admin_password = os.environ.get("ADMIN_PASSWORD", "GhostBoard123!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    logger.info("GhostBoard AI backend started")

@app.on_event("shutdown")
async def shutdown():
    _client.close()
