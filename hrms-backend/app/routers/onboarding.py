from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_hr_or_admin

router = APIRouter()

@router.get("")
def get_onboarding_dashboard(db: Session = Depends(get_db), current_user = Depends(require_hr_or_admin)):
    # Simple placeholder endpoint to prevent 404s and feed the UI.
    # In a full implementation, this would read from an Onboarding Checklist model.
    return {
        "status": "success",
        "data": [
            {
                "id": "1",
                "firstName": "John",
                "lastName": "Doe",
                "designation": "Software Engineer",
                "department": "Engineering",
                "photoUrl": "",
                "joiningDate": "2026-06-01T00:00:00Z",
                "status": "IN_PROGRESS",
                "progress": 50,
                "completedTasks": 5,
                "totalTasks": 10,
                "hasOverdue": False
            }
        ]
    }
