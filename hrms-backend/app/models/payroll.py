import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    run_date = Column(Date, nullable=True)
    status = Column(
        Enum("DRAFT", "PROCESSING", "COMPLETED", "FAILED", name="payroll_status"),
        default="DRAFT",
    )
    total_employees = Column(Integer, default=0)
    total_gross = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_net = Column(Float, default=0.0)
    run_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    run_by = relationship("User")
    payslips = relationship("Payslip", back_populates="payroll_run")


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)
    payroll_run_id = Column(String, ForeignKey("payroll_runs.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    
    basic_salary = Column(Float, nullable=False, default=0.0)
    hra = Column(Float, nullable=False, default=0.0)
    da = Column(Float, nullable=False, default=0.0)
    allowances = Column(Float, nullable=False, default=0.0)
    gross_salary = Column(Float, nullable=False, default=0.0)
    
    pf_deduction = Column(Float, nullable=False, default=0.0)
    tax_deduction = Column(Float, nullable=False, default=0.0)
    other_deductions = Column(Float, nullable=False, default=0.0)
    
    net_salary = Column(Float, nullable=False, default=0.0)
    
    working_days = Column(Integer, nullable=False, default=0)
    present_days = Column(Integer, nullable=False, default=0)
    leave_days = Column(Integer, nullable=False, default=0)
    
    status = Column(
        Enum("DRAFT", "GENERATED", "SENT", name="payslip_status"),
        default="DRAFT",
    )
    pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")
    payroll_run = relationship("PayrollRun", back_populates="payslips")
