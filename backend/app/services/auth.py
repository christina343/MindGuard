"""
Authentication service using JWT tokens.
Simple user management with in-memory storage.
"""

import jwt
import hashlib
import json
import os
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "mindguard-secret-key-change-in-production"
ALGORITHM = "HS256"
USERS_FILE = os.path.join(os.path.dirname(__file__), "../users.json")


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def load_users():
    """Load users from JSON file"""
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        return {}
    except:
        return {}


def save_users(users: dict):
    """Save users to JSON file"""
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def register_user(username: str, email: str, password: str) -> dict:
    """Register a new user by username (primary key)"""
    users = load_users()
    
    # Check if username already exists
    if username in users:
        return {"success": False, "message": "Username already taken"}
    
    # Check if email already registered
    for user_data in users.values():
        if user_data.get("email") == email:
            return {"success": False, "message": "Email already registered"}
    
    users[username] = {
        "email": email,
        "password": hash_password(password),
        "created_at": datetime.now().isoformat(),
        "entries": []
    }
    save_users(users)
    return {"success": True, "message": "User registered successfully"}


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate user by username and password"""
    users = load_users()
    
    # Look up user by username
    if username not in users:
        return None
    
    user = users[username]
    if user["password"] != hash_password(password):
        return None
    
    return {
        "username": username,
        "email": user["email"],
        "created_at": user["created_at"]
    }


def create_token(username: str, expires_in_hours: int = 24) -> str:
    """Create JWT token with username"""
    payload = {
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_data(username: str) -> Optional[dict]:
    """Get user data by username"""
    users = load_users()
    if username not in users:
        return None
    
    user = users[username]
    return {
        "username": username,
        "email": user["email"],
        "created_at": user["created_at"],
        "entries_count": len(user.get("entries", []))
    }


def save_user_entry(username: str, entry: dict):
    """Save an entry for a user"""
    users = load_users()
    if username not in users:
        return False
    
    if "entries" not in users[username]:
        users[username]["entries"] = []
    
    users[username]["entries"].append(entry)
    save_users(users)
    return True


def get_user_entries(username: str) -> list:
    """Get all entries for a user"""
    users = load_users()
    if username not in users:
        return []
    
    return users[username].get("entries", [])


def change_password(username: str, current_password: str, new_password: str) -> dict:
    """Change password for a user"""
    users = load_users()
    
    # Check if user exists
    if username not in users:
        return {"success": False, "message": "User not found"}
    
    user = users[username]
    
    # Verify current password
    if user["password"] != hash_password(current_password):
        return {"success": False, "message": "Current password is incorrect"}
    
    # Update password
    user["password"] = hash_password(new_password)
    save_users(users)
    
    return {"success": True, "message": "Password changed successfully"}
