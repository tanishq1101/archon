import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import db
from backend.auth import get_current_user
from backend.memory_search import rank_docs

router = APIRouter(prefix="/memory", tags=["Memory"])

class MemoryDocCreate(BaseModel):
    title: str
    content: str
    source_type: str = "text"
    project_id: Optional[str] = None

class MemoryDocUpdate(BaseModel):
    title: str
    content: str
    source_type: str = "text"
    project_id: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    project_id: Optional[str] = None
    limit: int = 5

@router.get("")
async def list_memory_docs(project_id: Optional[str] = None, current_user=Depends(get_current_user)):
    q = {"user_id": current_user["id"]}
    if project_id:
        q["project_id"] = project_id
    docs = await db.memory_docs.find(q).sort("created_at", -1).to_list(200)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

@router.post("")
async def create_memory_doc(data: MemoryDocCreate, current_user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": data.title,
        "content": data.content,
        "source_type": data.source_type,
        "project_id": data.project_id,
        "word_count": len(data.content.split()),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.memory_docs.insert_one(doc)
    doc["_id"] = str(doc["_id"])
    return doc

@router.put("/{doc_id}")
async def update_memory_doc(doc_id: str, data: MemoryDocUpdate, current_user=Depends(get_current_user)):
    existing = await db.memory_docs.find_one({"id": doc_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await db.memory_docs.update_one(
        {"id": doc_id, "user_id": current_user["id"]},
        {"$set": {
            "title": data.title,
            "content": data.content,
            "source_type": data.source_type,
            "project_id": data.project_id,
            "word_count": len(data.content.split())
        }}
    )
    
    updated = await db.memory_docs.find_one({"id": doc_id, "user_id": current_user["id"]})
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/{doc_id}")
async def delete_memory_doc(doc_id: str, current_user=Depends(get_current_user)):
    result = await db.memory_docs.delete_one({"id": doc_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Deleted"}

@router.post("/context")
async def get_memory_context(data: SearchRequest, current_user=Depends(get_current_user)):
    """Returns ranked docs that match a query — used for pre-query source preview."""
    q = {"user_id": current_user["id"]}
    if data.project_id:
        q["project_id"] = data.project_id
    docs = await db.memory_docs.find(q).to_list(200)
    scored = rank_docs(data.query, docs, data.limit, min_word_len=3)
    result = [{"id": d["id"], "title": d["title"], "source_type": d["source_type"], "score": s, "word_count": d.get("word_count", 0)} for s, d in scored]
    return {"docs": result, "total_searched": len(docs)}

@router.post("/search")
async def search_memory_docs(data: SearchRequest, current_user=Depends(get_current_user)):
    q = {"user_id": current_user["id"]}
    if data.project_id:
        q["project_id"] = data.project_id
    docs = await db.memory_docs.find(q).to_list(500)
    results = [d for _, d in rank_docs(data.query, docs, data.limit)]
    for d in results:
        d["_id"] = str(d["_id"])
    return results
