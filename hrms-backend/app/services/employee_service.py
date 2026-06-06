import json
import uuid
import math
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import UploadFile

from app.models.employee import Employee, Department
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, DepartmentCreate
from app.core.security import hash_password
from app.core.cache import cache

class EmployeeService:
    def __init__(self, db: Session):
        self.db = db

    def get_departments(self):
        return self.db.query(Department).all()

    def create_department(self, data: DepartmentCreate):
        dept = Department(
            id=str(uuid.uuid4()),
            name=data.name,
            description=data.description,
            manager_id=data.manager_id
        )
        self.db.add(dept)
        self.db.commit()
        self.db.refresh(dept)
        return dept

    def get_employees(self, department_id: str = None, status: str = None, search: str = None, page: int = 1, limit: int = 20):
        # Generate cache key
        cache_key = f"employees:list:{department_id}:{status}:{search}:{page}:{limit}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        query = self.db.query(Employee)
        if department_id:
            query = query.filter(Employee.department_id == department_id)
        if status:
            query = query.filter(Employee.status == status)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Employee.first_name.ilike(search_term),
                    Employee.last_name.ilike(search_term),
                    Employee.email.ilike(search_term),
                    Employee.employee_code.ilike(search_term)
                )
            )

        total = query.count()
        pages = math.ceil(total / limit) if limit > 0 else 1
        items = query.offset((page - 1) * limit).limit(limit).all()

        # Build response manually to cache it
        result = {
            "items": [self._serialize_emp(emp) for emp in items],
            "total": total,
            "page": page,
            "pages": pages
        }
        cache.set(cache_key, result, ttl=60)
        return result

    def create_employee(self, data: EmployeeCreate):
        # Invalidate cache
        cache.delete_pattern("employees:list")

        # Create user first
        user_id = str(uuid.uuid4())
        emp_id = str(uuid.uuid4())

        # Generate simple employee code
        emp_code = str(uuid.uuid4())

        user = User(
            id=user_id,
            email=data.email,
            hashed_password=hash_password(data.password),
            role=data.role,
            employee_id=emp_id
        )
        self.db.add(user)

        emp = Employee(
            id=emp_id,
            user_id=user_id,
            employee_code=emp_code,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            address=data.address,
            city=data.city,
            state=data.state,
            country=data.country,
            joining_date=data.joining_date,
            designation=data.designation,
            department_id=data.department_id,
            salary_grade_id=data.salary_grade_id,
            employment_type=data.employment_type,
            status=data.status,
            reporting_manager_id=data.reporting_manager_id,
            emergency_contact=data.emergency_contact,
            bank_details=data.bank_details
        )
        self.db.add(emp)
        self.db.commit()
        self.db.refresh(emp)
        return emp

    def get_employee_by_id(self, emp_id: str):
        cache_key = f"employees:{emp_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        emp = self.db.query(Employee).filter(Employee.id == emp_id).first()
        if emp:
            # Need a model dump to cache
            serialized = self._serialize_emp(emp)
            cache.set(cache_key, serialized, ttl=300)
            return emp
        return None

    def update_employee(self, emp_id: str, data: EmployeeUpdate):
        cache.delete_pattern("employees:list")
        cache.delete(f"employees:{emp_id}")

        emp = self.db.query(Employee).filter(Employee.id == emp_id).first()
        if not emp:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(emp, key, value)

        self.db.commit()
        self.db.refresh(emp)
        return emp

    def delete_employee(self, emp_id: str) -> bool:
        cache.delete_pattern("employees:list")
        cache.delete(f"employees:{emp_id}")

        emp = self.db.query(Employee).filter(Employee.id == emp_id).first()
        if not emp:
            return False

        emp.status = "TERMINATED"
        self.db.commit()
        return True

    def upload_employee_photo(self, emp_id: str, file: UploadFile) -> Optional[str]:
        cache.delete_pattern("employees:list")
        cache.delete(f"employees:{emp_id}")
        
        emp = self.db.query(Employee).filter(Employee.id == emp_id).first()
        if not emp:
            return None

        # Call storage service
        from app.services.storage_service import StorageService
        storage = StorageService()
        url = storage.upload_file(file, f"employees/{emp_id}/photo/{file.filename}")
        
        if url:
            emp.photo_url = url
            self.db.commit()
            
        return url

    def _serialize_emp(self, emp: Employee):
        # Basic serialization to dict for cache
        return {
            "id": emp.id,
            "employee_code": emp.employee_code,
            "user_id": emp.user_id,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "email": emp.email,
            "phone": emp.phone,
            "designation": emp.designation,
            "department_id": emp.department_id,
            "salary_grade_id": emp.salary_grade_id,
            "employment_type": emp.employment_type,
            "status": emp.status,
            "created_at": emp.created_at.isoformat() if emp.created_at else None,
            "updated_at": emp.updated_at.isoformat() if emp.updated_at else None,
            "department": {
                "id": emp.department.id,
                "name": emp.department.name,
                "created_at": emp.department.created_at.isoformat() if emp.department.created_at else None
            } if emp.department else None,
            "salary_grade": {
                "id": emp.salary_grade.id,
                "grade": emp.salary_grade.grade,
                "basic_salary": emp.salary_grade.basic_salary,
                "hra": emp.salary_grade.hra,
                "da": emp.salary_grade.da,
                "allowances": emp.salary_grade.allowances,
                "pf_rate": emp.salary_grade.pf_rate,
                "tax_rate": emp.salary_grade.tax_rate
            } if emp.salary_grade else None
        }
