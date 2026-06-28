"""
User authentication routes: login, register, logout
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from fastapi.responses import JSONResponse

from app.services.auth import (
    register_user, authenticate_user, create_token, verify_token,
    get_user_data, get_user_entries, change_password
)

router = APIRouter(prefix="/api/users", tags=["users"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    username: str
    currentPassword: str
    newPassword: str


@router.options("/register")
async def options_register():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })


@router.options("/login")
async def options_login():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })


@router.post("/register")
async def register(req: RegisterRequest):
    """Register a new user"""
    if not req.username or not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Username, email, and password required")
    
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    result = register_user(req.username, req.email, req.password)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    # Create token for auto-login after registration
    token = create_token(req.username)
    return {"success": True, "message": "Registration successful", "token": token, "username": req.username, "email": req.email}


@router.post("/login")
async def login(req: LoginRequest):
    """Login user and return JWT token"""
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    user = authenticate_user(req.username, req.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_token(req.username)
    
    return {
        "success": True,
        "token": token,
        "username": req.username,
        "email": user["email"],
        "message": "Login successful"
    }


@router.options("/change-password")
async def options_change_password():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    })


@router.post("/change-password")
async def change_pwd(req: ChangePasswordRequest):
    """Change user password"""
    if not req.username or not req.currentPassword or not req.newPassword:
        raise HTTPException(status_code=400, detail="Username, current password, and new password required")
    
    if len(req.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    result = change_password(req.username, req.currentPassword, req.newPassword)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return {"success": True, "message": result["message"]}
@router.get("/profile")
async def get_profile(token: str = None):
    """Get user profile - requires token in query param"""
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    username = payload.get("username")
    user_data = get_user_data(username)
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_data


@router.get("/entries")
async def get_entries(token: str = None):
    """Get user's analysis entries - requires token"""
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    username = payload.get("username")
    entries = get_user_entries(username)
    
    return {"entries": entries[-30:]}  # Return last 30 entries
