import bcrypt
from datetime import datetime, timedelta
from jose import jwt

# ==========================================
# JWT SETTINGS
# ==========================================
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # Apni purani key bhi use kar sakte ho
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # 1 ghanta

# ==========================================
# PASSLIB BYPASS (DIRECT BCRYPT HASHING)
# ==========================================
def verify_password(plain_password: str, hashed_password: str):
    """Check karega ki password sahi hai ya nahi"""
    # Strings ko bytes mein convert karke match karna padta hai bcrypt ke liye
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str):
    """Naya password hash banayega"""
    # Naya salt generate karke hash banayenge aur wapas string mein bhejenge DB ke liye
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# ==========================================
# JWT TOKEN GENERATION
# ==========================================
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
