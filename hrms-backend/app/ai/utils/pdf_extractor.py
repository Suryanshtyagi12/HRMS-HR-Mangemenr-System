import PyPDF2
import io
import re
from typing import Optional

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text from PDF bytes.
    Tries multiple methods for best extraction.
    """
    text = ""
    
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print(f"PyPDF2 extraction error: {e}")
        return ""
    
    return clean_extracted_text(text)

def clean_extracted_text(text: str) -> str:
    """Clean and normalize extracted PDF text"""
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    # Remove special characters that confuse AI
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    # Remove very short lines (page numbers, headers)
    lines = text.split('\n')
    lines = [l.strip() for l in lines if len(l.strip()) > 2]
    return '\n'.join(lines)

def extract_resume_sections(text: str) -> dict:
    """
    Pre-parse resume into sections before sending to AI.
    Helps AI understand structure better.
    """
    sections = {
        "full_text": text,
        "estimated_length": len(text),
        "has_email": bool(re.search(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 
            text)),
        "has_phone": bool(re.search(
            r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}', 
            text)),
        "word_count": len(text.split())
    }
    return sections
