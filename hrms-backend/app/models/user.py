import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(
        Enum("ADMIN", "SENIOR_MANAGER", "HR_RECRUITER", "EMPLOYEE", name="user_role"),
        nullable=False,
        default="EMPLOYEE",
    )
    employee_id = Column(String, ForeignKey("employees.id", use_alter=True, name="fk_user_employee_id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id])
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
