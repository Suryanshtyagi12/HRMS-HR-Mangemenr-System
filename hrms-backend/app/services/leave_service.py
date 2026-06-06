import uuid
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional

from app.models.leave import LeaveRequest, LeaveBalance
from app.models.attendance import AttendanceLog
from app.schemas.leave import LeaveRequestCreate, LeaveBalanceUpdate
from app.models.notification import Notification


class LeaveService:
    def __init__(self, db: Session):
        self.db = db

    def apply_leave(self, employee_id: str, data: LeaveRequestCreate):
        # Validate dates
        if data.start_date > data.end_date:
            raise Exception("Start date cannot be after end date")

        days = (data.end_date - data.start_date).days + 1

        # Check balance
        balance = self.get_balance(employee_id)
        if not balance:
            raise Exception("Leave balance not initialized")

        if data.leave_type == "CASUAL" and balance.casual_leave < days:
            raise Exception("Insufficient casual leave balance")
        elif data.leave_type == "SICK" and balance.sick_leave < days:
            raise Exception("Insufficient sick leave balance")
        elif data.leave_type == "EARNED" and balance.earned_leave < days:
            raise Exception("Insufficient earned leave balance")

        # Check overlap
        overlap = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_(["PENDING", "APPROVED"]),
            or_(
                and_(LeaveRequest.start_date <= data.start_date, LeaveRequest.end_date >= data.start_date),
                and_(LeaveRequest.start_date <= data.end_date, LeaveRequest.end_date >= data.end_date)
            )
        ).first()

        if overlap:
            raise Exception("Leave request overlaps with an existing request")

        req = LeaveRequest(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            leave_type=data.leave_type,
            start_date=data.start_date,
            end_date=data.end_date,
            days=days,
            reason=data.reason,
            status="PENDING"
        )
        self.db.add(req)
        
        # Notify manager
        # (In a real system, find manager_id and their user_id)
        
        self.db.commit()
        self.db.refresh(req)
        return req

    def get_requests(self, employee_id: Optional[str] = None, status: Optional[str] = None):
        query = self.db.query(LeaveRequest)
        if employee_id:
            query = query.filter(LeaveRequest.employee_id == employee_id)
        if status:
            query = query.filter(LeaveRequest.status == status)
        return query.order_by(LeaveRequest.created_at.desc()).all()

    def update_request_status(self, request_id: str, status: str, approved_by_id: str, comments: Optional[str] = None):
        req = self.db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
        if not req:
            raise Exception("Leave request not found")

        if req.status != "PENDING":
            raise Exception(f"Cannot change status from {req.status}")

        req.status = status
        req.approved_by_id = approved_by_id
        req.approved_at = datetime.utcnow()
        if comments:
            req.comments = comments

        if status == "APPROVED":
            balance = self.get_balance(req.employee_id)
            if req.leave_type == "CASUAL":
                balance.casual_leave -= req.days
            elif req.leave_type == "SICK":
                balance.sick_leave -= req.days
            elif req.leave_type == "EARNED":
                balance.earned_leave -= req.days

            # Create attendance logs for leave days
            for i in range(req.days):
                leave_date = req.start_date + __import__('datetime').timedelta(days=i)
                # Check if already exists
                log = self.db.query(AttendanceLog).filter(
                    AttendanceLog.employee_id == req.employee_id,
                    AttendanceLog.date == leave_date
                ).first()
                
                if not log:
                    log = AttendanceLog(
                        id=str(uuid.uuid4()),
                        employee_id=req.employee_id,
                        date=leave_date,
                        status="ON_LEAVE",
                        notes=f"{req.leave_type} Leave"
                    )
                    self.db.add(log)
                else:
                    log.status = "ON_LEAVE"
                    log.notes = f"{req.leave_type} Leave"

        # Create notification for employee
        # (Assuming employee has a user account)
        from app.models.employee import Employee
        emp = self.db.query(Employee).filter(Employee.id == req.employee_id).first()
        if emp and emp.user_id:
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=emp.user_id,
                title="Leave Request Updated",
                message=f"Your {req.leave_type} leave request has been {status.lower()}.",
                type="leave",
                is_read=False
            )
            self.db.add(notif)

        self.db.commit()
        self.db.refresh(req)
        return req

    def get_balance(self, employee_id: str):
        year = date.today().year
        balance = self.db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id
        ).first()
        
        if not balance:
            # Auto-initialize leave balance with standard company policy
            balance = LeaveBalance(
                id=str(uuid.uuid4()),
                employee_id=employee_id,
                year=year,
                casual_leave=12,
                sick_leave=10,
                earned_leave=15,
                maternity_leave=180,
                paternity_leave=15
            )
            self.db.add(balance)
            self.db.commit()
            self.db.refresh(balance)
        elif balance.year != year:
            # Auto-renew/reset leave balance for the new year
            balance.year = year
            balance.casual_leave = 12
            balance.sick_leave = 10
            balance.earned_leave = 15
            balance.maternity_leave = 180
            balance.paternity_leave = 15
            self.db.commit()
            self.db.refresh(balance)
            
        return balance

    def update_balance(self, employee_id: str, data: LeaveBalanceUpdate):
        balance = self.get_balance(employee_id)
        if not balance:
            return None
            
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(balance, key, value)
            
        self.db.commit()
        self.db.refresh(balance)
        return balance

    def get_calendar(self, start_date: date, end_date: date):
        return self.db.query(LeaveRequest).filter(
            LeaveRequest.status == "APPROVED",
            or_(
                and_(LeaveRequest.start_date >= start_date, LeaveRequest.start_date <= end_date),
                and_(LeaveRequest.end_date >= start_date, LeaveRequest.end_date <= end_date)
            )
        ).all()
