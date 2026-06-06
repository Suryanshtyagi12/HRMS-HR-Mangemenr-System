from app.ai.gemini_client import generate_json
from app.ai.company_analyzer import collect_company_data
from sqlalchemy.orm import Session
import json

def generate_company_report(db: Session) -> dict:
    """
    Collect real data → Send to Gemini →
    Return structured report for frontend
    """
    # Step 1: Get real data from DB
    company_data = collect_company_data(db)
    
    # Step 2: Build Gemini prompt with real numbers
    prompt = f"""
You are a senior HR analyst generating a weekly 
company HR report.

Here is the REAL company data for analysis:
{json.dumps(company_data, indent=2)}

Based on this ACTUAL data generate a comprehensive
HR report. Use the real numbers in your analysis.
Do not make up data — reference specific numbers
from the data provided.

Return ONLY valid JSON, no markdown:
{{
  "executive_summary": "3-4 paragraph summary using real numbers from the data. Mention specific departments, counts, percentages. Make it sound like a real HR report written by a senior analyst.",
  
  "highlights": [
    {{
      "title": "short highlight title",
      "detail": "specific detail with real numbers",
      "metric": "the key number e.g. 94%",
      "type": "POSITIVE"
    }}
  ],
  
  "concerns": [
    {{
      "title": "short concern title",
      "detail": "specific concern with real numbers",
      "metric": "the key number",
      "severity": "HIGH or MEDIUM or LOW",
      "type": "CONCERN"
    }}
  ],
  
  "recommendations": [
    {{
      "title": "action title",
      "detail": "specific actionable recommendation",
      "priority": "HIGH or MEDIUM or LOW",
      "department": "which dept or ALL",
      "type": "ACTION"
    }}
  ],
  
  "department_health": [
    {{
      "department": "dept name",
      "health_score": 0-100,
      "status": "HEALTHY or AT_RISK or CRITICAL",
      "key_issue": "main issue or null if healthy"
    }}
  ],
  
  "key_metrics": {{
    "attendance_rate": "{company_data['attendance']['rate_this_month']}%",
    "payroll_change": "{company_data['payroll']['change_percent']}%",
    "open_positions": {company_data['recruitment']['open_positions']},
    "high_risk_employees": {company_data['attrition_risk']['high_risk_count']},
    "goals_completion": "{company_data['performance']['goals_completion_rate']}%",
    "new_hires": {company_data['headcount']['new_hires_this_month']}
  }}
}}

Rules:
- Use REAL numbers from the data provided
- Be specific, not generic
- If attendance is 94% say "94% attendance rate"
- Reference actual department names
- If no concerns exist say so honestly
- Make recommendations actionable and specific
"""
    
    result = generate_json(prompt)
    
    # Add raw company data for frontend charts
    result["raw_data"] = company_data
    result["generated_at"] = company_data["report_date"]
    
    return result
