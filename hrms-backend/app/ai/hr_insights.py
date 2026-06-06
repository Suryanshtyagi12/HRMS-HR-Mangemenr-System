from app.ai.gemini_client import generate_text

def performance_summary(employee_data: dict) -> str:
    prompt = f"""
    Write a professional performance summary for an employee:
    Name: {employee_data.get('name')}
    Department: {employee_data.get('department')}
    Self score: {employee_data.get('self_score')}/5
    Manager score: {employee_data.get('manager_score')}/5
    Goals achieved: {employee_data.get('goals_completed')}/{employee_data.get('goals_total')}
    
    Write 3-4 sentences highlighting strengths and areas for growth.
    """
    return generate_text(prompt)

def attrition_risk(employee_data: dict) -> float:
    prompt = f"""
    Assess the attrition risk (probability they will leave in next 6 months):
    Tenure: {employee_data.get('tenure_months')} months
    Performance score: {employee_data.get('performance_score')}/5
    Leave days used: {employee_data.get('leave_days_used')} of {employee_data.get('leave_quota')}
    Salary vs market: {employee_data.get('salary_competitiveness', 'unknown')}
    
    Return ONLY a decimal number between 0.0 (no risk) and 1.0 (certain to leave).
    """
    result = generate_text(prompt)
    try:
        return float(result.strip())
    except ValueError:
        return 0.5

def hr_chatbot(question: str, context: str = "") -> str:
    prompt = f"""
    You are a helpful HR assistant for HRMS Pro.
    Company context: {context[:1000] if context else 'Standard HRMS system'}
    
    Employee question: {question}
    
    Answer helpfully and professionally. If you don't know, say so.
    """
    return generate_text(prompt)
