from sqlalchemy.orm import Session
from app.models.notification import Notification
import uuid
from datetime import datetime

def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notif_type: str,
    link: str = None
):
    """
    Save notification to DB.
    Supabase Realtime automatically broadcasts 
    INSERT events to subscribed frontend clients.
    No extra code needed — DB insert = realtime push.
    """
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        link=link,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def notify_role(db: Session, role: str, title: str, 
                message: str, notif_type: str, 
                link: str = None):
    """Send notification to all users with a role"""
    from app.models.user import User
    users = db.query(User).filter(
        User.role == role,
        User.is_active == True
    ).all()
    for user in users:
        create_notification(
            db, user.id, title, 
            message, notif_type, link)
