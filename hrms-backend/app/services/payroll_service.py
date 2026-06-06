import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional

from app.models.payroll import PayrollRun, Payslip
from app.models.employee import Employee
from app.services.attendance_service import AttendanceService


class PayrollService:
    def __init__(self, db: Session):
        self.db = db

    def run_payroll(self, month: int, year: int, run_by_id: str):
        # Check if already processed
        existing = self.db.query(PayrollRun).filter(
            PayrollRun.month == month,
            PayrollRun.year == year,
            PayrollRun.status == "COMPLETED"
        ).first()

        if existing:
            raise Exception("Payroll already processed for this month")

        run = PayrollRun(
            id=str(uuid.uuid4()),
            month=month,
            year=year,
            run_date=datetime.utcnow(),
            status="PROCESSING",
            total_employees=0,
            total_gross=0.0,
            total_deductions=0.0,
            total_net=0.0,
            run_by_id=run_by_id
        )
        self.db.add(run)

        # Process all active employees
        employees = self.db.query(Employee).filter(Employee.status == "ACTIVE").all()
        attendance_service = AttendanceService(self.db)

        for emp in employees:
            if not emp.salary_grade:
                continue

            # Get attendance for month to calculate LOP (Loss of Pay)
            att_summary = attendance_service.get_monthly_summary(emp.id, year, month)
            working_days = 22 # simple constant for demo
            present_days = att_summary["present_days"]
            absent_days = att_summary["absent_days"]
            # Assume leave_days are tracked elsewhere, for demo we just subtract absent from working_days
            # to figure out LOP

            gross = emp.salary_grade.basic_salary + emp.salary_grade.hra + emp.salary_grade.da + emp.salary_grade.allowances
            pf = gross * emp.salary_grade.pf_rate
            tax = gross * emp.salary_grade.tax_rate

            lop_deduction = 0.0
            if absent_days > 0:
                lop_deduction = (gross / working_days) * absent_days

            total_deductions = pf + tax + lop_deduction
            net = gross - total_deductions

            payslip = Payslip(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                payroll_run_id=run.id,
                month=month,
                year=year,
                basic_salary=emp.salary_grade.basic_salary,
                hra=emp.salary_grade.hra,
                da=emp.salary_grade.da,
                allowances=emp.salary_grade.allowances,
                gross_salary=gross,
                pf_deduction=pf,
                tax_deduction=tax,
                other_deductions=lop_deduction,
                net_salary=net,
                working_days=working_days,
                present_days=present_days,
                leave_days=0, # Simplification
                status="GENERATED"
            )
            self.db.add(payslip)

            run.total_employees += 1
            run.total_gross += gross
            run.total_deductions += total_deductions
            run.total_net += net

        run.status = "COMPLETED"
        self.db.commit()
        self.db.refresh(run)
        return run

    def get_runs(self):
        return self.db.query(PayrollRun).order_by(PayrollRun.year.desc(), PayrollRun.month.desc()).all()

    def get_run_by_id(self, run_id: str):
        return self.db.query(PayrollRun).filter(PayrollRun.id == run_id).first()

    def get_payslips(self, employee_id: Optional[str] = None):
        query = self.db.query(Payslip)
        if employee_id:
            query = query.filter(Payslip.employee_id == employee_id)
        return query.order_by(Payslip.year.desc(), Payslip.month.desc()).all()

    def get_payslip_by_id(self, payslip_id: str):
        return self.db.query(Payslip).filter(Payslip.id == payslip_id).first()

    def generate_payslip_pdf(self, payslip_id: str) -> str:
        # In a real app, use reportlab to generate a professional PDF.
        # Then upload to Supabase Storage and return the URL.
        # For demo purposes, we will just return a placeholder URL.
        payslip = self.get_payslip_by_id(payslip_id)
        if payslip and payslip.pdf_url:
            return payslip.pdf_url
            
        url = f"https://example.com/payslips/{payslip_id}.pdf"
        
        if payslip:
            payslip.pdf_url = url
            self.db.commit()
            
        return url
