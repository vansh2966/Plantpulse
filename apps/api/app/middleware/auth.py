from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
from app.config import settings

security = HTTPBearer()

def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify the Supabase JWT in the Authorization header.
    Returns the decoded token (which contains sub, email, etc.)
    """
    token = credentials.credentials
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", settings.SUPABASE_JWT_SECRET)

    if not jwt_secret:
        # Development fallback if secret is missing
        print("WARNING: SUPABASE_JWT_SECRET not set. Using mock token for development.")
        return {"sub": "dev_test_user_123", "email": "test@example.com"}

    try:
        # Supabase uses HS256 by default for JWTs
        decoded_token = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return decoded_token
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
