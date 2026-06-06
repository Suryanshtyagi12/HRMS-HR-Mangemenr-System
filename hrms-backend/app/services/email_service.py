"""email_service.py — SMTP email via Gmail for payslips + notifications."""
import logging

logger = logging.getLogger(__name__)

def send_email(to: str, subject: str, body: str) -> bool:
    # Skip for hackathon — just log it
    print(f"EMAIL TO {to}: {subject}")
    logger.info(f"EMAIL TO {to}: {subject}")
    return True
