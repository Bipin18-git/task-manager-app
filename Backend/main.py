from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt

import models, schemas, database, auth
from database import get_db

# Database tables create karna
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Tagda Task Manager API", description="Role-based project & task management system")

# CORS setup (Taaki Frontend React isse connect kar sake)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://worthy-appreciation-production.up.railway.app"],  # Production me isko apne frontend URL se replace karna
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Dependency: Current User get karne ke liye
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# ==========================================
# AUTHENTICATION APIs
# ==========================================

@app.post("/signup", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        hashed_password=hashed_password, 
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ==========================================
# PROJECT APIs (ADMIN ONLY)
# ==========================================

@app.post("/projects/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # RBAC: Sirf admin project bana sakta hai
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not authorized. Only Admins can create projects.")
    
    new_project = models.Project(**project.model_dump(), owner_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects/", response_model=list[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Admin apne projects dekhega, members sabhi projects dekh sakte hain (ya requirement ke hisaab se filter kar sakte ho)
    projects = db.query(models.Project).all()
    return projects

# ==========================================
# TASK APIs
# ==========================================

@app.post("/projects/{project_id}/tasks/", response_model=schemas.TaskResponse)
def create_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # RBAC: Sirf admin task assign kar sakta hai
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not authorized. Only Admins can create/assign tasks.")
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    new_task = models.Task(**task.model_dump(), project_id=project_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.patch("/tasks/{task_id}/status", response_model=schemas.TaskResponse)
def update_task_status(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Member sirf wahi task update kar sakta hai jo use assigned hai
    if current_user.role == models.RoleEnum.member and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update tasks assigned to you.")
        
    task.status = task_update.status
    db.commit()
    db.refresh(task)
    return task

@app.get("/my-tasks/", response_model=list[schemas.TaskResponse])
def get_my_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # User ko sirf apne assigned tasks dikhenge
    tasks = db.query(models.Task).filter(models.Task.assigned_to == current_user.id).all()
    return tasks
# ==========================================
# USERS API (For Task Assignment)
# ==========================================
@app.get("/users/", response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Team management ke liye saare users fetch karna
    users = db.query(models.User).all()
    return users
