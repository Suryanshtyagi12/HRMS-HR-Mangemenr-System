from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
import uuid
from datetime import datetime, date

from app.models.performance import PerformanceCycle, PerformanceGoal, PerformanceReview
from app.schemas.performance import (
    PerformanceGoalCreate, PerformanceGoalUpdate,
    PerformanceReviewCreate, PerformanceReviewUpdate
)
from app.ai.gemini_client import generate_text, generate_json

class PerformanceService:
    def __init__(self, db: Session):
        self.db = db

    def get_cycles(self):
        return self.db.query(PerformanceCycle).order_by(PerformanceCycle.year.desc()).all()

    def get_goals(self, employee_id: Optional[str] = None):
        query = self.db.query(PerformanceGoal)
        if employee_id:
            query = query.filter(PerformanceGoal.employee_id == employee_id)
        return query.all()

    def create_goal(self, employee_id: str, data: PerformanceGoalCreate):
        goal = PerformanceGoal(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            **data.model_dump()
        )
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def update_goal(self, goal_id: str, data: PerformanceGoalUpdate):
        goal = self.db.query(PerformanceGoal).filter(PerformanceGoal.id == goal_id).first()
        if not goal:
            raise Exception("Goal not found")
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(goal, key, value)
            
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def get_reviews(self, employee_id: Optional[str] = None, reviewer_id: Optional[str] = None):
        query = self.db.query(PerformanceReview)
        if employee_id:
            query = query.filter(PerformanceReview.employee_id == employee_id)
        if reviewer_id:
            query = query.filter(PerformanceReview.reviewer_id == reviewer_id)
        return query.all()

    def update_review(self, review_id: str, data: PerformanceReviewUpdate):
        review = self.db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
        if not review:
            raise Exception("Review not found")
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(review, key, value)
            
        # If completing review, optionally generate AI narrative
        if review.status == "COMPLETED" and not review.ai_narrative and review.comments:
            prompt = f"Analyze the following manager performance review comments and generate a concise 2-sentence strategic narrative for the employee's growth: '{review.comments}'"
            try:
                narrative = generate_text(prompt)
                review.ai_narrative = narrative
            except Exception as e:
                review.ai_narrative = "AI generation failed."

        self.db.commit()
        self.db.refresh(review)
        return review

    def calculate_attrition_risk(self):
        from app.models.employee import Employee
        from app.models.attendance import AttendanceLog
        import json
        
        employees = self.db.query(Employee).filter(Employee.status == "ACTIVE").all()
        if not employees:
            return []
            
        snapshot = []
        for emp in employees:
            absences = self.db.query(AttendanceLog).filter(
                AttendanceLog.employee_id == emp.id,
                AttendanceLog.status == "ABSENT"
            ).count()
            
            last_review = self.db.query(PerformanceReview).filter(
                PerformanceReview.employee_id == emp.id
            ).order_by(PerformanceReview.created_at.desc()).first()
            
            review_score = last_review.overall_rating if last_review else 5.0
            
            risk_score = absences * 2 + (5.0 - review_score) * 3
            
            snapshot.append({
                "id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "absences_this_year": absences,
                "latest_performance_rating": review_score,
                "risk_score": risk_score
            })
            
        # Sort by risk score and pick top 5
        snapshot.sort(key=lambda x: x["risk_score"], reverse=True)
        top_risks = snapshot[:5]
        
        for s in top_risks:
            del s["risk_score"]
            
        prompt = f"""
        You are an HR Analytics AI. Based on the following data of employees with highest attrition indicators, calculate their final attrition risk (MEDIUM, HIGH) and provide a 1 sentence reason.
        
        Employee Data:
        {json.dumps(top_risks, indent=2)}
        
        Return ONLY a JSON array of objects with keys: id, name, risk, reason. Example:
        [
          {{"id": "uuid", "name": "John Doe", "risk": "HIGH", "reason": "Low performance ratings and high absent days."}}
        ]
        """
        try:
            result = generate_json(prompt)
            if not isinstance(result, list):
                if isinstance(result, dict) and 'data' in result:
                    result = result['data']
                else:
                    return []
            return result
        except Exception as e:
            print(f"AI Attrition Error: {e}")
            return []

    def get_employee_tasks(self, employee_id: Optional[str] = None, manager_id: Optional[str] = None):
        from app.models.performance import EmployeeTask
        query = self.db.query(EmployeeTask)
        if employee_id:
            query = query.filter(EmployeeTask.employee_id == employee_id)
        if manager_id:
            query = query.filter(EmployeeTask.manager_id == manager_id)
        return query.order_by(EmployeeTask.created_at.desc()).all()

    def create_employee_task(self, manager_id: str, data: 'EmployeeTaskCreate'):
        from app.models.performance import EmployeeTask
        task = EmployeeTask(
            id=str(uuid.uuid4()),
            manager_id=manager_id,
            **data.model_dump()
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_employee_task(self, task_id: str, data: 'EmployeeTaskUpdate'):
        from app.models.performance import EmployeeTask
        task = self.db.query(EmployeeTask).filter(EmployeeTask.id == task_id).first()
        if not task:
            raise Exception("Task not found")
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
            
        self.db.commit()
        self.db.refresh(task)
        return task
