import json
import logging
from app.ai.gemini_client import generate_json

logger = logging.getLogger(__name__)

def generate_report_summary(report_type: str, month: int, year: int, summary_stats: dict) -> dict:
    """
    Calls Gemini to generate a structured JSON summary based on the aggregated summary_stats.
    """
    
    prompt = f"""
    You are an expert HR Data Analyst. Analyze the following aggregated data for a {report_type} report for {month}/{year}.
    
    Data:
    {json.dumps(summary_stats, indent=2)}
    
    Provide an insightful analysis in the exact JSON format below. Do not include markdown code blocks, just raw JSON.
    {{
      "executive_summary": "A 2-3 sentence high-level summary of what the data shows",
      "highlights": ["highlight 1", "highlight 2"],
      "concerns": ["concern 1", "concern 2"],
      "recommendations": ["recommendation 1", "recommendation 2"],
      "overall_health": "One of: EXCELLENT, GOOD, AVERAGE, NEEDS_ATTENTION"
    }}
    """
    
    try:
        result = generate_json(prompt)
        if not result or 'executive_summary' not in result:
            raise ValueError("Invalid JSON structure returned by AI.")
        return result
    except Exception as e:
        logger.error(f"AI Summarizer failed: {e}")
        return {
            "executive_summary": "AI summary could not be generated due to an error.",
            "highlights": [],
            "concerns": [],
            "recommendations": ["Review the raw data manually."],
            "overall_health": "AVERAGE"
        }
