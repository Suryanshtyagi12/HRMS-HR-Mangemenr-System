from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid
import json
import logging
from datetime import datetime, timedelta

from app.database import get_db
from app.dependencies import get_current_user, require_hr_or_admin
from app.models.recruitment import JobPosting, Application, InterviewSession, JobRequest
from app.ai.jd_generator import generate_full_jd, generate_requirements_only
from app.ai.resume_screener import screen_multiple_resumes, screen_resume_against_job
from app.ai.interview_ai import generate_interview_questions, evaluate_answer
from app.ai.candidate_ranker import rank_candidates_advanced, compare_candidates_ai
from app.schemas.recruitment import (
    JobPostingCreate, JobPostingOut, ApplicationOut, 
    InterviewSessionCreate, InterviewSessionOut, InterviewAnswerSubmit,
    JDGenerateRequest, JDRequirementsRequest, MainInterviewScheduleRequest, StatusUpdateRequest,
    JobRequestCreate, JobRequestOut
)

logger = logging.getLogger(__name__)
router = APIRouter()

# ──────────────────────────────────────────────────────────────
# JOBS
# ──────────────────────────────────────────────────────────────

@router.get("/jobs", response_model=dict)
def get_jobs(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(JobPosting)
    if status:
        query = query.filter(JobPosting.status == status)
    
    jobs = query.all()
    result = []
    for job in jobs:
        app_count = db.query(func.count(Application.id)).filter(Application.job_posting_id == job.id).scalar()
        job_dict = {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "description": job.description,
            "requirements": job.requirements,
            "location": job.location,
            "employment_type": job.employment_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "openings": job.openings,
            "status": job.status,
            "created_at": job.created_at,
            "application_count": app_count or 0
        }
        result.append(job_dict)
    
    return {"items": result, "total": len(result)}

@router.post("/jobs")
def create_job(job_in: JobPostingCreate, current_user = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    import os
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    description = job_in.description
    ai_generated = False
    
    # If only requirements are provided but no description, generate it
    if job_in.requirements and not description:
        gen_jd = generate_full_jd(
            title=job_in.title,
            department=job_in.department,
            experience_level=job_in.experience_level or "Mid-level",
            employment_type=job_in.employment_type or "Full-time",
            location=job_in.location or "Remote",
            user_requirements=", ".join(job_in.requirements) if isinstance(job_in.requirements, list) else str(job_in.requirements)
        )
        description = json.dumps(gen_jd) if gen_jd else ""
        ai_generated = True

    new_job = JobPosting(
        title=job_in.title,
        department=job_in.department,
        description=description,
        requirements=job_in.requirements,
        location=job_in.location,
        employment_type=job_in.employment_type,
        salary_min=job_in.salary_min,
        salary_max=job_in.salary_max,
        openings=job_in.openings,
        posted_by_id=current_user.id,
        ai_generated_jd=ai_generated
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    new_job.public_application_url = f"{frontend_url}/apply/{new_job.id}"
    db.commit()
    db.refresh(new_job)
    
    return {"status": "success", "data": {"id": new_job.id, "public_application_url": new_job.public_application_url}}

@router.put("/jobs/{job_id}")
def update_job(job_id: str, job_in: JobPostingCreate, current_user = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    for key, value in job_in.model_dump().items():
        setattr(job, key, value)
        
    db.commit()
    db.refresh(job)
    return {"status": "success"}

@router.patch("/jobs/{job_id}/close")
def close_job(job_id: str, current_user = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = "CLOSED"
    db.commit()
    return {"status": "success"}

@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, current_user = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Delete related interview sessions and applications to satisfy foreign key constraints
    db.query(InterviewSession).filter(InterviewSession.job_posting_id == job.id).delete()
    db.query(Application).filter(Application.job_posting_id == job.id).delete()
    
    db.delete(job)
    db.commit()
    return {"status": "success"}


# ──────────────────────────────────────────────────────────────
# AI JD GENERATOR
# ──────────────────────────────────────────────────────────────

@router.post("/jobs/generate-jd")
def generate_jd_endpoint(req: JDGenerateRequest, current_user = Depends(require_hr_or_admin)):
    try:
        jd = generate_full_jd(
            title=req.title,
            department=req.department,
            experience_level=req.experience_level,
            employment_type=req.employment_type,
            location=req.location,
            user_requirements=req.requirements
        )
        return {"status": "success", "data": jd}
    except Exception as e:
        logger.error(f"Failed to generate JD: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/jobs/generate-requirements")
def generate_requirements_endpoint(req: JDRequirementsRequest, current_user = Depends(require_hr_or_admin)):
    try:
        reqs = generate_requirements_only(
            title=req.title,
            department=req.department,
            experience_level=req.experience_level
        )
        return {"status": "success", "data": reqs}
    except Exception as e:
        logger.error(f"Failed to generate requirements: {e}")
        return {"status": "error", "message": str(e)}

# ──────────────────────────────────────────────────────────────
# AI RESUME SCREENER
# ──────────────────────────────────────────────────────────────

@router.post("/screen/bulk")
async def bulk_screen(
    job_posting_id: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    req_list = job.requirements if job.requirements else []
    desc_str = job.description or ""
    
    files_data = []
    for file in files:
        contents = await file.read()
        files_data.append((file.filename, contents))
        
    # Call Gemini
    results = screen_multiple_resumes(
        files=files_data,
        job_title=job.title,
        job_description=desc_str,
        job_requirements=req_list
    )
    
    db_results = []
    for ai_res in results:
        c_name = ai_res.get("candidate_name", "Unknown Candidate")
        if c_name == "Unknown":
             c_name = ai_res.get("filename", "").replace(".pdf", "")
             
        app = Application(
            job_posting_id=job.id,
            candidate_name=c_name,
            candidate_email=ai_res.get("candidate_email", ""),
            candidate_phone=ai_res.get("candidate_phone", ""),
            resume_text=ai_res.get("raw_text", ""),
            ai_score=ai_res.get("score", 0),
            ai_summary=ai_res.get("summary", ""),
            ai_skills_match=ai_res.get("skills_match", []),
            ai_red_flags=ai_res.get("red_flags", []),
            ai_details=ai_res,
            ai_recommendation=ai_res.get("recommendation", "HOLD"),
            status="SCREENING"
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        
        db_results.append({
            "id": app.id,
            "candidate_name": app.candidate_name,
            "candidate_email": app.candidate_email,
            "candidate_phone": app.candidate_phone,
            "score": app.ai_score,
            "skills_match": app.ai_skills_match,
            "missing_skills": ai_res.get("missing_skills", []),
            "good_to_have_match": ai_res.get("good_to_have_match", []),
            "experience_years": ai_res.get("total_experience_years", 0),
            "current_role": ai_res.get("current_role", ""),
            "current_company": ai_res.get("current_company", ""),
            "summary": app.ai_summary,
            "strengths": ai_res.get("strengths", []),
            "red_flags": app.ai_red_flags,
            "recommendation": app.ai_recommendation,
            "status": app.status,
            "rank": ai_res.get("rank", 0),
            "score_breakdown": ai_res.get("score_breakdown", {})
        })

    # Sort DESC by score
    db_results.sort(key=lambda x: x.get("score") or 0, reverse=True)
    return {"status": "success", "results": db_results}

@router.post("/screen/single")
async def single_screen(
    job_posting_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    req_list = job.requirements if job.requirements else []
    desc_str = job.description or ""
    
    contents = await file.read()
    
    # Call Gemini
    ai_res = screen_resume_against_job(
        pdf_bytes=contents,
        job_title=job.title,
        job_description=desc_str,
        job_requirements=req_list
    )
    
    c_name = ai_res.get("candidate_name", "Unknown Candidate")
    if c_name == "Unknown":
         c_name = file.filename.replace(".pdf", "")
         
    app = Application(
        job_posting_id=job.id,
        candidate_name=c_name,
        candidate_email=ai_res.get("candidate_email", ""),
        candidate_phone=ai_res.get("candidate_phone", ""),
        resume_text=ai_res.get("raw_text", ""),
        ai_score=ai_res.get("score", 0),
        ai_summary=ai_res.get("summary", ""),
        ai_skills_match=ai_res.get("skills_match", []),
        ai_red_flags=ai_res.get("red_flags", []),
        ai_details=ai_res,
        ai_recommendation=ai_res.get("recommendation", "HOLD"),
        status="SCREENING"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    
    result = {
        "id": app.id,
        "candidate_name": app.candidate_name,
        "candidate_email": app.candidate_email,
        "candidate_phone": app.candidate_phone,
        "score": app.ai_score,
        "skills_match": app.ai_skills_match,
        "missing_skills": ai_res.get("missing_skills", []),
        "good_to_have_match": ai_res.get("good_to_have_match", []),
        "experience_years": ai_res.get("total_experience_years", 0),
        "current_role": ai_res.get("current_role", ""),
        "current_company": ai_res.get("current_company", ""),
        "summary": app.ai_summary,
        "strengths": ai_res.get("strengths", []),
        "red_flags": app.ai_red_flags,
        "recommendation": app.ai_recommendation,
        "status": app.status,
        "score_breakdown": ai_res.get("score_breakdown", {})
    }
    
    return {"status": "success", "result": result}


# ──────────────────────────────────────────────────────────────
# PIPELINE (KANBAN)
# ──────────────────────────────────────────────────────────────

@router.post("/pipeline/run-auto")
def run_auto_pipeline_endpoint(
    data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    job_posting_id = data.get("job_posting_id")
    if not job_posting_id:
        raise HTTPException(status_code=400, detail="job_posting_id is required")
        
    from app.services.auto_pipeline import run_auto_pipeline
    result = run_auto_pipeline(job_posting_id, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return {"status": "success", "data": result}

@router.post("/pipeline/run-auto-all")
def run_auto_pipeline_all_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    from app.services.auto_pipeline import run_auto_pipeline
    jobs = db.query(JobPosting).filter(JobPosting.status == "OPEN").all()
    results = []
    
    for job in jobs:
        # Check if there are APPLIED applications
        apps = db.query(Application).filter(
            Application.job_posting_id == job.id,
            Application.status == "APPLIED"
        ).first()
        if apps:
            res = run_auto_pipeline(job.id, db)
            results.append(res)
            
    return {"status": "success", "processed_jobs": len(results), "data": results}

@router.get("/pipeline")
def get_pipeline(job_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Application)
    if job_id:
        query = query.filter(Application.job_posting_id == job_id)
        
    apps = query.all()
    
    pipeline = {
        "APPLIED": [],
        "SCREENING": [],
        "SHORTLISTED": [],
        "AI_INTERVIEW_TAKEN": [],
        "INTERVIEW_SCHEDULED": [],
        "INTERVIEWED": [],
        "OFFERED": [],
        "HIRED": [],
        "REJECTED": []
    }
    
    for app in apps:
        if app.status in pipeline:
            pipeline[app.status].append({
                "id": app.id,
                "job_posting_id": app.job_posting_id,
                "candidate_name": app.candidate_name,
                "candidate_email": app.candidate_email,
                "candidate_phone": app.candidate_phone,
                "ai_score": app.ai_score,
                "ai_summary": app.ai_summary,
                "ai_skills_match": app.ai_skills_match,
                "ai_red_flags": app.ai_red_flags,
                "ai_details": app.ai_details,
                "status": app.status,
                "interview_score": app.interview_score,
                "created_at": app.created_at.isoformat()
            })
            
    return {"data": pipeline}

@router.patch("/application/{application_id}/status")
def update_application_status(
    application_id: str, 
    req: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.status = req.status
    
    if req.status == "SHORTLISTED":
        from app.services.notification_service import create_notification
        create_notification(
            db, current_user.id,
            "Candidate Shortlisted",
            f"{app.candidate_name} moved to shortlist",
            "RECRUITMENT", 
            "/hr/recruitment/pipeline"
        )
        
    db.commit()
    return {"status": "success", "new_status": req.status}


@router.post("/application/{application_id}/schedule-main")
def schedule_main_interview(
    application_id: str,
    req: MainInterviewScheduleRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.main_interview_details = req.model_dump()
    app.status = "INTERVIEW_SCHEDULED"
    db.commit()
    
    # Generate Email via AI
    import google.generativeai as genai
    from app.config import settings
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = f"""
    Write a professional interview invitation email for a candidate.
    Candidate Name: {app.candidate_name}
    Job Title: {app.job.title if app.job else 'the open position'}
    Interview Date & Time: {req.date_time}
    Topic/Focus: {req.topic}
    Google Meet Link: {req.google_meet_link}
    Additional Notes: {req.notes}
    
    The email should be warm, professional, and clear. Do not include placeholders, use the actual data provided.
    """
    
    try:
        response = model.generate_content(prompt)
        email_body = response.text
        print(f"EMAIL: Interview Scheduled for {app.candidate_name}\n" + "-"*40 + f"\n{email_body}\n" + "-"*40)
    except Exception as e:
        logger.error(f"Failed to generate email: {e}")
        
    return {"status": "success", "message": "Interview scheduled and email sent (printed to console)"}


# ──────────────────────────────────────────────────────────────
# AI INTERVIEW BOT
# ──────────────────────────────────────────────────────────────

@router.post("/interview/create")
def create_interview_session(
    data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    app_id = data.get("application_id")
    job_id = data.get("job_posting_id")
    
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    app = db.query(Application).filter(Application.id == app_id).first()
    
    if not job or not app:
        raise HTTPException(status_code=404, detail="Job or Application not found")
        
    questions = generate_interview_questions(
        job_title=job.title,
        job_description=job.description or "",
        job_requirements=job.requirements or [],
        resume_text=app.resume_text or "",
        candidate_name=app.candidate_name,
        num_questions=5
    )
    
    token = str(uuid.uuid4())
    # Retrieve FRONTEND_URL from env or use default
    import os
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    session = InterviewSession(
        application_id=app.id,
        job_posting_id=job.id,
        token=token,
        candidate_name=app.candidate_name,
        candidate_email=app.candidate_email,
        status="PENDING",
        questions=questions,
        expires_at=datetime.utcnow() + timedelta(hours=48)
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "session_id": session.id,
        "interview_link": f"{frontend_url}/interview/{token}",
        "candidate_name": session.candidate_name,
        "expires_at": session.expires_at
    }

@router.get("/interview/session/{token}")
def get_interview_session(token: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid token")
        
    if session.expires_at and datetime.utcnow() > session.expires_at:
        raise HTTPException(status_code=400, detail="Interview link expired")
        
    if session.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Interview already completed")

    return {
        "candidate_name": session.candidate_name,
        "job_title": session.job.title,
        "total_questions": len(session.questions) if session.questions else 0,
        "current_question_number": session.current_question_number,
        "status": session.status,
        "started": session.started_at is not None
    }

@router.get("/interview/session/{token}/question/{num}")
def get_interview_question(token: str, num: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid token")
        
    if num != session.current_question_number:
        raise HTTPException(status_code=400, detail="Cannot access this question yet")
        
    if not session.questions or num > len(session.questions) or num < 1:
        raise HTTPException(status_code=400, detail="Invalid question number")
        
    q_data = session.questions[num - 1]
    return {
        "question_number": q_data.get("question_number", num),
        "question": q_data.get("question", ""),
        "type": q_data.get("type", "TECHNICAL")
    }

@router.post("/interview/session/{token}/start")
def start_interview_session(token: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid token")
        
    if session.status != "PENDING" and session.started_at is not None:
        pass # Already started
    else:
        session.started_at = datetime.utcnow()
        session.status = "IN_PROGRESS"
        session.current_question_number = 1
        db.commit()
        
    if not session.questions:
        raise HTTPException(status_code=400, detail="No questions found")
        
    return {
        "question_number": 1,
        "question": session.questions[0].get("question", ""),
        "type": session.questions[0].get("type", "TECHNICAL")
    }

@router.post("/interview/session/{token}/answer")
def submit_interview_answer(token: str, data: dict, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid token")
        
    q_num = data.get("question_number")
    answer_text = data.get("answer_text", "")
    
    if q_num != session.current_question_number:
        raise HTTPException(status_code=400, detail="Invalid question number")
        
    idx = q_num - 1
    if not session.questions or idx >= len(session.questions) or idx < 0:
        raise HTTPException(status_code=400, detail="Invalid question index")
        
    q_data = session.questions[idx]
    
    evaluation = evaluate_answer(
        question=q_data.get("question", ""), 
        expected_points=q_data.get("expected_key_points", []), 
        candidate_answer=answer_text,
        job_title=session.job.title
    )
    
    ans_obj = {
        "question_number": q_num,
        "question": q_data.get("question", ""),
        "answer": answer_text,
        "evaluation": evaluation
    }
    
    current_answers = list(session.answers) if session.answers else []
    current_answers.append(ans_obj)
    session.answers = current_answers
    
    is_complete = False
    final_score = None
    next_question = None
    
    if q_num >= len(session.questions):
        total_score = sum(ans.get("evaluation", {}).get("score", 0) for ans in current_answers)
        final_score = total_score / len(session.questions)
        final_score = round(final_score * 10, 2)
        
        session.status = "COMPLETED"
        session.completed_at = datetime.utcnow()
        session.overall_score = final_score
        
        session.application.interview_score = final_score
        session.application.status = "AI_INTERVIEW_TAKEN"
        session.application.interview_transcript = current_answers
        is_complete = True
    else:
        session.current_question_number += 1
        session.status = "IN_PROGRESS"
        next_q_data = session.questions[session.current_question_number - 1]
        next_question = {
            "question_number": session.current_question_number,
            "question": next_q_data.get("question", "")
        }
        
    db.commit()
    
    return {
        "evaluation": evaluation,
        "is_complete": is_complete,
        "next_question": next_question,
        "overall_score": final_score
    }

@router.post("/interview/session/{token}/log-tab-switch")
def log_tab_switch(token: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid token")
        
    session.tab_switches = (session.tab_switches or 0) + 1
    db.commit()
    return {"status": "success", "tab_switches": session.tab_switches}

@router.get("/interview/sessions")
def list_all_interview_sessions(job_posting_id: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(require_hr_or_admin)):
    query = db.query(InterviewSession)
    if job_posting_id:
        query = query.filter(InterviewSession.job_posting_id == job_posting_id)
    if status:
        query = query.filter(InterviewSession.status == status)
        
    sessions = query.all()
    results = []
    for s in sessions:
        results.append({
            "id": s.id,
            "candidate_name": s.candidate_name,
            "job_title": s.job.title if s.job else "",
            "score": s.overall_score,
            "status": s.status,
            "tab_switches": s.tab_switches,
            "started_at": s.started_at,
            "completed_at": s.completed_at
        })
    return {"data": results}

@router.get("/interview/sessions/{id}/transcript")
def get_interview_transcript(id: str, db: Session = Depends(get_db), current_user = Depends(require_hr_or_admin)):
    session = db.query(InterviewSession).filter(InterviewSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "candidate_name": session.candidate_name,
        "job_title": session.job.title,
        "overall_score": session.overall_score,
        "answers": session.answers,
        "status": session.status
    }

# ──────────────────────────────────────────────────────────────
# ADVANCED RANKING & COMPARISON
# ──────────────────────────────────────────────────────────────
from fastapi.responses import Response
from pydantic import BaseModel
import csv
import io

@router.get("/candidates/ranked")
def get_ranked_candidates(
    job_posting_id: str,
    weights: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    apps = db.query(Application).filter(Application.job_posting_id == job_posting_id).all()
    
    parsed_weights = None
    if weights:
        try:
            parsed_weights = json.loads(weights)
        except:
            pass
            
    ranked = rank_candidates_advanced(apps, job.requirements or [], parsed_weights)
    return {"items": ranked, "total": len(ranked)}

class CompareRequest(BaseModel):
    application_id_a: str
    application_id_b: str
    job_posting_id: str

@router.post("/candidates/compare")
def compare_candidates(
    req: CompareRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    job = db.query(JobPosting).filter(JobPosting.id == req.job_posting_id).first()
    app_a = db.query(Application).filter(Application.id == req.application_id_a).first()
    app_b = db.query(Application).filter(Application.id == req.application_id_b).first()
    
    if not job or not app_a or not app_b:
        raise HTTPException(status_code=404, detail="Job or Candidate not found")
        
    # Helper to convert to dict safely
    def to_dict(obj):
        d = obj.__dict__.copy()
        if '_sa_instance_state' in d:
            del d['_sa_instance_state']
        return d
        
    result = compare_candidates_ai(to_dict(app_a), to_dict(app_b), job.title, job.requirements or [])
    return result

@router.get("/candidates/export")
def export_candidates(
    job_posting_id: str,
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    apps = db.query(Application).filter(Application.job_posting_id == job_posting_id).all()
    ranked = rank_candidates_advanced(apps, job.requirements or [])
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Name", "Email", "Composite Score", "Skills Score", "Experience Years", "Education Score", "Interview Score", "Recommendation"])
    
    for i, app in enumerate(ranked):
        writer.writerow([
            i + 1,
            app.get("candidate_name"),
            app.get("candidate_email"),
            app.get("composite_score"),
            app.get("ai_score"),
            app.get("experience_years"),
            app.get("education_score"),
            app.get("interview_score"),
            app.get("ai_recommendation")
        ])
        
    response = Response(content=output.getvalue())
    response.headers["Content-Disposition"] = f"attachment; filename=candidates_{job_posting_id}.csv"
    response.headers["Content-Type"] = "text/csv"
    return response

# ──────────────────────────────────────────────────────────────
# PUBLIC CAREERS PORTAL API
# ──────────────────────────────────────────────────────────────

@router.get("/public/jobs")
def get_public_jobs(department: Optional[str] = None, location: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(JobPosting).filter(JobPosting.status == "OPEN")
    if department:
        query = query.filter(JobPosting.department == department)
    if location:
        query = query.filter(JobPosting.location == location)
    
    jobs = query.all()
    result = []
    for job in jobs:
        result.append({
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "location": job.location,
            "employment_type": job.employment_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "posted_date": job.created_at,
            "public_application_url": job.public_application_url
        })
    return {"items": result, "total": len(result)}

@router.get("/public/jobs/{job_id}")
def get_public_job_details(job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id, JobPosting.status == "OPEN").first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "requirements": job.requirements,
        "location": job.location,
        "employment_type": job.employment_type,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "openings": job.openings,
        "posted_date": job.created_at,
        "public_application_url": job.public_application_url
    }

@router.post("/public/apply")
async def public_apply(
    background_tasks: BackgroundTasks,
    job_id: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    experience: str = Form(...),
    current_company: str = Form(None),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id, JobPosting.status == "OPEN").first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or closed")
        
    existing = db.query(Application).filter(
        Application.job_posting_id == job_id,
        Application.candidate_email == email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this role.")
        
    contents = await resume.read()
    
    from app.ai.resume_screener import screen_resume_against_job
    req_list = job.requirements if job.requirements else []
    desc_str = job.description or ""
    
    # Call Gemini to screen the resume immediately
    ai_res = screen_resume_against_job(
        pdf_bytes=contents,
        job_title=job.title,
        job_description=desc_str,
        job_requirements=req_list
    )
    
    app = Application(
        job_posting_id=job.id,
        candidate_name=full_name,
        candidate_email=email,
        candidate_phone=phone,
        resume_text=ai_res.get("raw_text", ""),
        ai_score=ai_res.get("score", 0),
        ai_summary=ai_res.get("summary", ""),
        ai_skills_match=ai_res.get("skills_match", []),
        ai_red_flags=ai_res.get("red_flags", []),
        ai_details=ai_res,
        ai_recommendation=ai_res.get("recommendation", "HOLD"),
        status="APPLIED"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    
    applied_count = db.query(func.count(Application.id)).filter(
        Application.job_posting_id == job_id,
        Application.status == "APPLIED"
    ).scalar()

    # Auto trigger pipeline every 10 applications
    if applied_count % 10 == 0:
        from app.services.auto_pipeline import run_auto_pipeline
        # Running synchronously or asynchronously? The instruction says trigger it, background_tasks is appropriate
        # but db sessions in background tasks with SQLAlchemy can be tricky. Let's create a new session or pass db.
        background_tasks.add_task(run_auto_pipeline, job_id, db)
    
    return {"status": "success", "application_id": app.id}


@router.post("/requests", response_model=JobRequestOut, status_code=status.HTTP_201_CREATED)
def create_job_request(
    data: JobRequestCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    req = JobRequest(
        title=data.title,
        department=data.department,
        domain=data.domain,
        headcount=data.headcount,
        requirements=data.requirements,
        requested_by_id=current_user.id
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.get("/requests", response_model=List[JobRequestOut])
def list_job_requests(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(JobRequest).order_by(JobRequest.created_at.desc())
    if current_user.role not in ("ADMIN", "HR_RECRUITER"):
        query = query.filter(JobRequest.requested_by_id == current_user.id)
    return query.all()

@router.patch("/requests/{request_id}/approve")
def approve_job_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    req = db.query(JobRequest).filter(JobRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Job request not found")
        
    req.status = "APPROVED"
    
    job = JobPosting(
        title=req.title,
        department=req.department,
        openings=req.headcount,
        description=f"Generated from requisition. Domain: {req.domain}",
        requirements=[req.requirements] if req.requirements else [],
        posted_by_id=current_user.id
    )
    db.add(job)
    db.commit()
    return {"status": "success", "job_id": job.id}

@router.patch("/requests/{request_id}/reject")
def reject_job_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_or_admin)
):
    req = db.query(JobRequest).filter(JobRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Job request not found")
        
    req.status = "REJECTED"
    db.commit()
    return {"status": "success"}
