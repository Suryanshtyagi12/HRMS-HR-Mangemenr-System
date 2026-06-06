from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_hr_or_admin
from app.models.user import User
from app.schemas.payroll import PayrollRunCreate, PayrollRunResponse, PayslipResponse
from app.services.payroll_service import PayrollService

router = APIRouter()


@router.post("/run", response_model=PayrollRunResponse)
def run_payroll(
    data: PayrollRunCreate,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = PayrollService(db)
    try:
        res = service.run_payroll(data.month, data.year, current_user.id)
        from app.services.notification_service import notify_role
        notify_role(db, "EMPLOYEE", "Payslip Ready", f"Your payslip for {data.month}/{data.year} is available", "PAYROLL_RUN", "/employee/payslips")
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/runs")
def get_payroll_runs(
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    try:
        service = PayrollService(db)
        runs = service.get_runs()
        return {"items": runs}
    except Exception as e:
        return {"items": []}


@router.get("/runs/{run_id}", response_model=PayrollRunResponse)
def get_payroll_run(
    run_id: str,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    service = PayrollService(db)
    run = service.get_run_by_id(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/payslips", response_model=List[PayslipResponse])
def get_payslips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PayrollService(db)
    
    employee_id = None
    if current_user.role == "EMPLOYEE":
        employee_id = current_user.employee_id
        if not employee_id:
            return []
            
    return service.get_payslips(employee_id)


@router.get("/payslips/{payslip_id}", response_model=PayslipResponse)
def get_payslip(
    payslip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PayrollService(db)
    payslip = service.get_payslip_by_id(payslip_id)
    
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
        
    if current_user.role == "EMPLOYEE" and payslip.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return payslip


@router.get("/payslips/{payslip_id}/pdf")
def generate_payslip_pdf(
    payslip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PayrollService(db)
    payslip = service.get_payslip_by_id(payslip_id)
    
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
        
    if current_user.role == "EMPLOYEE" and payslip.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    url = service.generate_payslip_pdf(payslip_id)
    return {"pdf_url": url}

from pydantic import BaseModel
from typing import Optional

class AutoPayrollRequest(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    force: bool = False

@router.post("/run-auto")
def trigger_auto_payroll(
    req: AutoPayrollRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    from app.services.auto_payroll import run_payroll_auto
    try:
        result = run_payroll_auto(db, req.month, req.year, req.force)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auto-status")
def get_auto_payroll_status(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    from app.services.auto_payroll import check_payroll_already_run
    
    today = datetime.utcnow()
    m = month or today.month
    y = year or today.year
    
    is_run = check_payroll_already_run(m, y, db)
    
    # Get run details if run
    run_details = None
    if is_run:
        from app.models.payroll import PayrollRun
        run = db.query(PayrollRun).filter(
            PayrollRun.month == m,
            PayrollRun.year == y,
            PayrollRun.status.in_(["COMPLETED", "PROCESSING"])
        ).first()
        if run:
            run_details = {
                "id": run.id,
                "status": run.status,
                "total_employees": run.total_employees,
                "total_gross": run.total_gross,
                "total_net": run.total_net,
                "run_date": run.run_date.isoformat() if run.run_date else None
            }
            
    return {
        "run": is_run,
        "month": m,
        "year": y,
        "details": run_details
    }
