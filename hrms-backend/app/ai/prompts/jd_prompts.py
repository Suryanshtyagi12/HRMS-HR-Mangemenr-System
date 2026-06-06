def build_jd_generation_prompt(
    title, department, experience_level,
    employment_type, location, user_requirements
) -> str:
    return f"""
You are an expert HR recruiter writing a job description.

Job Details:
- Title: {title}
- Department: {department}
- Experience Level: {experience_level}
- Employment Type: {employment_type}
- Location: {location}
- Additional Requirements from HR: {user_requirements or 'None'}

Generate a complete, professional job description.
Return ONLY valid JSON, no markdown, no explanation:

{{
  "overview": "2-3 sentence company and role overview",
  "responsibilities": [
    "responsibility 1",
    "responsibility 2",
    "at least 6-8 responsibilities"
  ],
  "required_skills": [
    "skill 1",
    "skill 2", 
    "at least 5-7 required skills specific to {title}"
  ],
  "good_to_have": [
    "nice to have skill 1",
    "nice to have skill 2",
    "3-5 good to have skills"
  ],
  "qualifications": [
    "qualification 1",
    "at least 3 qualifications"
  ],
  "benefits": [
    "benefit 1",
    "at least 4 benefits"
  ],
  "experience_years": "{experience_level}"
}}

Make it specific to {title} role in {department} department.
Do NOT use generic placeholders. Write real content.
"""

def build_requirements_prompt(
    title, department, experience_level
) -> str:
    return f"""
You are an expert HR recruiter.

Generate requirements and skills for:
- Job Title: {title}
- Department: {department}  
- Experience: {experience_level}

Return ONLY valid JSON, no markdown:
{{
  "requirements": [
    "specific requirement 1",
    "specific requirement 2",
    "6-8 requirements"
  ],
  "required_skills": [
    "specific skill 1",
    "5-7 required skills"
  ],
  "good_to_have": [
    "nice to have 1",
    "3-5 items"
  ]
}}

Be specific to {title}. No generic placeholders.
"""
