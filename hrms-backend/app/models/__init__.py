from app.models.user import User
from app.models.employee import Department, SalaryGrade, Employee
from app.models.attendance import AttendanceLog, Shift
from app.models.leave import LeaveRequest, LeaveBalance
from app.models.payroll import PayrollRun, Payslip
from app.models.performance import PerformanceCycle, PerformanceReview, PerformanceGoal
from app.models.recruitment import JobPosting, Application, InterviewSession
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.document import DocumentVault

# Expose all models so Alembic env.py can detect them automatically
__all__ = [
    "User",
    "Department",
    "SalaryGrade",
    "Employee",
    "AttendanceLog",
    "Shift",
    "LeaveRequest",
    "LeaveBalance",
    "PayrollRun",
    "Payslip",
    "ReviewCycle",
    "PerformanceReview",
    "Goal",
    "JobPosting",
    "Application",
    "InterviewSession",
    "Notification",
    "AuditLog",
    "DocumentVault",
]
