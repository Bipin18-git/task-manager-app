from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from models import RoleEnum, TaskStatus

# --- User Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.member  # Default member rahega

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: RoleEnum

    class Config:
        from_attributes = True

# --- Token Schema ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- Task Schemas ---
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[int] = None

class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    due_date: Optional[datetime]
    project_id: int
    assigned_to: Optional[int]

    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    owner_id: int
    created_at: datetime
    tasks: List[TaskResponse] = []  # Project ke andar uske tasks bhi dikhenge

    class Config:
        from_attributes = True