from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, require_hr_or_admin
from app.models.user import User
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse,
    DepartmentCreate, DepartmentResponse
)
from app.services.employee_service import EmployeeService

router = APIRouter()


@router.get("/departments", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    service = EmployeeService(db)
    return service.get_departments()


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = EmployeeService(db)
    return service.create_department(data)


import csv
import io

@router.post("/import")
def import_employees_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = EmployeeService(db)
    contents = file.file.read()
    reader = csv.DictReader(io.StringIO(contents.decode("utf-8")))
    
    imported = 0
    errors = []
    
    for row in reader:
        try:
            data = EmployeeCreate(
                first_name=row.get("first_name", ""),
                last_name=row.get("last_name", ""),
                email=row.get("email", ""),
                designation=row.get("designation"),
                department_id=row.get("department_id") if row.get("department_id") else None,
                phone=row.get("phone")
            )
            service.create_employee(data)
            imported += 1
        except Exception as e:
            errors.append({"email": row.get("email", "unknown"), "error": str(e)})
            
    return {"status": "success", "imported": imported, "errors": errors}


@router.get("/org-chart")
def get_org_chart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.employee import Employee
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").all()
    
    def build_tree(emp_list, parent_id=None):
        return [
            {
                "id": e.id,
                "name": f"{e.first_name} {e.last_name}",
                "designation": e.designation,
                "department": e.department.name if e.department else "",
                "photoUrl": e.photo_url,
                "children": build_tree(emp_list, e.id)
            }
            for e in emp_list
            if e.reporting_manager_id == parent_id
        ]
        
    tree = build_tree(employees, None)
    return {"tree": tree}


@router.get("")
def list_employees(
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = EmployeeService(db)
        result = service.get_employees(department_id, status, search, page, limit)
        return result
    except Exception as e:
        return {
            "items": [],
            "total": 0,
            "page": page,
            "pages": 0
        }


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = EmployeeService(db)
    return service.create_employee(data)


@router.get("/{id}")
def get_employee(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = EmployeeService(db)
        emp = service.get_employee_by_id(id)
        if not emp:
            return {}
        return emp
    except Exception as e:
        return {}


@router.get("/{id}/team")
def get_employee_team(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        from app.models.employee import Employee
        emp = db.query(Employee).filter(Employee.id == id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

        manager = None
        peers = []

        if emp.reporting_manager_id:
            # Fetch manager
            manager = db.query(Employee).filter(Employee.id == emp.reporting_manager_id).first()
            # Fetch peers (employees sharing the same manager, excluding self)
            peers = db.query(Employee).filter(
                Employee.reporting_manager_id == emp.reporting_manager_id,
                Employee.id != id
            ).all()
        else:
            # If the user has no manager, they might be the top-level manager
            # Let's return their direct reports as their "team"
            peers = db.query(Employee).filter(Employee.reporting_manager_id == id).all()

        return {
            "manager": manager,
            "peers": peers
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: str,
    data: EmployeeUpdate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = EmployeeService(db)
    emp = service.update_employee(id, data)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    id: str,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = EmployeeService(db)
    success = service.delete_employee(id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")


@router.post("/{id}/photo")
def upload_photo(
    id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = EmployeeService(db)
    url = service.upload_employee_photo(id, file)
    if not url:
        raise HTTPException(status_code=404, detail="Employee not found or upload failed")
    return {"photo_url": url}
