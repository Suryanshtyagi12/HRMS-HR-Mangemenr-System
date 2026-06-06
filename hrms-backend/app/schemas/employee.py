from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class SalaryGradeBase(BaseModel):
    grade: str
    basic_salary: float
    hra: float
    da: float
    allowances: float
    pf_rate: float
    tax_rate: float


class SalaryGradeResponse(SalaryGradeBase):
    id: str

    class Config:
        from_attributes = True


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    joining_date: date
    designation: str
    department_id: str
    salary_grade_id: str
    employment_type: str
    status: str = "ACTIVE"
    reporting_manager_id: Optional[str] = None
    photo_url: Optional[str] = None
    documents: Optional[Dict[str, Any]] = None
    emergency_contact: Optional[Dict[str, Any]] = None
    bank_details: Optional[Dict[str, Any]] = None


class EmployeeCreate(EmployeeBase):
    # Creating an employee also creates a user account
    password: str
    role: str = "EMPLOYEE"


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    salary_grade_id: Optional[str] = None
    employment_type: Optional[str] = None
    status: Optional[str] = None
    reporting_manager_id: Optional[str] = None
    emergency_contact: Optional[Dict[str, Any]] = None
    bank_details: Optional[Dict[str, Any]] = None


class EmployeeResponse(EmployeeBase):
    id: str
    employee_code: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    # Includes
    department: Optional[DepartmentResponse] = None
    salary_grade: Optional[SalaryGradeResponse] = None

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    items: List[EmployeeResponse]
    total: int
    page: int
    pages: int
