import google.generativeai as genai
import json
import time
import re
from app.config import settings

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-2.5-pro"

def verify_models():
    """Run this on app startup to confirm models work"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content("Say OK")
        print(f"[OK] Gemini Flash working: {response.text[:20]}")
    except Exception as e:
        print(f"[FAIL] Gemini Flash failed: {e}")
    try:
        model = genai.GenerativeModel("gemini-2.5-pro")
        response = model.generate_content("Say OK")
        print(f"[OK] Gemini Pro working: {response.text[:20]}")
    except Exception as e:
        print(f"[FAIL] Gemini Pro failed: {e}")

def parse_json_safely(text: str) -> dict:
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    try:
        return json.loads(text)
    except:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass
        return {}

def generate_text(prompt: str) -> str:
    """
    3-tier fallback:
    gemini-flash → gemini-pro → groq-llama3
    """
    errors = []
    
    # Tier 1: Gemini Flash
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt, request_options={"timeout": 3})
        print("✓ Used: gemini-2.5-flash")
        return response.text
    except Exception as e:
        errors.append(f"Flash: {e}")
        print(f"✗ Gemini Flash failed: {e}")
        time.sleep(1)
    
    # Tier 2: Gemini Pro
    try:
        model = genai.GenerativeModel("gemini-2.5-pro")
        response = model.generate_content(prompt, request_options={"timeout": 3})
        print("✓ Used: gemini-2.5-pro")
        return response.text
    except Exception as e:
        errors.append(f"Pro: {e}")
        print(f"[FAIL] Gemini Pro failed: {e}")
        time.sleep(1)
    
    # Tier 3: Groq fallback
    try:
        from app.ai.groq_client import groq_generate_text
        result = groq_generate_text(prompt)
        print("✓ Used: groq-llama3 (fallback)")
        return result
    except Exception as e:
        errors.append(f"Groq: {e}")
        print(f"✗ Groq failed: {e}")
    
    raise Exception(
        f"All AI providers failed: {'; '.join(errors)}")

def generate_json(prompt: str) -> dict:
    """
    3-tier fallback for JSON responses.
    """
    errors = []
    
    # Tier 1: Gemini Flash
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt, request_options={"timeout": 3})
        return parse_json_safely(response.text)
    except Exception as e:
        errors.append(f"Flash: {e}")
        time.sleep(1)
    
    # Tier 2: Gemini Pro
    try:
        model = genai.GenerativeModel("gemini-2.5-pro")
        response = model.generate_content(prompt, request_options={"timeout": 3})
        return parse_json_safely(response.text)
    except Exception as e:
        errors.append(f"Pro: {e}")
        time.sleep(1)
    
    # Tier 3: Groq
    try:
        from app.ai.groq_client import groq_generate_json
        result = groq_generate_json(prompt)
        print("✓ Used: groq-llama3 (fallback)")
        return result
    except Exception as e:
        errors.append(f"Groq: {e}")
    
    print(f"All providers failed: {errors}")
    return {}  # Safe empty fallback
