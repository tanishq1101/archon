from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(data: RegisterRequest):
    raise HTTPException(status_code=400, detail="Registration must be performed via Clerk on the client side.")

@router.post("/login")
async def login(data: LoginRequest):
    raise HTTPException(status_code=400, detail="Login must be performed via Clerk on the client side.")

@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return current_user
