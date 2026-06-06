from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from datetime import datetime, timedelta

from app.database import get_db
from app.dependencies import get_current_user, require_hr_or_admin, require_manager_or_admin, require_manager_or_hr_or_admin
from app.models.user import User
from app.schemas.leave import (
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse,
    LeaveBalanceResponse, LeaveBalanceUpdate
)
from app.services.leave_service import LeaveService

router = APIRouter()


@router.get("/policy")
def get_leave_policy():
    return {
        "casual_leave": 12,
        "sick_leave": 10,
        "earned_leave": 15,
        "maternity_leave": 180,
        "paternity_leave": 15
    }



@router.post("/apply", response_model=LeaveRequestResponse)
def apply_leave(
    data: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_id:
        raise HTTPException(status_code=400, detail="User is not linked to an employee")
        
    service = LeaveService(db)
    try:
        res = service.apply_leave(current_user.employee_id, data)
        
        # Real-time Notification
        from app.models.employee import Employee
        from app.services.notification_service import create_notification
        employee = db.query(Employee).filter(Employee.id == current_user.employee_id).first()
        if employee and employee.reporting_manager_id:
            manager = db.query(Employee).filter(Employee.id == employee.reporting_manager_id).first()
            if manager and manager.user_id:
                days = (data.end_date - data.start_date).days + 1
                create_notification(
                    db, manager.user_id, 
                    "New Leave Request", 
                    f"{employee.first_name} applied for {days} days {data.leave_type} leave", 
                    "LEAVE_REQUEST", 
                    "/manager/leave-approvals"
                )
                
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/requests")
def get_leave_requests(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = LeaveService(db)
        
        # Employee can only see own requests
        if current_user.role == "EMPLOYEE":
            if not current_user.employee_id:
                return {"items": [], "total": 0, "pending": 0}
            result = service.get_requests(employee_id=current_user.employee_id, status=status)
        else:
            result = service.get_requests(employee_id=None, status=status)
            
        if isinstance(result, list):
            pending_count = sum(1 for r in result if getattr(r, "status", None) == "PENDING")
            return {"items": result, "total": len(result), "pending": pending_count}
        return result
    except Exception as e:
        return {"items": [], "total": 0, "pending": 0}


@router.put("/requests/{request_id}", response_model=LeaveRequestResponse)
def update_leave_request(
    request_id: str,
    data: LeaveRequestUpdate,
    current_user: User = Depends(require_manager_or_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = LeaveService(db)
    try:
        res = service.update_request_status(request_id, data.status, current_user.id, data.comments)
        
        # Real-time Notification
        from app.models.leave import LeaveRequest
        from app.models.employee import Employee
        from app.services.notification_service import create_notification
        req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
        if req:
            employee = db.query(Employee).filter(Employee.id == req.employee_id).first()
            if employee and employee.user_id:
                create_notification(
                    db, employee.user_id, 
                    f"Leave {data.status}", 
                    f"Your leave from {req.start_date} to {req.end_date} was {data.status.lower()}", 
                    f"LEAVE_{data.status}", 
                    "/employee/my-leaves"
                )
                
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/balance/{employee_id}", response_model=LeaveBalanceResponse)
def get_leave_balance(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "EMPLOYEE" and str(current_user.employee_id) != str(employee_id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    service = LeaveService(db)
    balance = service.get_balance(employee_id)
    if not balance:
        raise HTTPException(status_code=404, detail="Balance not found")
    return balance


@router.put("/balance/{employee_id}", response_model=LeaveBalanceResponse)
def update_leave_balance(
    employee_id: str,
    data: LeaveBalanceUpdate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = LeaveService(db)
    balance = service.update_balance(employee_id, data)
    if not balance:
        raise HTTPException(status_code=404, detail="Balance not found")
    return balance


@router.get("/calendar", response_model=List[LeaveRequestResponse])
def get_leave_calendar(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = start_date + timedelta(days=60)

    service = LeaveService(db)
    return service.get_calendar(start_date, end_date)
