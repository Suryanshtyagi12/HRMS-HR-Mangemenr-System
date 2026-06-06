import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class JobRequest(Base):
    __tablename__ = "job_requests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    headcount = Column(Integer, default=1)
    requirements = Column(Text, nullable=True)
    status = Column(Enum("PENDING", "APPROVED", "REJECTED", name="job_request_status"), default="PENDING")
    requested_by_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    requested_by = relationship("User")


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    requirements = Column(JSON, nullable=True)  # JSON array
    location = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    openings = Column(Integer, default=1)
    status = Column(
        Enum("OPEN", "CLOSED", "ON_HOLD", "FILLED", name="job_posting_status"),
        default="OPEN",
    )
    posted_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    ai_generated_jd = Column(Boolean, default=False)
    public_application_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    posted_by = relationship("User")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_posting_id = Column(String, ForeignKey("job_postings.id"), nullable=False, index=True)

    candidate_name = Column(String, nullable=False)
    candidate_email = Column(String, nullable=False)
    candidate_phone = Column(String, nullable=True)
    resume_url = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)

    ai_score = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_skills_match = Column(JSON, nullable=True)
    ai_red_flags = Column(JSON, nullable=True)
    ai_details = Column(JSON, nullable=True)
    ai_recommendation = Column(
        Enum("SHORTLIST", "HOLD", "REJECT", name="ai_recommendation_enum"),
        nullable=True,
    )
    status = Column(
        Enum(
            "APPLIED", "SCREENING", "SHORTLISTED", "AI_INTERVIEW_TAKEN", "INTERVIEW_SCHEDULED",
            "INTERVIEWED", "OFFERED", "HIRED", "REJECTED",
            name="application_status",
        ),
        default="APPLIED",
    )
    interview_transcript = Column(JSON, nullable=True)
    interview_score = Column(Float, nullable=True)
    offer_letter_url = Column(String, nullable=True)
    main_interview_details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobPosting", back_populates="applications")
    interview_sessions = relationship("InterviewSession", back_populates="application")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String, ForeignKey("applications.id"), nullable=False, index=True)
    job_posting_id = Column(String, ForeignKey("job_postings.id"), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    candidate_name = Column(String, nullable=True)
    candidate_email = Column(String, nullable=True)
    status = Column(
        Enum("PENDING", "IN_PROGRESS", "COMPLETED", "EXPIRED", name="interview_status"),
        default="PENDING",
    )
    questions = Column(JSON, nullable=True)
    answers = Column(JSON, default=list)
    overall_score = Column(Float, nullable=True)
    tab_switches = Column(Integer, default=0)
    current_question_number = Column(Integer, default=1)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="interview_sessions")
    job = relationship("JobPosting")
