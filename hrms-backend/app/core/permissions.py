from typing import List
from fastapi import HTTPException, status


# Role hierarchy map — each role and what it can access
ROLE_PERMISSIONS = {
    "ADMIN": ["admin", "manager", "hr", "employee", "all"],
    "SENIOR_MANAGER": ["manager", "employee"],
    "HR_RECRUITER": ["hr", "employee"],
    "EMPLOYEE": ["employee"],
}


def check_role(user_role: str, required_roles: List[str]) -> None:
    """
    Raises HTTP 403 if user_role is not in required_roles.
    Pass required_roles=["ADMIN", "HR_RECRUITER"] etc.
    """
    if user_role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required: {required_roles}, Got: {user_role}",
        )


def is_admin(user_role: str) -> bool:
    return user_role == "ADMIN"


def is_hr_or_above(user_role: str) -> bool:
    return user_role in ("ADMIN", "HR_RECRUITER")


def is_manager_or_above(user_role: str) -> bool:
    return user_role in ("ADMIN", "SENIOR_MANAGER")


def can_access_employee_data(requester_role: str, requester_id: str, target_employee_id: str) -> bool:
    """
    Employees can only access their own data.
    Managers/HR/Admin can access anyone's data.
    """
    if requester_role in ("ADMIN", "SENIOR_MANAGER", "HR_RECRUITER"):
        return True
    return requester_id == target_employee_id
