from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PayrollRunCreate(BaseModel):
    month: int
    year: int


class PayslipResponse(BaseModel):
    id: str
    employee_id: str
    payroll_run_id: str
    month: int
    year: int
    basic_salary: float
    hra: float
    da: float
    allowances: float
    gross_salary: float
    pf_deduction: float
    tax_deduction: float
    other_deductions: float
    net_salary: float
    working_days: float
    present_days: float
    leave_days: float
    status: str
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollRunResponse(BaseModel):
    id: str
    month: int
    year: int
    run_date: datetime
    status: str
    total_employees: int
    total_gross: float
    total_deductions: float
    total_net: float
    run_by_id: str
    created_at: datetime

    payslips: Optional[List[PayslipResponse]] = None

    class Config:
        from_attributes = True
