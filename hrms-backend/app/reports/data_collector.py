import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models.employee import Employee
from app.models.attendance import AttendanceLog
from app.models.payroll import Payslip
from app.models.recruitment import JobPosting, Application
from app.models.leave import LeaveRequest

logger = logging.getLogger(__name__)

def collect_report_data(db: Session, report_type: str, month: int, year: int) -> dict:
    """
    Collects raw data for the given report type and timeframe.
    Returns a dictionary with 'summary_stats' for AI and 'raw_rows' for the table/excel.
    """
    report_type = report_type.upper()
    data = {"summary_stats": {}, "raw_rows": []}
    
    if report_type == "HEADCOUNT":
        employees = db.query(Employee).all()
        
        # Aggregates
        dept_counts = {}
        type_counts = {}
        status_counts = {}
        
        raw_rows = []
        for emp in employees:
            dept = emp.department.name if emp.department else "Unassigned"
            emp_type = emp.employment_type if emp.employment_type else "Full-time"
            status = emp.status if emp.status else "ACTIVE"
            
            dept_counts[dept] = dept_counts.get(dept, 0) + 1
            type_counts[emp_type] = type_counts.get(emp_type, 0) + 1
            status_counts[status] = status_counts.get(status, 0) + 1
            
            raw_rows.append({
                "Employee ID": emp.employee_code,
                "Name": f"{emp.first_name} {emp.last_name}",
                "Department": dept,
                "Designation": emp.designation,
                "Employment Type": emp_type,
                "Status": status,
                "Joined Date": emp.joining_date.isoformat() if emp.joining_date else ""
            })
            
        data["summary_stats"] = {
            "total_headcount": len(employees),
            "department_breakdown": dept_counts,
            "employment_type_breakdown": type_counts,
            "status_breakdown": status_counts
        }
        data["raw_rows"] = raw_rows

    elif report_type == "ATTENDANCE":
        records = db.query(AttendanceLog).filter(
            func.extract('month', AttendanceLog.date) == month,
            func.extract('year', AttendanceLog.date) == year
        ).all()
        
        status_counts = {"PRESENT": 0, "ABSENT": 0, "LATE": 0, "HALF_DAY": 0}
        emp_stats = {}
        
        raw_rows = []
        for r in records:
            st = r.status.upper()
            status_counts[st] = status_counts.get(st, 0) + 1
            
            emp_name = f"{r.employee.first_name} {r.employee.last_name}" if r.employee else f"Emp {r.employee_id}"
            if emp_name not in emp_stats:
                emp_stats[emp_name] = {"present": 0, "absent": 0, "late": 0}
                
            if st == "PRESENT": emp_stats[emp_name]["present"] += 1
            elif st == "ABSENT": emp_stats[emp_name]["absent"] += 1
            elif st == "LATE": emp_stats[emp_name]["late"] += 1
            
            raw_rows.append({
                "Date": r.date.isoformat(),
                "Employee": emp_name,
                "Status": st,
                "Clock In": r.clock_in.isoformat() if r.clock_in else "",
                "Clock Out": r.clock_out.isoformat() if r.clock_out else ""
            })
            
        data["summary_stats"] = {
            "total_records": len(records),
            "overall_status_counts": status_counts,
            "employee_summaries": emp_stats
        }
        data["raw_rows"] = raw_rows

    elif report_type == "PAYROLL":
        records = db.query(Payslip).filter(
            Payslip.month == month,
            Payslip.year == year
        ).all()
        
        total_gross = sum(r.gross_salary or 0 for r in records)
        total_deductions = sum((r.pf_deduction or 0) + (r.tax_deduction or 0) + (r.other_deductions or 0) for r in records)
        total_net = sum(r.net_salary or 0 for r in records)
        
        raw_rows = []
        for r in records:
            emp_name = f"{r.employee.first_name} {r.employee.last_name}" if r.employee else f"Emp {r.employee_id}"
            raw_rows.append({
                "Employee": emp_name,
                "Basic Salary": r.basic_salary,
                "Allowances": r.allowances,
                "Deductions": (r.pf_deduction or 0) + (r.tax_deduction or 0) + (r.other_deductions or 0),
                "Net Salary": r.net_salary,
                "Status": r.status
            })
            
        data["summary_stats"] = {
            "total_records": len(records),
            "total_gross_payroll": total_gross,
            "total_deductions": total_deductions,
            "total_net_payroll": total_net
        }
        data["raw_rows"] = raw_rows

    elif report_type == "RECRUITMENT":
        jobs = db.query(JobPosting).all()
        
        total_jobs = len(jobs)
        open_jobs = sum(1 for j in jobs if j.status == 'OPEN')
        
        apps = db.query(Application).all()
        total_apps = len(apps)
        
        stage_counts = {}
        raw_rows = []
        for app in apps:
            st = app.status
            stage_counts[st] = stage_counts.get(st, 0) + 1
            
            raw_rows.append({
                "Candidate": app.candidate_name,
                "Job ID": app.job_posting_id,
                "AI Score": app.ai_score,
                "Status": app.status,
                "Applied Date": app.created_at.isoformat() if app.created_at else ""
            })
            
        data["summary_stats"] = {
            "total_jobs": total_jobs,
            "open_jobs": open_jobs,
            "total_applications": total_apps,
            "pipeline_stages": stage_counts
        }
        data["raw_rows"] = raw_rows

    elif report_type == "LEAVE":
        records = db.query(LeaveRequest).all() # Filtering by date range can be added
        
        type_counts = {}
        status_counts = {}
        raw_rows = []
        
        for r in records:
            lt = r.leave_type
            st = r.status
            type_counts[lt] = type_counts.get(lt, 0) + 1
            status_counts[st] = status_counts.get(st, 0) + 1
            
            emp_name = f"{r.employee.first_name} {r.employee.last_name}" if r.employee else f"Emp {r.employee_id}"
            
            raw_rows.append({
                "Employee": emp_name,
                "Leave Type": lt,
                "Status": st,
                "Start Date": r.start_date.isoformat(),
                "End Date": r.end_date.isoformat(),
                "Days": r.days
            })
            
        data["summary_stats"] = {
            "total_leave_requests": len(records),
            "leave_type_breakdown": type_counts,
            "status_breakdown": status_counts
        }
        data["raw_rows"] = raw_rows

    return data
