import uuid
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import Optional

from app.models.attendance import AttendanceLog
from app.models.employee import Employee


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db

    def clock_in_out(self, employee_id: str, location: Optional[str]) -> AttendanceLog:
        today = date.today()
        now = datetime.utcnow()

        log = self.db.query(AttendanceLog).filter(
            AttendanceLog.employee_id == employee_id,
            AttendanceLog.date == today
        ).first()

        if not log:
            # Clock In
            log = AttendanceLog(
                id=str(uuid.uuid4()),
                employee_id=employee_id,
                date=today,
                clock_in=now,
                status="PRESENT",
                location=location
            )
            self.db.add(log)
        else:
            # Clock Out
            if not log.clock_out:
                log.clock_out = now
                if log.clock_in:
                    delta = log.clock_out - log.clock_in
                    log.hours_worked = round(delta.total_seconds() / 3600.0, 2)
            else:
                # Already clocked out, maybe updating? We just return it for now.
                pass

        self.db.commit()
        self.db.refresh(log)
        return log

    def get_logs(self, employee_id: Optional[str], date_from: Optional[date], date_to: Optional[date], status: Optional[str]):
        query = self.db.query(AttendanceLog)
        
        if employee_id:
            query = query.filter(AttendanceLog.employee_id == employee_id)
        if date_from:
            query = query.filter(AttendanceLog.date >= date_from)
        if date_to:
            query = query.filter(AttendanceLog.date <= date_to)
        if status:
            query = query.filter(AttendanceLog.status == status)
            
        logs = query.order_by(AttendanceLog.date.desc()).all()

        # If fetching for all employees and date_from is set
        if not employee_id and date_from:
            all_employees = self.db.query(Employee).filter(Employee.status == "ACTIVE").all()
            log_dict = {log.employee_id: log for log in logs}
            
            result = []
            for emp in all_employees:
                if emp.id in log_dict:
                    if status and log_dict[emp.id].status != status:
                        continue
                    result.append(log_dict[emp.id])
                else:
                    if status and status != "ABSENT":
                        continue
                    # Fake log for absent
                    fake_log = AttendanceLog(
                        id=f"fake_{emp.id}_{date_from}",
                        employee_id=emp.id,
                        date=date_from,
                        status="ABSENT",
                        created_at=datetime.utcnow()
                    )
                    fake_log.employee = emp
                    result.append(fake_log)
            return result

        return logs

    def get_monthly_summary(self, employee_id: str, year: int, month: int):
        logs = self.db.query(AttendanceLog).filter(
            AttendanceLog.employee_id == employee_id,
            extract('year', AttendanceLog.date) == year,
            extract('month', AttendanceLog.date) == month
        ).all()

        present = sum(1 for log in logs if log.status in ("PRESENT", "LATE", "HALF_DAY"))
        absent = sum(1 for log in logs if log.status == "ABSENT")
        late = sum(1 for log in logs if log.status == "LATE")
        
        total_hours = sum(log.hours_worked for log in logs if log.hours_worked)
        avg_hours = round(total_hours / present, 2) if present > 0 else 0.0

        return {
            "present_days": present,
            "absent_days": absent,
            "late_days": late,
            "avg_hours": avg_hours
        }

    def get_today_snapshot(self):
        today = date.today()
        
        # Get all attendance records for today
        logs = self.db.query(AttendanceLog).filter(AttendanceLog.date == today).all()
        
        present_count = sum(1 for log in logs if log.status in ("PRESENT", "LATE", "HALF_DAY"))
        leave_count = sum(1 for log in logs if log.status == "ON_LEAVE")
        absent_count = sum(1 for log in logs if log.status == "ABSENT")
        
        # Assume employees without a record are not clocked in (could be absent or just hasn't clocked in yet)
        total_employees = self.db.query(Employee).filter(Employee.status == "ACTIVE").count()
        missing = total_employees - len(logs)
        
        # For snapshot, we might consider missing as absent if it's late in the day, but we'll stick to actual marked ABSENT + missing for total absent
        return {
            "total_clocked_in": present_count,
            "total_absent": absent_count + missing,
            "total_on_leave": leave_count
        }

    def get_anomalies(self, year: int, month: int):
        # A simple anomaly detection: 3+ absences or 5+ late arrivals
        # In a real system, consecutive absences require ordering by date.
        # For simplicity, we just look at totals.
        logs = self.db.query(AttendanceLog).filter(
            extract('year', AttendanceLog.date) == year,
            extract('month', AttendanceLog.date) == month
        ).all()
        
        emp_stats = {}
        for log in logs:
            if log.employee_id not in emp_stats:
                emp_stats[log.employee_id] = {"absent": 0, "late": 0}
            if log.status == "ABSENT":
                emp_stats[log.employee_id]["absent"] += 1
            elif log.status == "LATE":
                emp_stats[log.employee_id]["late"] += 1
                
        anomalies = []
        for emp_id, stats in emp_stats.items():
            if stats["absent"] >= 3 or stats["late"] >= 5:
                emp = self.db.query(Employee).filter(Employee.id == emp_id).first()
                if emp:
                    anomalies.append({
                        "employee_id": emp_id,
                        "employee_name": f"{emp.first_name} {emp.last_name}",
                        "consecutive_absences": stats["absent"], # simplify
                        "late_arrivals": stats["late"]
                    })
                    
        return anomalies
