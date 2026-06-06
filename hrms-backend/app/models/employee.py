import uuid
from datetime import date, datetime

from sqlalchemy import (
    Column, Date, DateTime, Enum, Float, ForeignKey, String, Text, JSON
)
from sqlalchemy.orm import relationship

from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    manager_id = Column(String, ForeignKey("employees.id", use_alter=True, name="fk_department_manager_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employees = relationship("Employee", foreign_keys="[Employee.department_id]", back_populates="department")
    manager = relationship("Employee", foreign_keys=[manager_id], post_update=True)


class SalaryGrade(Base):
    __tablename__ = "salary_grades"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    grade = Column(String, unique=True, nullable=False)  # L1-L6
    basic_salary = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    da = Column(Float, nullable=False)
    allowances = Column(Float, nullable=False)
    pf_rate = Column(Float, nullable=False)
    tax_rate = Column(Float, nullable=False)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=True)
    employee_code = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    joining_date = Column(Date, nullable=False, default=date.today)
    designation = Column(String, nullable=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    salary_grade_id = Column(String, ForeignKey("salary_grades.id"), nullable=True)
    employment_type = Column(
        Enum("FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", name="employment_type"),
        default="FULL_TIME",
    )
    status = Column(
        Enum("ACTIVE", "INACTIVE", "TERMINATED", "ON_LEAVE", name="employee_status"),
        default="ACTIVE",
    )
    reporting_manager_id = Column(String, ForeignKey("employees.id"), nullable=True)
    photo_url = Column(String, nullable=True)
    documents = Column(JSON, nullable=True)
    emergency_contact = Column(JSON, nullable=True)
    bank_details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    department = relationship("Department", foreign_keys=[department_id], back_populates="employees")
    salary_grade = relationship("SalaryGrade")
    manager = relationship("Employee", remote_side=[id], backref="direct_reports")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<Employee {self.employee_code}: {self.full_name}>"
