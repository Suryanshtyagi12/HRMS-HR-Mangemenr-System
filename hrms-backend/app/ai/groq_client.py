from groq import Groq
from app.config import settings
import json
import re

def get_groq_client():
    if not settings.GROQ_API_KEY:
        raise Exception("GROQ_API_KEY not set")
    return Groq(api_key=settings.GROQ_API_KEY)

# Groq uses llama3 which is fast and free
GROQ_MODEL = "llama-3.3-70b-versatile"

def groq_generate_text(prompt: str) -> str:
    client = get_groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4096
    )
    return response.choices[0].message.content

def groq_generate_json(prompt: str) -> dict:
    # Tell Groq explicitly to return JSON
    json_prompt = prompt + """
    
IMPORTANT: Return ONLY valid JSON.
No markdown code blocks. No explanation. 
Just the raw JSON object.
"""
    raw = groq_generate_text(json_prompt)
    # Clean and parse
    raw = re.sub(r'```json\s*', '', raw)
    raw = re.sub(r'```\s*', '', raw)
    raw = raw.strip()
    try:
        return json.loads(raw)
    except:
        # Try to find JSON in response
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass
        return {}
