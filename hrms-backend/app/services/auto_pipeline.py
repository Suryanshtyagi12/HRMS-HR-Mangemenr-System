from sqlalchemy.orm import Session
from app.models.recruitment import Application, JobPosting
from app.ai.resume_screener import screen_resume_against_job
from app.ai.utils.pdf_extractor import extract_text_from_pdf
import numpy as np
import time

def run_auto_pipeline(
    job_posting_id: str, 
    db: Session
):
    """
    Full auto pipeline:
    1. Fetch all APPLIED applications for job
    2. Screen each resume with AI
    3. Rank by score
    4. Auto shortlist using percentile system
    """
    
    # Step 1: Get job details
    job = db.query(JobPosting).filter(
        JobPosting.id == job_posting_id
    ).first()
    if not job:
        return {"error": "Job not found"}
    
    # Step 2: Get all applications in APPLIED status
    applications = db.query(Application).filter(
        Application.job_posting_id == job_posting_id,
        Application.status == "APPLIED"
    ).all()
    
    if not applications:
        return {
            "message": "No applications to process",
            "processed": 0
        }
    
    # Step 3: Screen each resume with AI
    scored = []
    for app in applications:
        try:
            # Get resume text (already extracted 
            # when candidate applied)
            resume_text = app.resume_text or ""
            
            if not resume_text and app.resume_url:
                # Try to extract if not done yet
                resume_text = ""
            
            if not resume_text:
                # No resume text — give low score
                app.ai_score = 10
                app.status = "SCREENING"
                scored.append({
                    "app": app, "score": 10})
                continue
            
            # Call Gemini to score resume
            from app.ai.gemini_client import generate_json
            from app.ai.prompts.resume_prompts import build_screening_prompt
            
            requirements = job.requirements \
                if isinstance(job.requirements, list) \
                else []
            
            result = generate_json(
                build_screening_prompt(
                    candidate_data={
                        "raw_text": resume_text,
                        "name": app.candidate_name,
                        "skills": [],
                        "total_experience_years": 0
                    },
                    job_title=job.title,
                    job_description=job.description or "",
                    job_requirements=requirements
                )
            )
            
            score = result.get("score", 0)
            
            # Update application with AI results
            app.ai_score = score
            app.ai_summary = result.get("summary","")
            app.ai_skills_match = result.get("skills_match", [])
            app.ai_red_flags = result.get("red_flags", [])
            app.ai_recommendation = result.get("recommendation", "HOLD")
            app.status = "SCREENING"
            
            scored.append({"app": app, "score": score})
            db.commit()
            
            # Avoid Gemini rate limit
            time.sleep(1)
            
        except Exception as e:
            print(f"Error screening {app.id}: {e}")
            app.ai_score = 0
            app.status = "SCREENING"
            scored.append({"app": app, "score": 0})
            db.commit()
    
    # Step 4: Rank by score
    scored.sort(key=lambda x: x["score"], reverse=True)
    
    # Step 5: Auto shortlist using percentile system
    scores = [s["score"] for s in scored]
    openings = job.openings or 1
    total_apps = len(scored)
    
    # Always shortlist MORE than openings
    # Minimum: openings * 2 candidates
    # Maximum: all candidates above threshold
    
    # Calculate dynamic threshold using percentile
    # More applications vs openings = higher bar
    ratio = total_apps / openings
    
    if ratio <= 2:
        # Few applicants — take all above 40
        threshold = 40
    elif ratio <= 5:
        # Moderate — take top 60th percentile
        threshold = float(np.percentile(scores, 40))
    elif ratio <= 10:
        # Many — take top 40th percentile  
        threshold = float(np.percentile(scores, 60))
    else:
        # Too many — take top 25th percentile
        threshold = float(np.percentile(scores, 75))
    
    # Minimum score always 30 regardless
    threshold = max(threshold, 30)
    
    # Shortlist target: openings * 2.5 
    # (always more than openings)
    shortlist_target = max(
        int(openings * 2.5),
        openings + 2
    )
    
    shortlisted = 0
    rejected = 0
    
    for item in scored:
        app = item["app"]
        score = item["score"]
        
        if score >= threshold and shortlisted < shortlist_target:
            app.status = "SHORTLISTED"
            shortlisted += 1
        elif score < 30:
            # Hard reject below 30
            app.status = "REJECTED"
            rejected += 1
        else:
            # Keep in SCREENING for HR review
            app.status = "SCREENING"
        
        db.commit()
    
    # Create notifications for HR
    from app.services.notification_service import create_notification
    from app.models.user import User
    
    hr_users = db.query(User).filter(
        User.role == "HR_RECRUITER"
    ).all()
    
    for hr in hr_users:
        create_notification(
            db=db,
            user_id=hr.id,
            title="Auto Screening Complete",
            message=f"{job.title}: {total_apps} resumes screened. {shortlisted} shortlisted, {rejected} rejected automatically.",
            notif_type="RECRUITMENT",
            link=f"/hr/recruitment/pipeline?job={job_posting_id}"
        )
    
    return {
        "job_title": job.title,
        "total_processed": total_apps,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "screening": total_apps - shortlisted - rejected,
        "threshold_score": round(threshold, 1),
        "openings": openings,
        "shortlist_ratio": f"{shortlisted}:{openings} (candidates per opening)"
    }
