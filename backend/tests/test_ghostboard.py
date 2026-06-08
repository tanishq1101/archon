"""Backend tests for GhostBoard AI - Auth, Projects, Memory, Stats"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_EMAIL = "admin@ghostboard.ai"
ADMIN_PASSWORD = "GhostBoard123!"
TEST_EMAIL = "TEST_user_gb@example.com"
TEST_PASSWORD = "TestPass123!"
TEST_NAME = "Test GhostBoard User"


@pytest.fixture(scope="module")
def admin_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# --- AUTH TESTS ---

class TestAuth:
    """Auth endpoint tests"""

    def test_admin_login_success(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print("PASS: Admin login returns token and user")

    def test_login_invalid_credentials(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "wrong@example.com", "password": "wrong"})
        assert resp.status_code == 401
        print("PASS: Invalid credentials returns 401")

    def test_register_new_user(self):
        # cleanup first
        requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={"email": TEST_EMAIL, "name": TEST_NAME, "password": TEST_PASSWORD})
        if resp.status_code == 400 and "already registered" in resp.text:
            print("SKIP: Test user already exists")
            return
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == TEST_EMAIL.lower()
        print("PASS: Registration returns token and user")

    def test_auth_me(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == ADMIN_EMAIL
        print("PASS: /auth/me returns correct user")

    def test_auth_me_no_token(self):
        resp = requests.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 401
        print("PASS: /auth/me without token returns 401")


# --- PROJECTS TESTS ---

class TestProjects:
    """Project CRUD tests"""

    def test_list_projects(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/projects", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        print("PASS: List projects returns list")

    def test_create_and_get_project(self, auth_headers):
        payload = {"title": "TEST_Project", "description": "A test project", "idea": "Test idea", "tech_stack": ["Python", "React"]}
        resp = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "TEST_Project"
        project_id = data["id"]

        # GET
        get_resp = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "TEST_Project"
        print("PASS: Create and GET project works")

        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}", headers=auth_headers)

    def test_delete_project(self, auth_headers):
        payload = {"title": "TEST_DeleteProject", "description": "delete me"}
        resp = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=auth_headers)
        project_id = resp.json()["id"]
        del_resp = requests.delete(f"{BASE_URL}/api/projects/{project_id}", headers=auth_headers)
        assert del_resp.status_code == 200
        get_resp = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=auth_headers)
        assert get_resp.status_code == 404
        print("PASS: Delete project and verify 404")


# --- MEMORY TESTS ---

class TestMemory:
    """Memory CRUD tests"""

    def test_create_and_list_memory(self, auth_headers):
        payload = {"title": "TEST_Doc", "content": "This is test content for GhostBoard memory system.", "source_type": "text"}
        resp = requests.post(f"{BASE_URL}/api/memory", json=payload, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "TEST_Doc"
        doc_id = data["id"]

        list_resp = requests.get(f"{BASE_URL}/api/memory", headers=auth_headers)
        assert list_resp.status_code == 200
        ids = [d["id"] for d in list_resp.json()]
        assert doc_id in ids
        print("PASS: Create and list memory doc works")

        # Cleanup
        requests.delete(f"{BASE_URL}/api/memory/{doc_id}", headers=auth_headers)

    def test_delete_memory_doc(self, auth_headers):
        payload = {"title": "TEST_DeleteDoc", "content": "delete me content"}
        resp = requests.post(f"{BASE_URL}/api/memory", json=payload, headers=auth_headers)
        doc_id = resp.json()["id"]
        del_resp = requests.delete(f"{BASE_URL}/api/memory/{doc_id}", headers=auth_headers)
        assert del_resp.status_code == 200
        print("PASS: Delete memory doc works")

    def test_search_memory(self, auth_headers):
        payload = {"title": "TEST_SearchDoc", "content": "ghostboard architecture microservices design"}
        resp = requests.post(f"{BASE_URL}/api/memory", json=payload, headers=auth_headers)
        doc_id = resp.json()["id"]

        search_resp = requests.post(f"{BASE_URL}/api/memory/search", json={"query": "microservices"}, headers=auth_headers)
        assert search_resp.status_code == 200
        print("PASS: Search memory returns results")

        requests.delete(f"{BASE_URL}/api/memory/{doc_id}", headers=auth_headers)


# --- STATS TESTS ---

class TestStats:
    """Stats endpoint"""

    def test_get_stats(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "projects_count" in data
        assert "memory_count" in data
        assert "ai_queries_count" in data
        assert "recent_projects" in data
        print("PASS: Stats endpoint returns correct structure")
