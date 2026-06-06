from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.models.employee import Employee, Department
from app.models.attendance import AttendanceLog
from app.models.payroll import PayrollRun, Payslip
from app.models.leave import LeaveRequest, LeaveBalance
from app.models.recruitment import JobPosting, Application
from app.models.performance import (
    PerformanceReview, PerformanceGoal, PerformanceCycle)

def collect_company_data(db: Session) -> dict:
    """
    Collect ALL real company metrics from DB.
    This is sent to Gemini for analysis.
    """
    today = datetime.utcnow().date()
    this_month = datetime.utcnow().month
    this_year = datetime.utcnow().year
    last_month = this_month - 1 if this_month > 1 else 12
    last_month_year = this_year if this_month > 1 \
        else this_year - 1
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # ── HEADCOUNT ──────────────────────────────
    total_employees = db.query(
        func.count(Employee.id)).scalar() or 0
    
    active_employees = db.query(
        func.count(Employee.id))\
        .filter(Employee.status == "ACTIVE")\
        .scalar() or 0
    
    new_hires_this_month = db.query(
        func.count(Employee.id))\
        .filter(
            extract('month', Employee.joining_date)
            == this_month,
            extract('year', Employee.joining_date)
            == this_year
        ).scalar() or 0
    
    terminations_this_month = db.query(
        func.count(Employee.id))\
        .filter(
            Employee.status == "TERMINATED",
            extract('month', Employee.updated_at)
            == this_month
        ).scalar() or 0

    # ── DEPARTMENT BREAKDOWN ───────────────────
    dept_data = db.query(
        Department.name,
        func.count(Employee.id).label('count'))\
        .join(Employee,
            Employee.department_id == Department.id)\
        .filter(Employee.status == "ACTIVE")\
        .group_by(Department.name)\
        .all()
    
    departments = [
        {"name": d.name, "headcount": d.count}
        for d in dept_data
    ]

    # ── ATTENDANCE ─────────────────────────────
    # This month attendance rate
    total_logs_month = db.query(
        func.count(AttendanceLog.id))\
        .filter(
            extract('month', AttendanceLog.date)
            == this_month,
            extract('year', AttendanceLog.date)
            == this_year,
            AttendanceLog.status.notin_(
                ["WEEKEND", "HOLIDAY"])
        ).scalar() or 1
    
    present_logs_month = db.query(
        func.count(AttendanceLog.id))\
        .filter(
            extract('month', AttendanceLog.date)
            == this_month,
            AttendanceLog.status == "PRESENT"
        ).scalar() or 0
    
    attendance_rate = round(
        present_logs_month / total_logs_month * 100
        if total_logs_month else 0, 1)
    
    # Late arrivals this month
    late_this_month = db.query(
        func.count(AttendanceLog.id))\
        .filter(
            extract('month', AttendanceLog.date)
            == this_month,
            AttendanceLog.status == "LATE"
        ).scalar() or 0
    
    # Employees with attendance < 75%
    low_attendance_employees = []
    all_active = db.query(Employee)\
        .filter(Employee.status == "ACTIVE")\
        .all()
    
    for emp in all_active:
        emp_logs = db.query(AttendanceLog)\
            .filter(
                AttendanceLog.employee_id == emp.id,
                extract('month', AttendanceLog.date)
                == this_month
            ).all()
        
        if len(emp_logs) > 0:
            present = sum(1 for l in emp_logs
                if l.status == "PRESENT")
            rate = present / len(emp_logs) * 100
            if rate < 75:
                low_attendance_employees.append({
                    "name": f"{emp.first_name} "
                            f"{emp.last_name}",
                    "department": emp.department.name
                        if emp.department else "N/A",
                    "attendance_rate": round(rate, 1)
                })

    # ── PAYROLL ────────────────────────────────
    payroll_this_month = db.query(
        func.sum(Payslip.net_salary))\
        .filter(
            Payslip.month == this_month,
            Payslip.year == this_year
        ).scalar() or 0
    
    payroll_last_month = db.query(
        func.sum(Payslip.net_salary))\
        .filter(
            Payslip.month == last_month,
            Payslip.year == last_month_year
        ).scalar() or 0
    
    payroll_change = round(
        ((payroll_this_month - payroll_last_month)
        / payroll_last_month * 100)
        if payroll_last_month else 0, 1)
    
    avg_salary = round(
        payroll_this_month / active_employees
        if active_employees else 0, 0)

    # ── LEAVE ──────────────────────────────────
    pending_leaves = db.query(
        func.count(LeaveRequest.id))\
        .filter(LeaveRequest.status == "PENDING")\
        .scalar() or 0
    
    approved_leaves_month = db.query(
        func.count(LeaveRequest.id))\
        .filter(
            LeaveRequest.status == "APPROVED",
            extract('month', LeaveRequest.start_date)
            == this_month
        ).scalar() or 0
    
    # Leave by type this month
    leave_by_type = db.query(
        LeaveRequest.leave_type,
        func.count(LeaveRequest.id).label('count'))\
        .filter(
            LeaveRequest.status == "APPROVED",
            extract('month', LeaveRequest.start_date)
            == this_month
        ).group_by(LeaveRequest.leave_type)\
        .all()
    
    leave_breakdown = [
        {"type": l.leave_type, "count": l.count}
        for l in leave_by_type
    ]

    # ── RECRUITMENT ────────────────────────────
    open_positions = db.query(
        func.count(JobPosting.id))\
        .filter(JobPosting.status == "OPEN")\
        .scalar() or 0
    
    applications_month = db.query(
        func.count(Application.id))\
        .filter(
            extract('month', Application.created_at)
            == this_month
        ).scalar() or 0
    
    hires_month = db.query(
        func.count(Application.id))\
        .filter(
            Application.status == "HIRED",
            extract('month', Application.created_at)
            == this_month
        ).scalar() or 0
    
    # Pipeline breakdown
    pipeline = db.query(
        Application.status,
        func.count(Application.id).label('count'))\
        .group_by(Application.status)\
        .all()
    
    pipeline_data = {p.status: p.count
        for p in pipeline}
    
    # Longest open positions
    old_positions = db.query(JobPosting)\
        .filter(JobPosting.status == "OPEN")\
        .order_by(JobPosting.created_at.asc())\
        .limit(3).all()
    
    unfilled_jobs = [
        {
            "title": j.title,
            "department": j.department,
            "days_open": (datetime.utcnow() -
                j.created_at).days
        }
        for j in old_positions
    ]

    # ── PERFORMANCE ────────────────────────────
    avg_performance = db.query(
        func.avg(PerformanceReview.overall_rating))\
        .scalar() or 0
    
    # Attrition risk calculation
    high_risk_count = 0
    medium_risk_count = 0
    high_risk_employees = []
    
    for emp in all_active:
        risk_score = 0
        risk_factors = []
        
        # Tenure
        tenure_days = (datetime.utcnow().date() -
            emp.joining_date).days \
            if emp.joining_date else 0
        tenure_months = tenure_days // 30
        
        if tenure_months < 12:
            risk_score += 15
            risk_factors.append("New employee")
        
        # Low performance
        last_review = db.query(PerformanceReview)\
            .filter(
                PerformanceReview.employee_id == emp.id
            ).order_by(
                PerformanceReview.created_at.desc()
            ).first()
        
        if last_review:
            if last_review.overall_rating < 2.5:
                risk_score += 35
                risk_factors.append(
                    "Low performance rating")
            elif last_review.overall_rating < 3.5:
                risk_score += 15
                risk_factors.append(
                    "Below average performance")
        else:
            risk_score += 20
            risk_factors.append(
                "No performance review on record")
        
        # High leave usage
        leave_count = db.query(
            func.count(LeaveRequest.id))\
            .filter(
                LeaveRequest.employee_id == emp.id,
                LeaveRequest.status == "APPROVED",
                extract('year',
                    LeaveRequest.start_date) == this_year
            ).scalar() or 0
        
        if leave_count > 15:
            risk_score += 25
            risk_factors.append(
                f"High leave usage ({leave_count} days)")
        
        # Low attendance
        emp_logs = db.query(AttendanceLog)\
            .filter(
                AttendanceLog.employee_id == emp.id,
                extract('month', AttendanceLog.date)
                == this_month
            ).all()
        
        if emp_logs:
            present = sum(1 for l in emp_logs
                if l.status == "PRESENT")
            att_rate = present / len(emp_logs)
            if att_rate < 0.80:
                risk_score += 20
                risk_factors.append(
                    f"Low attendance "
                    f"({round(att_rate*100)}%)")
        
        if risk_score >= 60:
            high_risk_count += 1
            high_risk_employees.append({
                "name": f"{emp.first_name} "
                        f"{emp.last_name}",
                "department": emp.department.name
                    if emp.department else "N/A",
                "risk_score": risk_score,
                "risk_factors": risk_factors
            })
        elif risk_score >= 30:
            medium_risk_count += 1

    # ── GOALS ──────────────────────────────────
    total_goals = db.query(
        func.count(PerformanceGoal.id))\
        .filter(PerformanceGoal.status != "CANCELLED")\
        .scalar() or 0
    
    completed_goals = db.query(
        func.count(PerformanceGoal.id))\
        .filter(PerformanceGoal.status == "COMPLETED")\
        .scalar() or 0
    
    goals_completion_rate = round(
        completed_goals / total_goals * 100
        if total_goals else 0, 1)

    # ── RETURN COMPLETE DATA PACKAGE ───────────
    return {
        "report_date": datetime.utcnow().strftime(
            "%B %d, %Y"),
        "company_name": "TechCorp India Pvt. Ltd.",
        
        "headcount": {
            "total": total_employees,
            "active": active_employees,
            "new_hires_this_month": new_hires_this_month,
            "terminations_this_month":
                terminations_this_month,
            "by_department": departments
        },
        
        "attendance": {
            "rate_this_month": attendance_rate,
            "late_arrivals": late_this_month,
            "low_attendance_employees":
                low_attendance_employees,
            "employees_below_75_percent":
                len(low_attendance_employees)
        },
        
        "payroll": {
            "total_this_month": float(
                payroll_this_month),
            "total_last_month": float(
                payroll_last_month),
            "change_percent": payroll_change,
            "avg_salary": float(avg_salary)
        },
        
        "leave": {
            "pending_requests": pending_leaves,
            "approved_this_month":
                approved_leaves_month,
            "breakdown_by_type": leave_breakdown
        },
        
        "recruitment": {
            "open_positions": open_positions,
            "applications_this_month":
                applications_month,
            "hires_this_month": hires_month,
            "pipeline": pipeline_data,
            "longest_unfilled_positions":
                unfilled_jobs
        },
        
        "performance": {
            "avg_rating": round(
                float(avg_performance), 2),
            "goals_completion_rate":
                goals_completion_rate,
            "total_goals": total_goals,
            "completed_goals": completed_goals
        },
        
        "attrition_risk": {
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": active_employees -
                high_risk_count - medium_risk_count,
            "high_risk_employees":
                high_risk_employees[:5]
        }
    }
