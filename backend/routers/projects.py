import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import db
from backend.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    idea: str = ""
    tech_stack: List[str] = []

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ai_blueprint: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    status: Optional[str] = None

@router.get("")
async def list_projects(current_user=Depends(get_current_user)):
    projects = await db.projects.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    for p in projects:
        p["_id"] = str(p["_id"])
    return projects

@router.post("")
async def create_project(data: ProjectCreate, current_user=Depends(get_current_user)):
    project = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": data.title,
        "description": data.description,
        "idea": data.idea,
        "ai_blueprint": "",
        "tech_stack": data.tech_stack,
        "status": "ideation",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project)
    project["_id"] = str(project["_id"])
    return project

@router.get("/{project_id}")
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    p = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    p["_id"] = str(p["_id"])
    return p

@router.put("/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, current_user=Depends(get_current_user)):
    p = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.projects.update_one({"id": project_id}, {"$set": update_data})
    p = await db.projects.find_one({"id": project_id})
    p["_id"] = str(p["_id"])
    return p

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Deleted"}
