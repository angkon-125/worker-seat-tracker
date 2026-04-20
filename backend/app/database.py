from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# MS SQL Server Connection Details
DB_SERVER = os.getenv("DB_SERVER", "DESKTOP-GP2116L")
DB_NAME = os.getenv("DB_NAME", "WorkerSeatTracker")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Connection string for SQL Server Authentication
# Using sa login as specified by user
SQLALCHEMY_DATABASE_URL = (
    f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{DB_NAME}"
    f"?driver={DB_DRIVER}"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    # SQL Server doesn't need check_same_thread=False like SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
