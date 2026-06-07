from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_hr_or_admin
from app.reports.data_collector import collect_report_data
from app.reports.ai_summarizer import generate_report_summary
from app.reports.pdf_generator import generate_pdf_report
from app.reports.excel_generator import generate_excel_report

router = APIRouter()

VALID_REPORT_TYPES = ["HEADCOUNT", "ATTENDANCE", "PAYROLL", "RECRUITMENT", "LEAVE"]

@router.get("/preview")
def preview_report(
    report_type: str, 
    month: int, 
    year: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    if report_type.upper() not in VALID_REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid report type")
        
    # 1. Collect Data
    data = collect_report_data(db, report_type, month, year)
    
    # 2. AI Summary
    ai_summary = generate_report_summary(report_type, month, year, data.get("summary_stats", {}))
    
    # 3. Return JSON with limited preview rows
    return {
        "status": "success",
        "report_type": report_type.upper(),
        "month": month,
        "year": year,
        "ai_summary": ai_summary,
        "preview_rows": data.get("raw_rows", [])[:10],
        "total_rows": len(data.get("raw_rows", []))
    }

@router.get("/export/pdf")
def export_pdf(
    report_type: str, 
    month: int, 
    year: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    if report_type.upper() not in VALID_REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid report type")
        
    data = collect_report_data(db, report_type, month, year)
    ai_summary = generate_report_summary(report_type, month, year, data.get("summary_stats", {}))
    
    pdf_bytes = generate_pdf_report(report_type, month, year, data, ai_summary)
    
    headers = {
        "Content-Disposition": f"attachment; filename=HRMS-Report-{report_type}-{year}-{month}.pdf"
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

@router.get("/export/excel")
def export_excel(
    report_type: str, 
    month: int, 
    year: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    if report_type.upper() not in VALID_REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid report type")
        
    data = collect_report_data(db, report_type, month, year)
    ai_summary = generate_report_summary(report_type, month, year, data.get("summary_stats", {}))
    
    excel_bytes = generate_excel_report(report_type, month, year, data, ai_summary)
    
    headers = {
        "Content-Disposition": f"attachment; filename=HRMS-Report-{report_type}-{year}-{month}.xlsx"
    }
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)
