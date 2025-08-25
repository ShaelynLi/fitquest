# Dependency used to authticate users

from fastapi import Header, HTTPException
from app.core.firebase import auth_client

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="lack of Bearer tokens")
    token = authorization.split(" ", 1)[1].strip()
    try:
        decoded = auth_client.verify_id_token(token)
        return decoded  # dict ocntains uid, email, name, etc.
    except Exception:
        raise HTTPException(status_code=401, detail="token expired")