from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime


class LeaveEmployeeInfo(BaseModel):
    id: str
    first_name: str
    last_name: str
    designation: Optional[str] = None

    class Config:
        from_attributes = True


class LeaveRequestCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str


class LeaveRequestUpdate(BaseModel):
    status: str
    comments: Optional[str] = None


class LeaveRequestResponse(BaseModel):
    id: str
    employee_id: str
    leave_type: str
    start_date: date
    end_date: date
    days: int
    reason: str
    status: str
    approved_by_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    comments: Optional[str] = None
    created_at: datetime
    
    employee: Optional[LeaveEmployeeInfo] = None

    class Config:
        from_attributes = True


class LeaveBalanceResponse(BaseModel):
    id: str
    employee_id: str
    casual_leave: int
    sick_leave: int
    earned_leave: int
    maternity_leave: int
    paternity_leave: int
    year: int
    updated_at: datetime

    class Config:
        from_attributes = True


class LeaveBalanceUpdate(BaseModel):
    casual_leave: Optional[int] = None
    sick_leave: Optional[int] = None
    earned_leave: Optional[int] = None
    maternity_leave: Optional[int] = None
    paternity_leave: Optional[int] = None
