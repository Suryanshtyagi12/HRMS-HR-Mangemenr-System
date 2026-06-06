from sqlalchemy import create_engine, text
from app.config import settings

def create_table():
    url = settings.DATABASE_URL.replace('postgresql+asyncpg', 'postgresql')
    engine = create_engine(url)
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                link VARCHAR,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
            );
        """))
        print("Successfully created notifications table.")

if __name__ == "__main__":
    create_table()
