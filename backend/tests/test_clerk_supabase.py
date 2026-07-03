"""Automated integration tests for Archon AI Clerk + Supabase Hybrid Backend"""
import pytest
import requests
import os
import uuid

BASE_URL = "http://localhost:8000"
TEST_HEADERS = {"Authorization": "Bearer mock_test_token"}

# --- AUTH TESTS ---

def test_auth_me():
    """GET /api/auth/me returns the mocked Clerk user"""
    resp = requests.get(f"{BASE_URL}/api/auth/me", headers=TEST_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "test_clerk_user_123"
    assert data["email"] == "test_user@example.com"
    print("PASS: /auth/me returns mocked Clerk user")

def test_auth_me_no_token():
    """GET /api/auth/me without token returns 401"""
    resp = requests.get(f"{BASE_URL}/api/auth/me")
    assert resp.status_code == 401
    print("PASS: /auth/me without token returns 401")

# --- PROJECTS TESTS ---

def test_list_projects():
    """GET /api/projects returns projects list"""
    resp = requests.get(f"{BASE_URL}/api/projects", headers=TEST_HEADERS)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    print("PASS: List projects returns list")

def test_create_and_delete_project():
    """POST and DELETE /api/projects handles creation and cleanup in Supabase"""
    payload = {
        "title": "TEST_Clerk_Supabase_Project", 
        "description": "A test project migrating to Supabase", 
        "idea": "Testing database queries", 
        "tech_stack": ["FastAPI", "Supabase", "Clerk"]
    }
    resp = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=TEST_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == payload["title"]
    project_id = data["id"]

    # GET details
    get_resp = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=TEST_HEADERS)
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == payload["title"]
    print("PASS: Create and GET project works via Supabase")

    # Cleanup (DELETE)
    del_resp = requests.delete(f"{BASE_URL}/api/projects/{project_id}", headers=TEST_HEADERS)
    assert del_resp.status_code == 200
    
    # Verify 404
    get_resp_deleted = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=TEST_HEADERS)
    assert get_resp_deleted.status_code == 404
    print("PASS: Delete project works via Supabase")

# --- SPRINT PLANNER TESTS ---

def test_create_and_delete_task():
    """POST, PUT and DELETE /api/tasks handles task CRUD in Supabase"""
    payload = {
        "title": "TEST_Clerk_Supabase_Task",
        "description": "Verify task CRUD",
        "status": "todo",
        "priority": "high",
        "story_points": 5,
        "sprint": 1,
        "type": "feature",
        "project_id": None
    }
    resp = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=TEST_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == payload["title"]
    task_id = data["id"]

    # UPDATE (PUT)
    put_resp = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "in_progress"}, headers=TEST_HEADERS)
    assert put_resp.status_code == 200
    assert put_resp.json()["status"] == "in_progress"
    print("PASS: Create and Update task works via Supabase")

    # Cleanup (DELETE)
    del_resp = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=TEST_HEADERS)
    assert del_resp.status_code == 200
    print("PASS: Delete task works via Supabase")

# --- MEMORY TESTS ---

def test_create_and_list_memory():
    """POST and GET /api/memory handles RAG documents in Supabase"""
    payload = {
        "title": "TEST_Supabase_Doc",
        "content": "Integrating vector databases and RAG memory models.",
        "source_type": "text"
    }
    resp = requests.post(f"{BASE_URL}/api/memory", json=payload, headers=TEST_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == payload["title"]
    doc_id = data["id"]

    list_resp = requests.get(f"{BASE_URL}/api/memory", headers=TEST_HEADERS)
    assert list_resp.status_code == 200
    ids = [d["id"] for d in list_resp.json()]
    assert doc_id in ids
    print("PASS: Create and List memory document works via Supabase")

    # Update (PUT)
    put_resp = requests.put(f"{BASE_URL}/api/memory/{doc_id}", json={
        "title": "TEST_Supabase_Doc_Updated",
        "content": "Updated content for memory document.",
        "source_type": "text"
    }, headers=TEST_HEADERS)
    assert put_resp.status_code == 200
    updated_data = put_resp.json()
    assert updated_data["title"] == "TEST_Supabase_Doc_Updated"
    assert updated_data["content"] == "Updated content for memory document."
    print("PASS: Update memory document works via Supabase")

    # Cleanup
    requests.delete(f"{BASE_URL}/api/memory/{doc_id}", headers=TEST_HEADERS)

# --- STATS TEST ---

def test_get_stats():
    """GET /api/stats returns statistics correctly"""
    resp = requests.get(f"{BASE_URL}/api/stats", headers=TEST_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "projects_count" in data
    assert "memory_count" in data
    assert "ai_queries_count" in data
    print("PASS: Stats endpoint structure verified")

# --- HEALTH ENDPOINT TEST ---

def test_healthz():
    """GET /healthz returns status OK"""
    resp = requests.get(f"{BASE_URL}/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "OK"}
    print("PASS: /healthz returns OK")

# --- SECURITY / OWNERSHIP TESTS ---

def test_task_ownership_security():
    """Verify that user B cannot modify/delete a task owned by user A"""
    # 1. User A (mock_test_token) creates a task
    payload = {
        "title": "TEST_OwnerA_Task",
        "description": "Task for checking ownership",
        "status": "todo",
        "priority": "medium",
        "story_points": 3,
        "sprint": 1,
        "type": "feature",
        "project_id": ""
    }
    resp = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=TEST_HEADERS)
    assert resp.status_code == 200
    task_id = resp.json()["id"]

    # 2. User B (mock_test_token_2) attempts to update the task -> 403
    other_headers = {"Authorization": "Bearer mock_test_token_2"}
    update_resp = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "in_progress"}, headers=other_headers)
    assert update_resp.status_code == 403
    assert "do not own" in update_resp.json()["message"]
    print("PASS: User B blocked from updating User A's task with 403")

    # 3. User B (mock_test_token_2) attempts to delete the task -> 403
    del_resp_other = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=other_headers)
    assert del_resp_other.status_code == 403
    print("PASS: User B blocked from deleting User A's task with 403")

    # 4. User A (mock_test_token) updates successfully -> 200
    update_resp_owner = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "done"}, headers=TEST_HEADERS)
    assert update_resp_owner.status_code == 200
    assert update_resp_owner.json()["status"] == "done"
    print("PASS: User A updates their own task successfully")

    # 5. User A (mock_test_token) deletes successfully -> 200
    del_resp_owner = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=TEST_HEADERS)
    assert del_resp_owner.status_code == 200
    print("PASS: User A deletes their own task successfully")

# --- PAGINATION TESTS ---

def test_tasks_pagination():
    """Verify limit and offset pagination query parameters on /api/tasks"""
    # 1. Create 3 test tasks
    task_ids = []
    for i in range(3):
        payload = {
            "title": f"TEST_Pagination_Task_{i}",
            "description": f"Task number {i}",
            "status": "todo",
            "priority": "low",
            "story_points": 1,
            "sprint": 1,
            "type": "chore",
            "project_id": ""
        }
        resp = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=TEST_HEADERS)
        assert resp.status_code == 200
        task_ids.append(resp.json()["id"])

    # 2. Get with limit=2
    resp_limit = requests.get(f"{BASE_URL}/api/tasks?limit=2", headers=TEST_HEADERS)
    assert resp_limit.status_code == 200
    data_limit = resp_limit.json()
    assert len(data_limit) <= 2
    print(f"PASS: limit=2 returns {len(data_limit)} tasks")

    # 3. Get with limit=1 and offset=1
    resp_offset = requests.get(f"{BASE_URL}/api/tasks?limit=1&offset=1", headers=TEST_HEADERS)
    assert resp_offset.status_code == 200
    data_offset = resp_offset.json()
    assert len(data_offset) <= 1
    print(f"PASS: limit=1&offset=1 returns {len(data_offset)} task")

    # Cleanup
    for t_id in task_ids:
        requests.delete(f"{BASE_URL}/api/tasks/{t_id}", headers=TEST_HEADERS)
    print("PASS: Tasks pagination verification complete")

# --- AI ARCHITECT COMPILER TEST ---

def test_ai_architect_compiler():
    """POST /api/ai/architect generates compiled 3-stage prompts starting with PROJECT UNDERSTANDING"""
    payload = {
        "idea": "Build a simple chat app with React and FastAPI",
        "tech_preferences": ["React", "FastAPI"],
        "team_size": 1,
        "timeline": "2 weeks"
    }
    # OpenRouter calls might take a bit during tests, set timeout to 90s
    resp = requests.post(f"{BASE_URL}/api/ai/architect", json=payload, headers=TEST_HEADERS, timeout=90)
    assert resp.status_code == 200
    
    # Read the streaming response text content by parsing the SSE chunks
    import json
    content = ""
    for line in resp.iter_lines():
        line_str = line.decode("utf-8").strip()
        if line_str.startswith("data: "):
            data_content = line_str[6:]
            if data_content == "[DONE]":
                break
            try:
                parsed = json.loads(data_content)
                content += parsed["choices"][0]["delta"].get("content", "")
            except Exception:
                pass
                
    assert "PROJECT UNDERSTANDING" in content or "PROMPT 1" in content or "PROMPT 2" in content or "PROMPT 3" in content
    print("PASS: AI Architect Prompt Compiler returns expected stage headers")

