# GhostBoard AI

GhostBoard AI is a functional, beautiful, and secure AI-powered SaaS for developer project blueprinting, agile sprint ticket breakdown (with interactive Kanban), expert CTO advisory, and context-grounded RAG memory.

Built with a FastAPI backend, a React frontend, Clerk authentication, Supabase data persistence, and OpenRouter LLM streaming.

---

## Architecture & Stack

- **Backend:** FastAPI (Python 3.10+), PyJWT, Uvicorn, Supabase Python Client (with custom Mongo-like API wrappers).
- **Frontend:** React (Create React App + Craco), Radix UI (dialogs & accordions), Tailwind CSS, Framer Motion, and Lucide icons.
- **Third-Party Services:**
  - **Clerk:** Authentication & session tokens
  - **Supabase:** Relational PostgreSQL data store (RLS enabled)
  - **OpenRouter:** Fast LLM inference with Gemini-2.5-Flash

---

## Getting Started

### 1. Environment Setup

#### Backend (`backend/.env`)
Copy the template and fill in the secrets:
```bash
cp backend/.env.example backend/.env
```
Ensure the following keys are set:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_SECRET_KEY` and `CLERK_JWKS_URL`
- `OPENROUTER_API_KEY`
- `AI_MODEL` (e.g. `google/gemini-2.5-flash:free` or `deepseek/deepseek-chat`)

#### Frontend (`frontend/.env`)
Copy the template and fill in the publishable keys:
```bash
cp frontend/.env.example frontend/.env
```
Ensure the following variables are configured:
- `REACT_APP_CLERK_PUBLISHABLE_KEY`
- `REACT_APP_BACKEND_URL` (usually `http://localhost:8000`)

---

### 2. Running Local Dev Servers

You can spin up both backend and frontend servers in parallel using the provided helper script:

```bash
./scripts/start.sh
```

Alternatively, you can run them manually in separate terminals:

#### Manual Backend Run
```bash
# From workspace root
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

#### Manual Frontend Run
```bash
# From frontend/ directory
cd frontend
npm install --legacy-peer-deps
npm start
```

---

## Running Tests

Automated integration tests verify authentications, blueprint creations, memory context rankings, and statistics endpoints.

```bash
# Start backend server, then run tests
pytest backend/tests/
```

To run a specific test suite:
```bash
pytest backend/tests/test_ghostboard.py
pytest backend/tests/test_sprint_planner.py
```
