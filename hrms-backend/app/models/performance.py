import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class PerformanceCycle(Base):
    __tablename__ = "review_cycles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(
        Enum("PLANNED", "ACTIVE", "COMPLETED", name="cycle_status"),
        default="PLANNED",
    )
    created_at = Column(DateTime, default=datetime.utcnow)


class PerformanceGoal(Base):
    __tablename__ = "performance_goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)
    cycle_id = Column("review_cycle_id", String, ForeignKey("review_cycles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    progress = Column(Integer, default=0)
    status = Column(
        Enum("NOT_STARTED", "IN_PROGRESS", "ON_TRACK", "AT_RISK", "COMPLETED", "CANCELLED", name="goal_status"),
        default="NOT_STARTED",
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")
    cycle = relationship("PerformanceCycle")


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    cycle_id = Column("review_cycle_id", String, ForeignKey("review_cycles.id"), nullable=False)
    status = Column(
        Enum("PENDING", "IN_PROGRESS", "SUBMITTED", "COMPLETED", name="review_status"),
        default="PENDING",
    )
    overall_rating = Column(Float, default=0.0)
    comments = Column(Text, nullable=True)
    ai_narrative = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee")
    reviewer = relationship("User")
    cycle = relationship("PerformanceCycle")

class EmployeeTask(Base):
    __tablename__ = "employee_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False, index=True)
    manager_id = Column(String, ForeignKey("employees.id"), nullable=False)
    project_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False)
    status = Column(
        Enum("PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", name="task_status"),
        default="PENDING",
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id])
    manager = relationship("Employee", foreign_keys=[manager_id])
