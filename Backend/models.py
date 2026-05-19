from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
from datetime import datetime

Base = declarative_base()

# Strict Roles define kar rahe hain
class RoleEnum(str, enum.Enum):
    admin = "Admin"
    member = "Member"

# Task Status define kar rahe hain
class TaskStatus(str, enum.Enum):
    todo = "To Do"
    in_progress = "In Progress"
    done = "Done"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.member, nullable=False)
    
    # Relationships
    tasks_assigned = relationship("Task", back_populates="assignee")
    projects_owned = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="projects_owned")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    due_date = Column(DateTime)
    
    # Foreign Keys
    project_id = Column(Integer, ForeignKey("projects.id"))
    assigned_to = Column(Integer, ForeignKey("users.id")) 
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks_assigned")