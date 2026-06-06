from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from app.database import get_db
from app.dependencies import get_current_user, require_admin, require_manager_or_admin, require_hr_or_admin
from app.models.user import User
from app.models.employee import Employee, Department
from app.models.leave import LeaveRequest
from app.models.recruitment import JobPosting, Application
from app.models.payroll import PayrollRun, Payslip
from app.models.attendance import AttendanceLog
from app.models.performance import PerformanceReview
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from app.core.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/admin")
def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        today = date.today()
        current_month = today.month
        current_year = today.year

        total_employees = db.query(Employee).filter(Employee.status.in_(["ACTIVE", "ON_LEAVE"])).count()
        total_departments = db.query(Department).count()
        open_jobs = db.query(JobPosting).filter(JobPosting.status == "OPEN").count()
        pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "PENDING").count()

        dept_counts = db.query(Department.name, func.count(Employee.id)).join(Employee, Employee.department_id == Department.id).group_by(Department.name).all()
        departmentBreakdown = [{"department": d[0] or "Unassigned", "count": d[1]} for d in dept_counts]

        new_hires = db.query(Employee).filter(func.extract('month', Employee.joining_date) == current_month, func.extract('year', Employee.joining_date) == current_year).count()
        terminations = db.query(Employee).filter(Employee.status == "TERMINATED", func.extract('month', Employee.updated_at) == current_month).count()

        payslips_this_month = db.query(Payslip).filter(Payslip.month == current_month, Payslip.year == current_year).all()
        total_payroll = sum(p.net_salary for p in payslips_this_month)
        avg_salary = total_payroll / len(payslips_this_month) if payslips_this_month else 0.0

        attrition_rate = (terminations / (total_employees + terminations)) * 100 if (total_employees + terminations) > 0 else 0.0

        # Attendance today (or latest available)
        latest_log_date = db.query(func.max(AttendanceLog.date)).scalar()
        if not latest_log_date:
            latest_log_date = today

        logs_today = db.query(AttendanceLog).filter(AttendanceLog.date == latest_log_date).all()
        attendance_today = {
            "present": sum(1 for l in logs_today if l.status in ["PRESENT", "LATE"]),
            "absent": sum(1 for l in logs_today if l.status == "ABSENT"),
            "onLeave": sum(1 for l in logs_today if l.status == "ON_LEAVE"),
        }
        attendance_today["total"] = attendance_today["present"] + attendance_today["absent"] + attendance_today["onLeave"]

        # Payroll Trend
        payroll_trend = []
        for i in reversed(range(6)):
            d = today - relativedelta(months=i)
            run = db.query(PayrollRun).filter(PayrollRun.month == d.month, PayrollRun.year == d.year).first()
            payroll_trend.append({
                "month": d.strftime("%b"),
                "amount": run.total_net if run else 0.0
            })

        # Headcount Trend
        headcount_trend = []
        for i in reversed(range(6)):
            d = today - relativedelta(months=i)
            # count employees joined before the end of that month and not terminated
            count = db.query(Employee).filter(Employee.joining_date <= d).count()
            headcount_trend.append({
                "month": d.strftime("%b"),
                "headcount": count
            })

        # Top performers
        reviews = db.query(PerformanceReview).order_by(PerformanceReview.overall_rating.desc()).limit(5).all()
        top_performers = [{"name": r.employee.full_name, "score": r.overall_rating} for r in reviews if r.employee]

        # Pending Actions
        pending_actions = []
        pending_leave_reqs = db.query(LeaveRequest).filter(LeaveRequest.status == "PENDING").limit(3).all()
        if pending_leave_reqs:
            pending_actions.append({
                "type": "Leave Request Approval",
                "detail": f"{len(pending_leave_reqs)} Pending Requests",
                "color": "bg-indigo-500"
            })
        
        anomalies = db.query(AttendanceLog).filter(AttendanceLog.notes == "Discrepancy").count()
        if anomalies > 0:
            pending_actions.append({
                "type": "Timesheet Discrepancy",
                "detail": f"{anomalies} Flags Detected",
                "color": "bg-rose-500"
            })

        return {
            "totalEmployees": total_employees,
            "activeEmployees": total_employees,
            "newHiresThisMonth": new_hires,
            "terminationsThisMonth": terminations,
            "totalPayrollThisMonth": total_payroll,
            "avgSalary": avg_salary,
            "attritionRate": attrition_rate,
            "openPositions": open_jobs,
            "pendingLeaves": pending_leaves,
            "attendanceToday": attendance_today,
            "departmentBreakdown": departmentBreakdown,
            "headcountTrend": headcount_trend,
            "payrollTrend": payroll_trend,
            "topPerformers": top_performers,
            "pendingActions": pending_actions
        }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return {
            "totalEmployees": 0,
            "activeEmployees": 0,
            "newHiresThisMonth": 0,
            "terminationsThisMonth": 0,
            "totalPayrollThisMonth": 0.0,
            "avgSalary": 0.0,
            "attritionRate": 0.0,
            "openPositions": 0,
            "pendingLeaves": 0,
            "attendanceToday": {
                "present": 0,
                "absent": 0,
                "onLeave": 0,
                "total": 0
            },
            "departmentBreakdown": [],
            "headcountTrend": [],
            "payrollTrend": [],
            "topPerformers": [],
            "pendingActions": []
        }

@router.get("/manager")
def get_manager_dashboard(
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role == "ADMIN" and not current_user.employee_id:
            team_size = 0
            team_leaves = 0
        else:
            team_members = db.query(Employee).filter(Employee.reporting_manager_id == current_user.employee_id).all()
            team_ids = [m.id for m in team_members]
            team_size = len(team_members)
            team_leaves = db.query(LeaveRequest).filter(
                LeaveRequest.employee_id.in_(team_ids),
                LeaveRequest.status == "PENDING"
            ).count()

        return {
            "teamSize": team_size,
            "presentToday": 0,
            "onLeaveToday": 0,
            "absentToday": 0,
            "pendingLeaveRequests": team_leaves,
            "teamAttendanceRate": 0.0,
            "teamAttendanceHeatmap": [],
            "upcomingLeaves": [],
            "teamPerformanceAvg": 0.0,
            "goalsCompletionRate": 0.0
        }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return {
            "teamSize": 0,
            "presentToday": 0,
            "onLeaveToday": 0,
            "absentToday": 0,
            "pendingLeaveRequests": 0,
            "teamAttendanceRate": 0.0,
            "teamAttendanceHeatmap": [],
            "upcomingLeaves": [],
            "teamPerformanceAvg": 0.0,
            "goalsCompletionRate": 0.0
        }

@router.get("/hr")
def get_hr_dashboard(
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    try:
        open_jobs = db.query(JobPosting).filter(JobPosting.status == "OPEN").count()
        total_applications = db.query(Application).count()
        
        # Calculate hiring funnel
        applied = db.query(Application).filter(Application.status.in_(["APPLIED", "SCREENING"])).count()
        screened = db.query(Application).filter(Application.status.in_(["SHORTLISTED", "INTERVIEW_SCHEDULED"])).count()
        interviewed = db.query(Application).filter(Application.status == "INTERVIEWED").count()
        offered = db.query(Application).filter(Application.status.in_(["OFFERED", "HIRED"])).count()
        
        hiring_funnel = {
            "applied": applied + screened + interviewed + offered,
            "screened": screened + interviewed + offered,
            "interviewed": interviewed + offered,
            "offered": offered
        }

        # Upcoming interviews
        upcoming_apps = db.query(Application).filter(Application.status == "INTERVIEW_SCHEDULED").all()
        recent_apps = []
        for app in upcoming_apps:
            role = app.job.title if app.job else "Candidate"
            time = app.main_interview_details.get("date_time", "") if app.main_interview_details else ""
            link = app.main_interview_details.get("google_meet_link", "") if app.main_interview_details else ""
            recent_apps.append({
                "name": app.candidate_name,
                "role": role,
                "time": time,
                "link": link
            })

        return {
            "openPositions": open_jobs,
            "applicationsThisMonth": total_applications,
            "screenedToday": 0,
            "hiresThisMonth": offered,
            "avgTimeToHire": 0.0,
            "hiringFunnel": hiring_funnel,
            "recentApplications": recent_apps,
            "attendanceAnomalies": [],
            "pendingOnboarding": [],
            "leaveRequestsQueue": 0
        }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return {
            "openPositions": 0,
            "applicationsThisMonth": 0,
            "screenedToday": 0,
            "hiresThisMonth": 0,
            "avgTimeToHire": 0.0,
            "hiringFunnel": [],
            "recentApplications": [],
            "attendanceAnomalies": [],
            "pendingOnboarding": [],
            "leaveRequestsQueue": 0
        }

@router.get("/employee/{employee_id}")
def get_employee_dashboard(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "EMPLOYEE" and str(current_user.employee_id) != str(employee_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        return {
            "attendanceStreak": 0,
            "presentThisMonth": 0,
            "absentThisMonth": 0,
            "lateThisMonth": 0,
            "attendancePercentage": 0.0,
            "leaveBalance": {
                "casual": 0,
                "sick": 0,
                "earned": 0
            },
            "lastPayslip": {
                "month": "",
                "netSalary": 0.0,
                "status": ""
            },
            "nextPayrollDate": "",
            "currentGoals": [],
            "performanceScore": 0.0,
            "upcomingLeaves": [],
            "teamMembersOnLeaveToday": []
        }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return {
            "attendanceStreak": 0,
            "presentThisMonth": 0,
            "absentThisMonth": 0,
            "lateThisMonth": 0,
            "attendancePercentage": 0.0,
            "leaveBalance": {
                "casual": 0,
                "sick": 0,
                "earned": 0
            },
            "lastPayslip": {
                "month": "",
                "netSalary": 0.0,
                "status": ""
            },
            "nextPayrollDate": "",
            "currentGoals": [],
            "performanceScore": 0.0,
            "upcomingLeaves": [],
            "teamMembersOnLeaveToday": []
        }
