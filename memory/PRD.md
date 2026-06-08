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
- **Backend**: FastAPI (Python), MongoDB (Motor async)
- **AI**: OpenRouter API (deepseek/deepseek-chat by default)
- **Auth**: JWT tokens (localStorage), bcrypt password hashing

### Key Components
- `server.py` - Monolithic FastAPI backend with all routes
- `context/AuthContext.js` - JWT auth state management
- `hooks/useAIStream.js` - Reusable SSE streaming hook for AI responses
- `pages/LandingPage.js` - Cinematic animated landing page
- `pages/AuthPage.js` - Login/Register with animated toggle
- `pages/Dashboard.js` - Stats, recent projects, quick actions
- `pages/ProjectArchitect.js` - AI blueprint generator with streaming
- `pages/CTODashboard.js` - AI CTO console with streaming
- `pages/RAGMemory.js` - Document management + AI query interface
- `components/Navbar.js` - Glass-morphism navigation

## Features Implemented (Phase 1 — 2026-02)

### 1. Authentication System
- Register / Login with JWT tokens
- Protected routes with loading state
- Admin seeding on startup
- bcrypt password hashing

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
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
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
- [ ] Rate limiting on AI endpoints
- [ ] Brute force protection on login
- [ ] Error handling for OpenRouter API failures with retry

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
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=ghostboard_db
JWT_SECRET=<random-64-char-hex>
ADMIN_EMAIL=admin@ghostboard.ai
ADMIN_PASSWORD=GhostBoard123!
OPENROUTER_API_KEY=<user-provided>
AI_MODEL=deepseek/deepseek-chat
```
