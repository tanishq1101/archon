import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import db
from backend.auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

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

@router.get("")
async def list_tasks(
    project_id: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
    current_user=Depends(get_current_user)
):
    q = {"user_id": current_user["id"]}
    if project_id:
        q["project_id"] = project_id
    tasks = await db.sprint_tasks.find(q).sort("sprint", 1).skip(offset).to_list(limit)
    for t in tasks:
        t["_id"] = str(t["_id"])
    return tasks

@router.post("")
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

@router.put("/{task_id}")
async def update_task(task_id: str, data: TaskUpdate, current_user=Depends(get_current_user)):
    t = await db.sprint_tasks.find_one({"id": task_id})
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    if t["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You do not own this task")
        
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.sprint_tasks.update_one({"id": task_id, "user_id": current_user["id"]}, {"$set": update_data})
        
    updated = await db.sprint_tasks.find_one({"id": task_id, "user_id": current_user["id"]})
    updated["_id"] = str(updated["_id"])
    return updated


@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user=Depends(get_current_user)):
    t = await db.sprint_tasks.find_one({"id": task_id})
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    if t["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You do not own this task")
        
    await db.sprint_tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    return {"message": "Deleted"}
