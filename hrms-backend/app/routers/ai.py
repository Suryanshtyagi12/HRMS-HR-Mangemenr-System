from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.dependencies import require_admin, get_current_user
import google.generativeai as genai

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "module": "ai"}

@router.get("/status")
async def ai_status():
    status = {}
    
    # Check Gemini Flash
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        model.generate_content("Say OK in one word")
        status["gemini_flash"] = "✓ working"
    except Exception as e:
        status["gemini_flash"] = f"✗ {str(e)[:50]}"
    
    # Check Gemini Pro
    try:
        model = genai.GenerativeModel("gemini-2.5-pro")
        model.generate_content("Say OK in one word")
        status["gemini_pro"] = "✓ working"
    except Exception as e:
        status["gemini_pro"] = f"✗ {str(e)[:50]}"
    
    # Check Groq
    try:
        from app.ai.groq_client import groq_generate_text
        groq_generate_text("Say OK in one word")
        status["groq_llama3"] = "✓ working"
    except Exception as e:
        status["groq_llama3"] = f"✗ {str(e)[:50]}"
    
    working = [k for k,v in status.items() 
               if "working" in v]
    status["active_provider"] = (
        working[0] if working else "none")
    
    return status

from app.ai.jd_generator import generate_full_jd

class JDGenerateRequest(BaseModel):
    role: str
    department: str
    requirements: List[str]

@router.post("/generate-jd")
def generate_jd(req: JDGenerateRequest, current_user = Depends(require_admin)):
    req_str = ", ".join(req.requirements)
    gen_jd = generate_full_jd(req.role, req.department, "Mid-Level", "Full-time", "Remote", req_str)
    
    if not gen_jd:
        return {
            "overview": "Failed to generate overview.",
            "responsibilities": ["Please specify manually"],
            "requiredSkills": [],
            "qualifications": [],
            "niceToHave": [],
            "benefits": []
        }
    return gen_jd

from app.ai.report_generator import generate_company_report

@router.post("/insights")
async def generate_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Admin and HR only
    if current_user.role not in ["ADMIN", "HR_RECRUITER"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied")
    
    try:
        report = generate_company_report(db)
        return {
            "success": True,
            "data": report
        }
    except Exception as e:
        print(f"Report generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {str(e)}")

@router.get("/insights/quick")
async def quick_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Quick stats for dashboard top cards.
    No Gemini call — just real DB numbers.
    """
    from app.ai.company_analyzer import collect_company_data
    
    try:
        data = collect_company_data(db)
        return {
            "success": True,
            "data": {
                "attendance_rate": data["attendance"]["rate_this_month"],
                "high_risk_employees": data["attrition_risk"]["high_risk_count"],
                "open_positions": data["recruitment"]["open_positions"],
                "pending_leaves": data["leave"]["pending_requests"],
                "new_hires": data["headcount"]["new_hires_this_month"],
                "payroll_change": data["payroll"]["change_percent"]
            }
        }
    except Exception as e:
        return {"success": False, "data": {}}


class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def ai_assistant_chat(req: ChatRequest, current_user = Depends(get_current_user)):
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction="You are an HR AI assistant for HRMS Pro. Only answer questions related to company policies, HR, leave, payroll, and employee benefits. If a user asks anything outside this scope (like coding, generic facts, or creative writing), politely decline and remind them you are an HR assistant. Keep your answers concise and professional."
        )
        
        response = model.generate_content(
            req.message,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=250,
                temperature=0.3
            )
        )
        
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.ai.resignation_predictor import run_company_risk_analysis, calculate_resignation_risk

@router.get("/resignation-risk")
def get_company_resignation_risk(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "HR_RECRUITER"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return run_company_risk_analysis(db)

@router.get("/resignation-risk/{employee_id}")
def get_employee_resignation_risk(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "HR_RECRUITER"] and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    risk = calculate_resignation_risk(employee_id, db)
    if not risk:
        raise HTTPException(status_code=404, detail="Employee not found")
    return risk
