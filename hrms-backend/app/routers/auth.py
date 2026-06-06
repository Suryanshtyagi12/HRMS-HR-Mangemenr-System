"""
Auth router — P1-5
Endpoints: /auth/login, /auth/refresh, /auth/logout, /auth/me
"""
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import AuthService
from app.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "module": "auth"}


@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 password flow.
    Returns access_token in JSON, sets refresh_token in httpOnly cookie.
    """
    service = AuthService(db)
    result = service.authenticate(form_data.username, form_data.password)
    
    # Set httpOnly cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        max_age=7 * 24 * 60 * 60,  # 7 days
        samesite="lax",
        secure=os.getenv("ENVIRONMENT", "development").lower() == "production",  # HTTPS only in prod
    )
    
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"]
    }


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    """Refresh access token using httpOnly cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    service = AuthService(db)
    new_access_token = service.refresh_access_token(refresh_token)
    
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "name": current_user.employee.first_name + " " + current_user.employee.last_name if current_user.employee else current_user.email,
        "employee_id": current_user.employee_id,
    }


@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user)):
    """Clear refresh token cookie."""
    logger.info("User %s logged out", current_user.email)
    response.delete_cookie(key="refresh_token", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}
