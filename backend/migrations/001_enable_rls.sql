-- Defense-in-depth: enable Row-Level Security on all Ghostboard tables.
--
-- Context: the backend talks to Supabase with the SERVICE-ROLE key, which
-- bypasses RLS. All per-user scoping is enforced in application code
-- (every query filters by user_id). RLS here is a second line of defense:
-- with RLS enabled and no permissive policies, the anon / publishable key
-- can read or write NOTHING. So if that key ever leaks to the client or is
-- used by mistake, the data stays locked to the trusted server only.
--
-- NOTE: Clerk issues the JWTs, not Supabase, so there is no Supabase
-- `auth.uid()` to bind policies to. That is exactly why user scoping lives
-- in the app layer; this migration just guarantees the tables are not world
-- readable through a lower-privilege key.
--
-- Run once against the project (Supabase SQL editor or `supabase db push`).

ALTER TABLE public.ghostboard_projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_memory_docs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_ai_queries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_users        ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners, so only the service-role bypass remains.
ALTER TABLE public.ghostboard_projects     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_tasks        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_memory_docs  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_ai_queries   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ghostboard_users        FORCE ROW LEVEL SECURITY;

-- No CREATE POLICY statements: with RLS enabled and zero permissive policies,
-- the anon and authenticated roles are denied all access by default. The
-- service-role key (used only by the backend) continues to work.
