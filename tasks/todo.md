# Ghostboard AI — Security & Correctness Fixes

Plan to resolve all issues raised in the Claude co-work review.

## Critical security
- [x] 1. Gate `mock_test_token` / `mock_test_token_2` backdoor behind non-production env (`auth.py` + `server.py` middleware)
- [x] 2. Remove hardcoded OpenRouter key from `backend/test_key.py`; untrack it; add `.env.example`
- [x] 3. Tenant isolation: re-confirm ownership in `projects.py` update (memory already scoped); add Postgres RLS migration
- [x] 4. Stop leaking internals in `general_exception_handler` (generic message to client, detail logged server-side)
- [x] 5. Rate-limit by authenticated user_id instead of IP only

## Functional bugs
- [x] 6. Fix broken `test_ghostboard.py` + `test_sprint_planner.py` (used dead password-login API)
- [x] 7. Dedupe memory ranking logic into one helper (`backend/memory_search.py`)
- [x] 8. Make sprint generation atomic (single `insert_many`, no orphaned half-sprint)
- [x] 9. Stream OpenRouter errors as a distinct SSE error event (not fake assistant content)
- [x] 10. Update `requirements.txt` (dropped Mongo/JWT/bcrypt/boto3/pandas/numpy/jose/typer) + fixed `PRD.md`
- [x] 11. Moved token to in-memory only (no localStorage) in `AuthContext` + `useAIStream`

## Infra
- [x] 12. Added GitHub Actions CI (backend compile/lint + frontend build)

## Review

### What changed
- **Auth backdoor** — `mock_test_token`(_2) now resolved via `MOCK_USERS` and only honored
  when `ENVIRONMENT != "production"`. Verified live: works in dev, returns 401 in prod.
- **Secrets** — hardcoded OpenRouter key removed from `test_key.py` (now reads env); file
  untracked + gitignored. Added `backend/.env.example` (gitignore exception added).
  NOTE: the three live keys in `backend/.env` must still be rotated manually — they were
  on disk in plaintext and should be treated as compromised. (Cannot be done from code.)
- **Tenant isolation** — `update_project` now re-scopes write/read by `user_id`; added
  `backend/migrations/001_enable_rls.sql` locking tables to the service-role key.
- **Exception handler** — returns generic message; full detail logged server-side only.
- **Rate limiting** — keyed by authenticated user (`_rate_limit_key`), IP fallback.
- **Sprint atomicity** — new `insert_many`; whole sprint persists in one request.
- **AI errors** — emitted as `{"error": {...}}` SSE events; frontend already styles these.
- **RAG ranking** — single `rank_docs` helper shared by memory + ai routers.
- **Frontend tokens** — JWT no longer persisted to localStorage; kept in-memory ref.

### Verification
- `python -m compileall backend` → OK; flake8 (E9/F63/F7/F82) clean.
- Backend boots; Clerk JWKS loads.
- Live checks: dev mock token works / prod rejects (401); register+login → 400; no-token → 401;
  memory create/search/context ranking OK.
- `pytest test_ghostboard.py` → 8 passed; `test_clerk_supabase.py` (non-AI) → 10 passed.
- `npm run build` → Compiled successfully; no remaining `ghostboard_token` references.

### Not done (out of code-fix scope, flagged)
- Rotating the leaked keys (manual, in Supabase/Clerk/OpenRouter dashboards).
- True vector RAG (pgvector embeddings) — large feature; ranking still keyword-based.
- Applying the RLS migration to the live DB (run `001_enable_rls.sql` in Supabase).
