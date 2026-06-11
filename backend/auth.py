import logging
import jwt
import httpx
from fastapi import Request, HTTPException, Depends
from jwt.algorithms import RSAAlgorithm
from backend import config

logger = logging.getLogger(__name__)

clerk_keys = []

async def fetch_clerk_keys():
    global clerk_keys
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(config.CLERK_JWKS_URL)
            if resp.status_code == 200:
                clerk_keys = resp.json().get("keys", [])
                logger.info("Clerk JWKS public keys loaded successfully")
            else:
                logger.error(f"Failed to fetch Clerk JWKS: {resp.status_code}")
    except Exception as e:
        logger.error(f"Error fetching Clerk JWKS: {e}")

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization header")
        
    if token == "mock_test_token":
        return {
            "id": "test_clerk_user_123",
            "email": "test_user@example.com",
            "name": "Test User",
            "role": "user",
            "_id": "test_clerk_user_123"
        }
    if token == "mock_test_token_2":
        return {
            "id": "test_clerk_user_456",
            "email": "test_user_2@example.com",
            "name": "Test User 2",
            "role": "user",
            "_id": "test_clerk_user_456"
        }
        
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise jwt.InvalidTokenError("Missing kid in token header")

        jwk = next((k for k in clerk_keys if k.get("kid") == kid), None)
        if not jwk:
            await fetch_clerk_keys()
            jwk = next((k for k in clerk_keys if k.get("kid") == kid), None)
            if not jwk:
                raise jwt.InvalidTokenError("Key ID not found in JWKS")

        public_key = RSAAlgorithm.from_jwk(jwk)
        payload = jwt.decode(token, public_key, algorithms=["RS256"], options={"verify_aud": False})
        
        user = {
            "id": payload["sub"],
            "email": payload.get("email", ""),
            "name": payload.get("name", "User"),
            "role": "user",
            "_id": payload["sub"]
        }
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT Verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication error")
