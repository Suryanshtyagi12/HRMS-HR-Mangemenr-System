import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.database import Base

class DocumentVault(Base):
    __tablename__ = "document_vault"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("employees.id"))
    document_type = Column(String)  
    # RESUME, OFFER_LETTER, CONTRACT, ID_PROOF,
    # CERTIFICATE, PAYSLIP, APPRAISAL, OTHER
    file_name = Column(String)
    file_url = Column(String)  # Supabase Storage URL
    file_size = Column(Integer)
    uploaded_by = Column(String, ForeignKey("users.id"))
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
