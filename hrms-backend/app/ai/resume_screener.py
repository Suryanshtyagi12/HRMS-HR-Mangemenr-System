from app.ai.gemini_client import generate_json
from app.ai.utils.pdf_extractor import (
    extract_text_from_pdf, 
    extract_resume_sections
)
from app.ai.prompts.resume_prompts import (
    build_screening_prompt,
    build_extraction_prompt
)
import time

def extract_candidate_data(
    pdf_bytes: bytes
) -> dict:
    """
    Step 1: Extract ALL structured data from resume PDF.
    Name, email, phone, skills, experience, projects, education.
    """
    raw_text = extract_text_from_pdf(pdf_bytes)
    
    if not raw_text or len(raw_text) < 50:
        return {"error": "Could not extract text from PDF",
                "raw_text": ""}
    
    prompt = build_extraction_prompt(raw_text)
    extracted = generate_json(prompt)
    extracted["raw_text"] = raw_text
    return extracted

def screen_resume_against_job(
    pdf_bytes: bytes,
    job_title: str,
    job_description: str,
    job_requirements: list,
    job_id: str = None
) -> dict:
    """
    Full pipeline: Extract resume → Match against job → Score
    Returns complete screening result.
    """
    # Step 1: Extract candidate data
    candidate_data = extract_candidate_data(pdf_bytes)
    
    if "error" in candidate_data:
        return {
            "error": candidate_data["error"],
            "score": 0,
            "recommendation": "REJECT"
        }
    
    # Step 2: Score against job requirements
    prompt = build_screening_prompt(
        candidate_data=candidate_data,
        job_title=job_title,
        job_description=job_description,
        job_requirements=job_requirements
    )
    
    result = generate_json(prompt)
    
    # Step 3: Merge extracted data + screening result
    return {
        # Candidate info (extracted)
        "candidate_name": (
            result.get("candidate_name") or 
            candidate_data.get("name", "Unknown")
        ),
        "candidate_email": (
            result.get("candidate_email") or
            candidate_data.get("email", "")
        ),
        "candidate_phone": candidate_data.get("phone", ""),
        
        # Experience & Education
        "total_experience_years": (
            result.get("experience_years") or
            candidate_data.get("total_experience_years", 0)
        ),
        "current_company": candidate_data.get(
            "current_company", ""),
        "current_role": candidate_data.get(
            "current_role", ""),
        "education": candidate_data.get("education", []),
        "projects": candidate_data.get("projects", []),
        
        # AI Scoring
        "score": max(0, min(100, 
            result.get("score", 0))),
        "skills_match": result.get("skills_match", []),
        "missing_skills": result.get("missing_skills", []),
        "good_to_have_match": result.get(
            "good_to_have_match", []),
        "red_flags": result.get("red_flags", []),
        "strengths": result.get("strengths", []),
        "summary": result.get("summary", ""),
        "recommendation": result.get(
            "recommendation", "HOLD"),
        
        # Score breakdown
        "score_breakdown": {
            "skills_score": result.get("skills_score", 0),
            "experience_score": result.get(
                "experience_score", 0),
            "education_score": result.get(
                "education_score", 0),
            "overall_fit": result.get("overall_fit", 0)
        }
    }

def screen_multiple_resumes(
    files: list,  # list of (filename, bytes)
    job_title: str,
    job_description: str,
    job_requirements: list
) -> list:
    """
    Screen multiple resumes and return ranked results.
    """
    results = []
    
    for i, (filename, file_bytes) in enumerate(files):
        print(f"Screening resume {i+1}/{len(files)}: {filename}")
        try:
            result = screen_resume_against_job(
                pdf_bytes=file_bytes,
                job_title=job_title,
                job_description=job_description,
                job_requirements=job_requirements
            )
            result["filename"] = filename
            result["rank"] = 0  # will be set after sorting
            results.append(result)
        except Exception as e:
            print(f"Error screening {filename}: {e}")
            results.append({
                "filename": filename,
                "error": str(e),
                "score": 0,
                "recommendation": "HOLD",
                "candidate_name": filename.replace(".pdf","")
            })
        
        # Delay between Gemini calls to avoid rate limit
        if i < len(files) - 1:
            time.sleep(1.5)
    
    # Sort by score descending + add rank
    results.sort(key=lambda x: x.get("score", 0), 
        reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1
    
    return results
