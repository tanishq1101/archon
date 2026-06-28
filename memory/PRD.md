# GhostBoard AI — Product Requirements Document

## Overview
GhostBoard AI is an AI-powered autonomous project operating system for hackathons, startup teams, AI engineers, and developers.

## Problem Statement
Developers and teams waste time on project planning, architecture decisions, and context-switching. GhostBoard AI automates the cognitive overhead of technical project management.

## Target Users
- Hackathon teams
- Startup developers
- AI engineers
- Solo indie hackers

## Architecture

### Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: FastAPI (Python), Supabase (Postgres) via the Supabase Python client
- **AI**: OpenRouter API (configurable via `AI_MODEL`, defaults to a free Gemini model)
- **Auth**: Clerk (frontend SDK + backend JWKS/RS256 verification). No passwords are
  stored or verified server-side — registration/login happen client-side via Clerk.

> Historical note: an earlier iteration used MongoDB + JWT/bcrypt. That stack has
> been fully replaced by Supabase + Clerk; the backend no longer uses Mongo, Motor,
> bcrypt, or server-issued JWTs.

### Key Components
- `server.py` - FastAPI app: middleware, exception handlers, router wiring, static serving
- `auth.py` - Clerk JWKS fetch + `get_current_user` (RS256 verification)
- `database.py` - Supabase client + Mongo-style collection wrapper
- `routers/` - `auth`, `projects`, `tasks`, `memory`, `ai`, `stats`
- `context/AuthContext.js` - Clerk-backed auth state management
- `hooks/useAIStream.js` - Reusable SSE streaming hook for AI responses
- `pages/LandingPage.js` - Cinematic animated landing page
- `pages/AuthPage.js` - Login/Register with animated toggle
- `pages/Dashboard.js` - Stats, recent projects, quick actions
- `pages/ProjectArchitect.js` - AI blueprint generator with streaming
- `pages/CTODashboard.js` - AI CTO console with streaming
- `pages/RAGMemory.js` - Document management + AI query interface
- `components/Navbar.js` - Glass-morphism navigation

## Features Implemented (Phase 2 — 2026-02)

### 5. AI Sprint Planner (NEW)
- AI generates 15-25 sprint tasks from project description via OpenRouter
- 4-column glassmorphism Kanban board: Backlog → In Progress → In Review → Done
- HTML5 drag-and-drop with Framer Motion layout animations on card transitions
- Task cards: priority color-coded left border + badges (type, priority, story points, sprint)
- Sprint tabs filter view by sprint number with task count
- Progress bar: done story points / total story points %
- Manual task creation modal with all fields
- Delete tasks inline
- Cinematic AI generation overlay with pulsing rings animation
- Animated empty state with pulsing branded icon

## Features Implemented (Phase 1 — 2026-02)

### 1. Authentication System
- Register / Login handled client-side by Clerk
- Backend verifies Clerk-issued RS256 JWTs against the Clerk JWKS endpoint
- Protected routes with loading state
- `mock_test_token` shortcut for tests — disabled when `ENVIRONMENT=production`

### 2. AI Project Architect
- Free-form idea input
- Tech stack selector (16 options + custom)
- Team size slider + timeline selector
- Real-time streaming blueprint generation via OpenRouter
- Copy to clipboard + Save as project

### 3. AI CTO Console
- Technical question input with context field
- 6 category selectors (Architecture, Security, Scalability, DevOps, Database, Performance)
- Tech stack context input
- 4 quick preset questions
- Real-time streaming AI responses
- Query history tracking

### 4. RAG Memory System
- Add documents (plain text, URL, code)
- Document list with word count display
- Keyword search across documents
- AI query grounded in uploaded documents
- Delete documents

### 5. Dashboard
- Project count, memory docs, AI queries stats
- Recent projects list with status badges
- Quick action links to all AI features
- Pro tip banner

### 6. Landing Page
- Cinematic dark glassmorphism hero with animated grid
- Feature cards with hover glow effects
- How it works steps (4-step)
- Stats row + CTA section

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Returns 400 — registration is via Clerk on the client |
| POST | /api/auth/login | No | Returns 400 — login is via Clerk on the client |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/tasks | Yes | List sprint tasks (limit/offset) |
| POST | /api/tasks | Yes | Create task |
| PUT | /api/tasks/:id | Yes | Update task (ownership-checked) |
| DELETE | /api/tasks/:id | Yes | Delete task (ownership-checked) |
| POST | /api/ai/sprint | Yes | Generate + persist a sprint plan |
| POST | /api/memory/context | Yes | Ranked source preview for a query |
| GET | /api/projects | Yes | List projects |
| POST | /api/projects | Yes | Create project |
| PUT | /api/projects/:id | Yes | Update project |
| DELETE | /api/projects/:id | Yes | Delete project |
| GET | /api/stats | Yes | Dashboard stats |
| POST | /api/ai/architect | Yes | AI blueprint (SSE) |
| POST | /api/ai/cto | Yes | AI CTO advice (SSE) |
| POST | /api/ai/query | Yes | RAG query (SSE) |
| GET | /api/memory | Yes | List documents |
| POST | /api/memory | Yes | Add document |
| DELETE | /api/memory/:id | Yes | Delete document |
| POST | /api/memory/search | Yes | Search documents |

## Design System
- Background: #0A0A0C
- Primary: #8B5CF6 (purple)
- Secondary: #06B6D4 (cyan)
- Fonts: Outfit (headings), Manrope (body), JetBrains Mono (code)
- Components: Glassmorphism cards (bg-white/3, backdrop-blur-xl, border-white/8)

## Backlog (Phase 2)

### P0 — Critical for production
- [x] Rate limiting on AI endpoints (per-user, slowapi)
- [x] Error handling for OpenRouter API failures with model fallback + SSE error event
- [ ] Enable Supabase RLS in production (migration in `backend/migrations/001_enable_rls.sql`)
- [ ] Rotate the secrets that were previously committed to disk (Supabase service role, Clerk, OpenRouter)

### P1 — High value
- [ ] Project detail page with full blueprint view
- [ ] Real-time collaboration (WebSockets)
- [ ] GitHub repo URL ingestion for RAG
- [ ] Autonomous task generator (AI breaks project into tasks)
- [ ] Sprint planner AI feature

### P2 — Nice to have
- [ ] Team management (invite members)
- [ ] Export project blueprint as PDF
- [ ] Model selection per AI feature
- [ ] Vector embeddings for RAG (replace keyword search)
- [ ] AI activity feed with history

## Environment Variables
See `backend/.env.example` for the template. Required:
```
ENVIRONMENT=development            # set to "production" to disable mock_test_token
SUPABASE_URL=<project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only; bypasses RLS
CLERK_SECRET_KEY=<clerk-secret>
CLERK_JWKS_URL=<clerk-jwks-url>
OPENROUTER_API_KEY=<user-provided>
AI_MODEL=google/gemini-2.5-flash:free
```
