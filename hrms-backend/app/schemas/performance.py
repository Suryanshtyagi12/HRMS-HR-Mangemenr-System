from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime

class PerformanceCycleBase(BaseModel):
    name: str
    year: int
    start_date: date
    end_date: date
    status: str

class PerformanceCycleCreate(PerformanceCycleBase):
    pass

class PerformanceCycleResponse(PerformanceCycleBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class PerformanceGoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    progress: int = 0
    status: str = "NOT_STARTED"

class PerformanceGoalCreate(PerformanceGoalBase):
    cycle_id: str

class PerformanceGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None

class PerformanceGoalResponse(PerformanceGoalBase):
    id: str
    employee_id: str
    cycle_id: str
    created_at: datetime
    
    cycle: Optional[PerformanceCycleResponse] = None

    class Config:
        from_attributes = True

class PerformanceReviewBase(BaseModel):
    overall_rating: float = 0.0
    comments: Optional[str] = None
    ai_narrative: Optional[str] = None
    status: str = "PENDING"

class PerformanceReviewCreate(PerformanceReviewBase):
    employee_id: str
    reviewer_id: str
    cycle_id: str

class PerformanceReviewUpdate(BaseModel):
    overall_rating: Optional[float] = None
    comments: Optional[str] = None
    status: Optional[str] = None

class PerformanceReviewResponse(PerformanceReviewBase):
    id: str
    employee_id: str
    reviewer_id: str
    cycle_id: str
    created_at: datetime
    updated_at: datetime

    employee: Optional[Any] = None
    cycle: Optional[PerformanceCycleResponse] = None

    class Config:
        from_attributes = True

class EmployeeTaskBase(BaseModel):
    project_name: str
    title: str
    description: Optional[str] = None
    due_date: date
    status: str = "PENDING"

class EmployeeTaskCreate(EmployeeTaskBase):
    employee_id: str

class EmployeeTaskUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None

class EmployeeTaskResponse(EmployeeTaskBase):
    id: str
    employee_id: str
    manager_id: str
    created_at: datetime
    updated_at: datetime
    
    employee: Optional[Any] = None
    manager: Optional[Any] = None

    class Config:
        from_attributes = True
