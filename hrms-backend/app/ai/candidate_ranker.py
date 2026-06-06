from app.ai.gemini_client import generate_json

def rank_candidates_advanced(
    applications: list,
    job_requirements: list,
    weights: dict = None
) -> list:
    """
    Multi-factor scoring with configurable weights.
    Default weights:
    - skills_match: 40%
    - experience: 30%  
    - education: 15%
    - interview_score: 15% (if available)
    """
    default_weights = {
        "skills_match": 0.40,
        "experience": 0.30,
        "education": 0.15,
        "interview_score": 0.15
    }
    w = weights or default_weights
    
    result = []
    for app in applications:
        # We need to treat app as a dictionary to modify it safely
        app_dict = app.__dict__.copy() if hasattr(app, '__dict__') else app.copy()
        
        # Remove SQLAlchemy internal state if present
        if "_sa_instance_state" in app_dict:
            del app_dict["_sa_instance_state"]
            
        ai_details = app_dict.get("ai_details") or {}
        
        # Extract fields, falling back to ai_details if not top-level
        ai_score = app_dict.get("ai_score") or 0
        experience_years = app_dict.get("experience_years") or ai_details.get("experience_years", 0)
        education_score = app_dict.get("education_score") or ai_details.get("education_score", 70)
        interview_score = app_dict.get("interview_score") or 0
        
        # Weighted composite score
        composite = (
            (ai_score * w["skills_match"]) +
            (min(experience_years / 10 * 100, 100) * w["experience"]) +
            (education_score * w["education"]) +
            (interview_score * w["interview_score"])
        )
        
        app_dict["composite_score"] = round(composite, 1)
        # Ensure experience and education are easily accessible for the frontend
        app_dict["experience_years"] = experience_years
        app_dict["education_score"] = education_score
        
        result.append(app_dict)
    
    return sorted(result, key=lambda x: x["composite_score"], reverse=True)

def compare_candidates_ai(
    candidate_a: dict,
    candidate_b: dict,
    job_title: str,
    job_requirements: list
) -> dict:
    """Use Gemini to compare two candidates"""
    
    # Extract data safely, falling back to ai_details
    a_ai_details = candidate_a.get("ai_details") or {}
    b_ai_details = candidate_b.get("ai_details") or {}
    
    a_exp = candidate_a.get("experience_years") or a_ai_details.get("experience_years", 0)
    b_exp = candidate_b.get("experience_years") or b_ai_details.get("experience_years", 0)
    
    prompt = f"""
Compare these two candidates for {job_title}.

Candidate A: {candidate_a.get('candidate_name')}
Skills: {candidate_a.get('ai_skills_match', [])}
Experience: {a_exp} years
Score: {candidate_a.get('ai_score', 0)}

Candidate B: {candidate_b.get('candidate_name')}
Skills: {candidate_b.get('ai_skills_match', [])}
Experience: {b_exp} years
Score: {candidate_b.get('ai_score', 0)}

Job Requirements: {job_requirements}

Return JSON only:
{{
  "winner": "A or B or TIE",
  "winner_name": "name of winner",
  "reasoning": "2-3 sentences why",
  "a_strengths": ["strength 1", "strength 2"],
  "b_strengths": ["strength 1", "strength 2"],
  "recommendation": "hire A/B because..."
}}
"""
    return generate_json(prompt)
