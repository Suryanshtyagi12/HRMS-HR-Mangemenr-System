"""
auth_service.py — P1-5: JWT auth business logic
Full implementation added in Phase 1, step P1-5.
"""
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.core.security import verify_password, create_access_token, create_refresh_token

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate(self, email: str, password: str) -> dict:
        """Validate credentials and return JWT tokens + user payload."""
        user = self.db.query(User).filter(
            User.email == email,
            User.is_active == True
        ).first()

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Build JWT payload
        payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.employee.full_name if user.employee else user.email,
            "employee_id": user.employee.id if user.employee else None,
        }

        access_token = create_access_token(payload)
        refresh_token = create_refresh_token({"sub": user.id})

        logger.info("User %s logged in successfully", user.email)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": payload["name"],
                "role": user.role,
                "employee_id": payload["employee_id"],
            },
        }

    def refresh_access_token(self, refresh_token: str) -> str:
        from app.core.security import decode_access_token
        from jose import JWTError
        try:
            payload = decode_access_token(refresh_token)
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid refresh token")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = self.db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found or inactive")

        # Build new access token
        new_payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.employee.first_name + " " + user.employee.last_name if user.employee else user.email,
            "employee_id": user.employee_id,
        }
        return create_access_token(new_payload)
