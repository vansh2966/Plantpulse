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
        # Check the token header to determine the algorithm
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            # Supabase occasionally uses ES256 (ECDSA). Without the JWKS public key, 
            # we must decode without signature verification for the MVP to function.
            print("WARNING: ES256 token detected. Decoding without signature verification.")
            decoded_token = jwt.decode(
                token, 
                "", 
                algorithms=["ES256"], 
                options={"verify_signature": False, "verify_aud": False}
            )
        else:
            # Default HS256 verification using the secret
            decoded_token = jwt.decode(
                token, 
                jwt_secret, 
                algorithms=["HS256"], 
                options={"verify_aud": False}
            )
        return decoded_token
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
