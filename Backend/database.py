from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Local dev ke liye SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./taskmanager.db" 

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database tables create karne ka function
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()