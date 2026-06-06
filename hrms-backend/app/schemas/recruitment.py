from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr


class JDGenerateRequest(BaseModel):
    title: str
    department: str
    experience_level: str
    employment_type: str = "FULL_TIME"
    location: str = "Remote"
    requirements: Optional[str] = ""

class JDRequirementsRequest(BaseModel):
    title: str
    department: str
    experience_level: str

class MainInterviewScheduleRequest(BaseModel):
    date_time: str
    topic: str
    google_meet_link: str
    notes: Optional[str] = ""

class StatusUpdateRequest(BaseModel):
    status: str

class JobRequestCreate(BaseModel):
    title: str
    department: str
    domain: str
    headcount: int
    requirements: Optional[str] = ""

class JobRequestOut(BaseModel):
    id: str
    title: str
    department: str
    domain: str
    headcount: int
    requirements: Optional[str] = None
    status: str
    requested_by_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class JobPostingCreate(BaseModel):
    title: str
    department: str
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    location: Optional[str] = None
    employment_type: str = "FULL_TIME"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    openings: int = 1
    experience_level: Optional[str] = None


class JobPostingOut(BaseModel):
    id: str
    title: str
    department: str
    description: Optional[str]
    requirements: Optional[List[str]]
    location: Optional[str]
    employment_type: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    openings: int
    status: str
    created_at: datetime
    application_count: Optional[int] = 0

    class Config:
        from_attributes = True


class ApplicationOut(BaseModel):
    id: str
    job_posting_id: str
    candidate_name: str
    candidate_email: str
    candidate_phone: Optional[str]
    ai_score: Optional[float]
    ai_summary: Optional[str]
    ai_skills_match: Optional[List[str]]
    ai_red_flags: Optional[List[str]]
    ai_recommendation: Optional[str]
    status: str
    interview_score: Optional[float]
    interview_transcript: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewSessionCreate(BaseModel):
    job_posting_id: str
    application_id: str


class InterviewAnswerSubmit(BaseModel):
    question_number: int
    answer_text: str


class InterviewSessionOut(BaseModel):
    token: str
    job_title: str
    candidate_name: str
    status: str
    current_question_number: int
    questions_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True
