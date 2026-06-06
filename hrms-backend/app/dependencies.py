from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT; return the corresponding User row."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_hr_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("ADMIN", "HR_RECRUITER"):
        raise HTTPException(status_code=403, detail="HR or Admin access required")
    return current_user


def require_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("ADMIN", "SENIOR_MANAGER"):
        raise HTTPException(status_code=403, detail="Manager or Admin access required")
    return current_user


def require_manager_or_hr_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("ADMIN", "SENIOR_MANAGER", "HR_RECRUITER"):
        raise HTTPException(status_code=403, detail="Manager, HR, or Admin access required")
    return current_user

