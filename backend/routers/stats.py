from fastapi import APIRouter, Depends
from backend.database import db
from backend.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("")
async def get_stats(current_user=Depends(get_current_user)):
    projects_count = await db.projects.count_documents({"user_id": current_user["id"]})
    memory_count = await db.memory_docs.count_documents({"user_id": current_user["id"]})
    ai_queries_count = await db.ai_queries.count_documents({"user_id": current_user["id"]})
    recent_projects = await db.projects.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(5)
    for p in recent_projects:
        p["_id"] = str(p["_id"])
    return {
        "projects_count": projects_count,
        "memory_count": memory_count,
        "ai_queries_count": ai_queries_count,
        "recent_projects": recent_projects
    }
