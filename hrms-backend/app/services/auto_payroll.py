from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
import calendar
from app.models.payroll import PayrollRun, Payslip
from app.models.employee import Employee
from app.models.attendance import AttendanceLog

def is_last_working_day(date: datetime) -> bool:
    """Check if today is last working day of month"""
    year = date.year
    month = date.month
    
    # Get last day of month
    last_day = calendar.monthrange(year, month)[1]
    
    # Find last working day (not weekend)
    last_working = datetime(year, month, last_day)
    while last_working.weekday() >= 5:
        last_working -= timedelta(days=1)
    
    return date.date() == last_working.date()

def check_payroll_already_run(
    month: int,
    year: int,
    db: Session
) -> bool:
    existing = db.query(PayrollRun)\
        .filter(
            PayrollRun.month == month,
            PayrollRun.year == year,
            PayrollRun.status.in_(
                ["COMPLETED", "PROCESSING"])
        ).first()
    return existing is not None

def calculate_employee_payslip(
    employee: Employee,
    month: int,
    year: int,
    db: Session
) -> dict:
    grade = employee.salary_grade
    if not grade:
        return None
    
    # Working days this month
    working_days = 0
    check = datetime(year, month, 1)
    while check.month == month:
        if check.weekday() < 5:
            working_days += 1
        check += timedelta(days=1)
    
    # Present days
    present_days = db.query(
        func.count(AttendanceLog.id))\
        .filter(
            AttendanceLog.employee_id == employee.id,
            extract('month', AttendanceLog.date)
            == month,
            extract('year', AttendanceLog.date)
            == year,
            AttendanceLog.status.in_(
                ["PRESENT", "ON_LEAVE"])
        ).scalar() or 0
    
    leave_days = db.query(
        func.count(AttendanceLog.id))\
        .filter(
            AttendanceLog.employee_id == employee.id,
            extract('month', AttendanceLog.date)
            == month,
            AttendanceLog.status == "ON_LEAVE"
        ).scalar() or 0
    
    # LOP days (Loss of Pay)
    lop_days = max(0, working_days - present_days)
    
    # Calculations
    basic = float(grade.basic_salary)
    hra = float(grade.hra)
    da = float(grade.da)
    allowances = float(grade.allowances)
    gross = basic + hra + da + allowances
    
    # LOP deduction
    daily_rate = gross / working_days \
        if working_days > 0 else 0
    lop_deduction = daily_rate * lop_days
    
    # PF (12% of basic)
    pf = basic * float(grade.pf_rate or 0.12)
    
    # Tax (Indian slabs on annual gross)
    annual_gross = gross * 12
    if annual_gross <= 300000:
        tax = 0
    elif annual_gross <= 600000:
        tax = (annual_gross - 300000) * 0.05
    elif annual_gross <= 900000:
        tax = 15000 + (annual_gross - 600000) * 0.10
    elif annual_gross <= 1200000:
        tax = 45000 + (annual_gross - 900000) * 0.15
    else:
        tax = 90000 + (annual_gross - 1200000) * 0.20
    monthly_tax = tax / 12
    
    total_deductions = pf + monthly_tax + lop_deduction
    net_salary = gross - total_deductions
    
    return {
        "basic_salary": basic,
        "hra": hra,
        "da": da,
        "allowances": allowances,
        "gross_salary": gross,
        "pf_deduction": round(pf, 2),
        "tax_deduction": round(monthly_tax, 2),
        "other_deductions": round(lop_deduction, 2),
        "net_salary": round(max(0, net_salary), 2),
        "working_days": working_days,
        "present_days": present_days,
        "leave_days": leave_days,
        "lop_days": lop_days
    }

def run_payroll_auto(
    db: Session,
    month: int = None,
    year: int = None,
    force: bool = False
) -> dict:
    """
    Auto payroll run.
    Called automatically on last working day
    OR manually with force=True
    """
    today = datetime.utcnow()
    month = month or today.month
    year = year or today.year
    
    # Check if already run
    if not force and check_payroll_already_run(
        month, year, db):
        return {
            "status": "SKIPPED",
            "message": f"Payroll for {month}/{year}"
                       f" already processed"
        }
    
    # Create payroll run record
    import uuid
    run = PayrollRun(
        id=str(uuid.uuid4()),
        month=month,
        year=year,
        run_date=today,
        status="PROCESSING",
        total_employees=0,
        total_gross=0,
        total_deductions=0,
        total_net=0
    )
    db.add(run)
    db.commit()
    
    # Get all active employees
    employees = db.query(Employee)\
        .filter(Employee.status == "ACTIVE")\
        .all()
    
    total_gross = 0
    total_deductions = 0
    total_net = 0
    success_count = 0
    failed = []
    
    for emp in employees:
        try:
            calc = calculate_employee_payslip(
                emp, month, year, db)
            
            if not calc:
                failed.append(emp.id)
                continue
            
            payslip = Payslip(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                payroll_run_id=run.id,
                month=month,
                year=year,
                **calc,
                status="GENERATED"
            )
            db.add(payslip)
            
            total_gross += calc["gross_salary"]
            total_deductions += (
                calc["pf_deduction"] +
                calc["tax_deduction"] +
                calc["other_deductions"]
            )
            total_net += calc["net_salary"]
            success_count += 1
            
        except Exception as e:
            print(f"Payslip error for {emp.id}: {e}")
            failed.append(emp.id)
    
    # Update run totals
    run.status = "COMPLETED"
    run.total_employees = success_count
    run.total_gross = round(total_gross, 2)
    run.total_deductions = round(total_deductions, 2)
    run.total_net = round(total_net, 2)
    db.commit()
    
    # Notify all employees
    from app.services.notification_service \
        import notify_role
    
    month_name = today.strftime("%B") \
        if month == today.month \
        else f"Month {month}"
    
    notify_role(
        db=db,
        role="EMPLOYEE",
        title="Payslip Ready 💰",
        message=f"Your {month_name} {year} "
                f"payslip is ready. "
                f"Check your payslips section.",
        notif_type="PAYROLL_RUN",
        link="/employee/payslips"
    )
    
    # Notify admin
    from app.models.user import User
    admins = db.query(User)\
        .filter(User.role == "ADMIN").all()
    
    from app.services.notification_service \
        import create_notification
    
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            title="Auto Payroll Complete ✅",
            message=f"{month_name} {year} payroll: "
                    f"₹{total_net:,.0f} net paid to "
                    f"{success_count} employees",
            notif_type="PAYROLL_RUN",
            link="/admin/payroll"
        )
    
    return {
        "status": "COMPLETED",
        "month": month,
        "year": year,
        "employees_processed": success_count,
        "failed": len(failed),
        "total_gross": round(total_gross, 2),
        "total_net": round(total_net, 2),
        "auto_triggered": not force
    }
