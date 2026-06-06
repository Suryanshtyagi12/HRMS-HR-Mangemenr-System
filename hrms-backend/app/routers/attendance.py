from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.dependencies import get_current_user, require_manager_or_admin
from app.models.user import User
from app.schemas.attendance import (
    AttendanceLogResponse, AttendanceSummaryResponse,
    AttendanceTodaySnapshot, AttendanceAnomalyResponse
)
from app.services.attendance_service import AttendanceService

router = APIRouter()


@router.post("/clock", response_model=AttendanceLogResponse)
def clock_in_out(
    location: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_id:
        raise HTTPException(status_code=400, detail="User is not linked to an employee")
        
    service = AttendanceService(db)
    return service.clock_in_out(current_user.employee_id, location)


@router.get("")
def get_attendance(
    employee_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = AttendanceService(db)
        
        if current_user.role == "EMPLOYEE":
            employee_id = current_user.employee_id
            if not employee_id:
                return {"items": [], "total": 0}
                
        result = service.get_logs(employee_id, date_from, date_to, status)
        # Ensure it returns the expected dict if service returns a list or something else
        if isinstance(result, list):
            return {"items": result, "total": len(result)}
        return result
    except Exception as e:
        return {"items": [], "total": 0}


@router.get("/summary/{employee_id}", response_model=AttendanceSummaryResponse)
def get_monthly_summary(
    employee_id: str,
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure privacy
    if current_user.role == "EMPLOYEE" and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other's summary")
        
    service = AttendanceService(db)
    return service.get_monthly_summary(employee_id, year, month)


@router.get("/today", response_model=AttendanceTodaySnapshot)
def get_today_snapshot(
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    service = AttendanceService(db)
    return service.get_today_snapshot()


@router.get("/anomalies", response_model=List[AttendanceAnomalyResponse])
def get_anomalies(
    year: int,
    month: int,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    service = AttendanceService(db)
    return service.get_anomalies(year, month)
