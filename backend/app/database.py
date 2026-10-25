from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

def get_normalized_database_url(url: str) -> str:
    """
    Normalizes database URLs to ensure compatibility with SQLAlchemy 1.4+.
    Rewrites legacy 'postgres://' (common on Render and Supabase) to 'postgresql://'.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

db_url = get_normalized_database_url(settings.DATABASE_URL)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine with normalized URL and driver-specific connect_args
engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

