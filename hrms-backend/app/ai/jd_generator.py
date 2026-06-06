from app.ai.gemini_client import generate_json
from app.ai.prompts.jd_prompts import (
    build_jd_generation_prompt,
    build_requirements_prompt
)

def generate_full_jd(
    title: str,
    department: str, 
    experience_level: str,
    employment_type: str,
    location: str,
    user_requirements: str = ""
) -> dict:
    """
    Generate complete job description with all sections.
    Returns structured JD that frontend can render.
    """
    prompt = build_jd_generation_prompt(
        title, department, experience_level,
        employment_type, location, user_requirements
    )
    
    result = generate_json(prompt)
    
    # Safe fallback if AI returns incomplete data
    return {
        "overview": result.get("overview", 
            f"We are looking for a {title} to join our {department} team."),
        "responsibilities": result.get("responsibilities", []),
        "required_skills": result.get("required_skills", []),
        "good_to_have": result.get("good_to_have", []),
        "qualifications": result.get("qualifications", []),
        "benefits": result.get("benefits", []),
        "experience_years": result.get("experience_years", 
            experience_level)
    }

def generate_requirements_only(
    title: str, 
    department: str,
    experience_level: str
) -> dict:
    """
    Generate ONLY requirements, skills, good-to-have.
    Called when HR clicks individual generate buttons.
    """
    prompt = build_requirements_prompt(
        title, department, experience_level)
    result = generate_json(prompt)
    
    return {
        "requirements": result.get("requirements", []),
        "required_skills": result.get("required_skills", []),
        "good_to_have": result.get("good_to_have", [])
    }
