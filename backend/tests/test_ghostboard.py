"""Backend tests for Archon AI — auth-migration guards, memory search, stats.

These complement test_clerk_supabase.py (CRUD coverage). They run against a live
server at BASE_URL using the non-production `mock_test_token` shortcut.

    REACT_APP_BACKEND_URL=http://localhost:8000 pytest backend/tests/test_archon.py
"""
import os
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "http://localhost:8000").rstrip("/")
TEST_HEADERS = {"Authorization": "Bearer mock_test_token"}


# --- AUTH MIGRATION GUARDS ---

class TestAuthMigration:
    """Password auth was removed in favor of Clerk; the old endpoints must
    now reject with 400 and /me must work off the verified token."""

    def test_register_is_disabled(self):
        resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": "x@example.com", "name": "X", "password": "Pass123!"},
        )
        assert resp.status_code == 400
        print("PASS: /auth/register is disabled (Clerk-only)")

    def test_login_is_disabled(self):
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "x@example.com", "password": "Pass123!"},
        )
        assert resp.status_code == 400
        print("PASS: /auth/login is disabled (Clerk-only)")

    def test_auth_me(self):
        resp = requests.get(f"{BASE_URL}/api/auth/me", headers=TEST_HEADERS)
        assert resp.status_code == 200
        assert resp.json()["email"] == "test_user@example.com"
        print("PASS: /auth/me returns the verified user")

    def test_auth_me_no_token(self):
        resp = requests.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 401
        print("PASS: /auth/me without token returns 401")


# --- PROJECTS ---

class TestProjects:
    def test_list_projects(self):
        resp = requests.get(f"{BASE_URL}/api/projects", headers=TEST_HEADERS)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        print("PASS: List projects returns list")

    def test_create_get_delete_project(self):
        payload = {"title": "TEST_Project", "description": "A test project", "idea": "Test idea", "tech_stack": ["Python", "React"]}
        resp = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=TEST_HEADERS)
        assert resp.status_code == 200
        project_id = resp.json()["id"]

        get_resp = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=TEST_HEADERS)
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "TEST_Project"

        del_resp = requests.delete(f"{BASE_URL}/api/projects/{project_id}", headers=TEST_HEADERS)
        assert del_resp.status_code == 200
        assert requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=TEST_HEADERS).status_code == 404
        print("PASS: Project create/get/delete works")


# --- MEMORY (search + context ranking) ---

class TestMemory:
    def test_search_and_context(self):
        payload = {"title": "TEST_SearchDoc", "content": "archon architecture microservices design"}
        doc_id = requests.post(f"{BASE_URL}/api/memory", json=payload, headers=TEST_HEADERS).json()["id"]
        try:
            search_resp = requests.post(f"{BASE_URL}/api/memory/search", json={"query": "microservices"}, headers=TEST_HEADERS)
            assert search_resp.status_code == 200
            assert any(d["id"] == doc_id for d in search_resp.json())

            ctx_resp = requests.post(f"{BASE_URL}/api/memory/context", json={"query": "microservices architecture"}, headers=TEST_HEADERS)
            assert ctx_resp.status_code == 200
            assert "docs" in ctx_resp.json() and "total_searched" in ctx_resp.json()
            print("PASS: Memory search + context ranking works")
        finally:
            requests.delete(f"{BASE_URL}/api/memory/{doc_id}", headers=TEST_HEADERS)


# --- STATS ---

class TestStats:
    def test_get_stats(self):
        resp = requests.get(f"{BASE_URL}/api/stats", headers=TEST_HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        for key in ("projects_count", "memory_count", "ai_queries_count", "recent_projects"):
            assert key in data
        print("PASS: Stats endpoint returns correct structure")
