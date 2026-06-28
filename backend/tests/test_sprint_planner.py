"""Sprint Planner API tests - Tasks CRUD and Sprint Generation"""
import pytest
import requests
import os
import time

BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL') or 'http://localhost:8000').rstrip('/')

@pytest.fixture(scope="module")
def auth_headers():
    # Auth is via Clerk; tests use the non-production mock_test_token shortcut.
    return {"Authorization": "Bearer mock_test_token"}

# --- GET /api/tasks ---
def test_get_tasks_empty_or_list(auth_headers):
    """GET /api/tasks returns list"""
    resp = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    print(f"GET /api/tasks: {len(data)} tasks found")

# --- POST /api/tasks ---
def test_create_task(auth_headers):
    """POST /api/tasks creates a task"""
    payload = {
        "title": "TEST_Build login feature",
        "description": "Implement login with JWT",
        "status": "todo",
        "priority": "high",
        "story_points": 5,
        "sprint": 1,
        "type": "feature",
        "project_id": ""
    }
    resp = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=auth_headers)
    assert resp.status_code == 200, f"Create failed: {resp.text}"
    data = resp.json()
    assert data["title"] == payload["title"]
    assert data["status"] == "todo"
    assert "id" in data
    print(f"Created task id: {data['id']}")
    return data["id"]

@pytest.fixture(scope="module")
def created_task_id(auth_headers):
    payload = {
        "title": "TEST_Task for CRUD",
        "description": "test description",
        "status": "todo",
        "priority": "medium",
        "story_points": 3,
        "sprint": 1,
        "type": "feature",
        "project_id": ""
    }
    resp = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    task_id = resp.json()["id"]
    yield task_id
    # cleanup
    requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)

# --- PUT /api/tasks/:id ---
def test_update_task_status(auth_headers, created_task_id):
    """PUT /api/tasks/:id updates task status"""
    resp = requests.put(f"{BASE_URL}/api/tasks/{created_task_id}", json={"status": "in_progress"}, headers=auth_headers)
    assert resp.status_code == 200, f"Update failed: {resp.text}"
    data = resp.json()
    assert data["status"] == "in_progress"
    print(f"Updated task {created_task_id} to in_progress")

def test_update_task_not_found(auth_headers):
    """PUT /api/tasks/nonexistent returns 404"""
    resp = requests.put(f"{BASE_URL}/api/tasks/nonexistent-id", json={"status": "done"}, headers=auth_headers)
    assert resp.status_code == 404

# --- DELETE /api/tasks/:id ---
def test_delete_task(auth_headers):
    """DELETE /api/tasks/:id removes task"""
    # create a task first
    payload = {
        "title": "TEST_Task to delete",
        "description": "will be deleted",
        "status": "todo",
        "priority": "low",
        "story_points": 1,
        "sprint": 1,
        "type": "chore",
        "project_id": ""
    }
    create_resp = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=auth_headers)
    assert create_resp.status_code == 200
    task_id = create_resp.json()["id"]

    del_resp = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
    assert del_resp.status_code == 200, f"Delete failed: {del_resp.text}"
    
    # Verify deleted - task should no longer appear in list or return 404
    tasks = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers).json()
    ids = [t["id"] for t in tasks]
    assert task_id not in ids, "Task should be deleted from list"
    print(f"Deleted task {task_id} successfully")

def test_delete_task_not_found(auth_headers):
    """DELETE /api/tasks/nonexistent returns 404"""
    resp = requests.delete(f"{BASE_URL}/api/tasks/nonexistent-id", headers=auth_headers)
    assert resp.status_code == 404

# --- POST /api/ai/sprint ---
def test_generate_sprint_plan(auth_headers):
    """POST /api/ai/sprint generates tasks (may take 15-30s)"""
    payload = {
        "idea": "Build a todo app with React and Node.js",
        "team_size": 2,
        "num_sprints": 3,
        "sprint_duration": "2 weeks"
    }
    print("Calling /api/ai/sprint - may take 15-30s...")
    resp = requests.post(f"{BASE_URL}/api/ai/sprint", json=payload, headers=auth_headers, timeout=90)
    assert resp.status_code == 200, f"Sprint gen failed: {resp.text}"
    data = resp.json()
    assert "tasks" in data
    assert "count" in data
    assert data["count"] > 0
    assert len(data["tasks"]) > 0
    task = data["tasks"][0]
    assert "id" in task
    assert "title" in task
    assert "status" in task
    assert "sprint" in task
    print(f"Sprint generation returned {data['count']} tasks")
    
    # cleanup generated tasks
    for t in data["tasks"]:
        requests.delete(f"{BASE_URL}/api/tasks/{t['id']}", headers=auth_headers)
