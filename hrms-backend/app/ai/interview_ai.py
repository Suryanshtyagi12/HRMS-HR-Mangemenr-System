from app.ai.gemini_client import generate_json

def generate_interview_questions(
    job_title: str,
    job_description: str,
    job_requirements: list,
    resume_text: str,
    candidate_name: str,
    num_questions: int = 5
) -> list:
    """
    Generate questions personalized to:
    1. The specific job requirements
    2. The candidate's own resume/background
    Mix of technical + behavioral questions
    """
    prompt = f"""
You are conducting a job interview.

Job: {job_title}
Requirements: {', '.join(job_requirements[:5])}
Job Description: {job_description[:500]}

Candidate: {candidate_name}
Their Resume: {resume_text[:1500]}

Generate exactly {num_questions} interview questions.
Mix: 3 technical + 2 behavioral questions.
Make questions SPECIFIC to this candidate's background.
Reference their actual projects/experience when relevant.

Return JSON array only:
[
  {{
    "question_number": 1,
    "question": "specific question text",
    "type": "TECHNICAL or BEHAVIORAL",
    "expected_key_points": [
      "point 1", "point 2", "point 3"
    ],
    "difficulty": "EASY or MEDIUM or HARD",
    "why_asked": "brief reason (not shown to candidate)"
  }}
]
"""
    result = generate_json(prompt)
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        return result.get("questions", [])
    return []

def evaluate_answer(
    question: str,
    expected_points: list,
    candidate_answer: str,
    job_title: str
) -> dict:
    prompt = f"""
Evaluate this interview answer.

Job: {job_title}
Question: {question}
Expected key points: {expected_points}
Candidate answer: {candidate_answer}

Return JSON only:
{{
  "score": 0,
  "feedback": "brief constructive feedback",
  "key_points_covered": ["point covered"],
  "key_points_missed": ["point missed"],
  "answer_quality": "EXCELLENT/GOOD/FAIR/POOR"
}}

Be fair and objective.
Score 8-10: covered most points well
Score 5-7: covered some points
Score 0-4: missed most points or irrelevant
"""
    return generate_json(prompt)
