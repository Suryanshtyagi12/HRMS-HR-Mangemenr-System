def build_extraction_prompt(resume_text: str) -> str:
    return f"""
You are an expert resume parser.
Extract ALL information from this resume text.

Resume:
{resume_text[:4000]}

Return ONLY valid JSON, no markdown, no explanation:
{{
  "name": "full name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "location": "city, country or empty string",
  "current_role": "current job title",
  "current_company": "current employer",
  "total_experience_years": 0,
  "summary": "professional summary if present",
  "skills": ["skill1", "skill2"],
  "education": [
    {{
      "degree": "degree name",
      "institution": "university name",
      "year": "graduation year"
    }}
  ],
  "experience": [
    {{
      "role": "job title",
      "company": "company name",
      "duration": "time period",
      "description": "brief description"
    }}
  ],
  "projects": [
    {{
      "name": "project name",
      "description": "what it does",
      "technologies": ["tech1", "tech2"]
    }}
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["language1"]
}}

Extract everything present. Use empty string or 
empty array if not found. Never use null.
"""

def build_screening_prompt(
    candidate_data: dict,
    job_title: str,
    job_description: str,
    job_requirements: list
) -> str:
    requirements_text = "\\n".join(
        [f"- {r}" for r in job_requirements])
    
    return f"""
You are a senior HR recruiter evaluating a candidate.

JOB DETAILS:
Title: {job_title}
Description: {job_description[:1000]}
Requirements:
{requirements_text}

CANDIDATE PROFILE:
Name: {candidate_data.get('name', 'Unknown')}
Current Role: {candidate_data.get('current_role', 'N/A')}
Experience: {candidate_data.get('total_experience_years', 0)} years
Skills: {', '.join(candidate_data.get('skills', []))}
Education: {candidate_data.get('education', [])}
Projects: {len(candidate_data.get('projects', []))} projects

Full Resume Text:
{candidate_data.get('raw_text', '')[:2000]}

Evaluate this candidate for the {job_title} role.
Return ONLY valid JSON, no markdown:

{{
  "candidate_name": "extracted full name",
  "candidate_email": "extracted email",
  "score": 0-100,
  "experience_years": number,
  "skills_score": 0-100,
  "experience_score": 0-100,
  "education_score": 0-100,
  "overall_fit": 0-100,
  "skills_match": ["skills they have that match job"],
  "missing_skills": ["required skills they lack"],
  "good_to_have_match": ["nice-to-have they have"],
  "strengths": ["3-4 key strengths for this role"],
  "red_flags": ["concerns if any, empty array if none"],
  "summary": "3-4 sentence evaluation of this candidate 
    for the {job_title} role",
  "recommendation": "SHORTLIST or HOLD or REJECT"
}}

Scoring guide:
- 80-100: Excellent match, strong SHORTLIST
- 60-79: Good match, SHORTLIST or HOLD
- 40-59: Partial match, HOLD
- 0-39: Poor match, REJECT

Be specific and accurate. Base score on actual 
skills match and experience relevance.
"""
