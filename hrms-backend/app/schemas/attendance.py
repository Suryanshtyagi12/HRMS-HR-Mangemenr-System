from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class AttendanceEmployeeSchema(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str

    class Config:
        from_attributes = True


class AttendanceLogResponse(BaseModel):
    id: str
    employee_id: str
    date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    hours_worked: Optional[float] = None
    status: str
    notes: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    employee: Optional[AttendanceEmployeeSchema] = None

    class Config:
        from_attributes = True


class AttendanceSummaryResponse(BaseModel):
    present_days: int
    absent_days: int
    late_days: int
    avg_hours: float


class AttendanceTodaySnapshot(BaseModel):
    total_clocked_in: int
    total_absent: int
    total_on_leave: int


class AttendanceAnomalyResponse(BaseModel):
    employee_id: str
    employee_name: str
    consecutive_absences: int
    late_arrivals: int
