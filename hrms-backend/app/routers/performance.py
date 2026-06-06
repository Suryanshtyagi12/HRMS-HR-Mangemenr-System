from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from typing import List, Optional
from app.models.user import User
from app.schemas.performance import (
    PerformanceCycleResponse, PerformanceGoalResponse, PerformanceGoalCreate, PerformanceGoalUpdate,
    PerformanceReviewResponse, PerformanceReviewCreate, PerformanceReviewUpdate
)
from app.services.performance_service import PerformanceService

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "module": "performance"}

@router.get("/cycles", response_model=List[PerformanceCycleResponse])
def get_cycles(db: Session = Depends(get_db)):
    return PerformanceService(db).get_cycles()

@router.get("/goals", response_model=List[PerformanceGoalResponse])
def get_goals(employee_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "EMPLOYEE":
        employee_id = current_user.employee_id
    return PerformanceService(db).get_goals(employee_id)

@router.post("/goals", response_model=PerformanceGoalResponse)
def create_goal(data: PerformanceGoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return PerformanceService(db).create_goal(current_user.employee_id, data)

@router.put("/goals/{goal_id}", response_model=PerformanceGoalResponse)
def update_goal(goal_id: str, data: PerformanceGoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return PerformanceService(db).update_goal(goal_id, data)

@router.get("/reviews", response_model=List[PerformanceReviewResponse])
def get_reviews(employee_id: Optional[str] = None, reviewer_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "EMPLOYEE":
        employee_id = current_user.employee_id
    elif current_user.role == "MANAGER":
        reviewer_id = current_user.id
    return PerformanceService(db).get_reviews(employee_id, reviewer_id)

@router.put("/reviews/{review_id}", response_model=PerformanceReviewResponse)
def update_review(review_id: str, data: PerformanceReviewUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return PerformanceService(db).update_review(review_id, data)

@router.get("/attrition")
def get_attrition_risk(db: Session = Depends(get_db)):
    return PerformanceService(db).calculate_attrition_risk()

# --- Employee Tasks ---
from app.schemas.performance import EmployeeTaskResponse, EmployeeTaskCreate, EmployeeTaskUpdate

@router.get("/tasks", response_model=List[EmployeeTaskResponse])
def get_tasks(
    employee_id: Optional[str] = None,
    manager_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "EMPLOYEE":
        employee_id = current_user.employee_id
    elif current_user.role == "MANAGER" or current_user.role == "SENIOR_MANAGER":
        manager_id = current_user.employee_id
    return PerformanceService(db).get_employee_tasks(employee_id, manager_id)

@router.post("/tasks", response_model=EmployeeTaskResponse)
def create_task(
    data: EmployeeTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PerformanceService(db).create_employee_task(current_user.employee_id, data)

@router.put("/tasks/{task_id}", response_model=EmployeeTaskResponse)
def update_task(
    task_id: str,
    data: EmployeeTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PerformanceService(db).update_employee_task(task_id, data)
