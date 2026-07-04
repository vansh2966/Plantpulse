from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth
import os
from app.config import settings

# Initialize Firebase App globally if credentials exist
cred_path = os.getenv("FIREBASE_CREDENTIALS", settings.FIREBASE_CREDENTIALS)
if cred_path and os.path.exists(cred_path):
    from firebase_admin import credentials
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify the Firebase ID token in the Authorization header.
    Returns the decoded token (which contains uid, email, etc.)
    """
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
