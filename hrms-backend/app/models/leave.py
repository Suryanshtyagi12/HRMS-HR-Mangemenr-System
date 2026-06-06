import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type = Column(
        Enum("CASUAL", "SICK", "EARNED", "MATERNITY", "PATERNITY", "UNPAID", name="leave_type_enum"),
        nullable=False,
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(
        Enum("PENDING", "APPROVED", "REJECTED", "CANCELLED", name="leave_status"),
        default="PENDING",
    )
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    comments = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")
    approved_by = relationship("User")


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("employees.id"), unique=True, nullable=False, index=True)
    casual_leave = Column(Float, default=0.0)
    sick_leave = Column(Float, default=0.0)
    earned_leave = Column(Float, default=0.0)
    maternity_leave = Column(Float, default=0.0)
    paternity_leave = Column(Float, default=0.0)
    year = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee")
