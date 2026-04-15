from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import Camera, Seat, Worker
from app.core.config import settings

def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Camera).first():
            print("Database already contains data.")
            return

        # 1. Create Camera
        camera = Camera(
            name="Office Main Cam",
            rtsp_url="rtsp://localhost:8554/live",
            location="Floor 2, Zone B",
            status="active"
        )
        db.add(camera)
        db.flush()

        # 2. Create Seats
        seats = [
            Seat(seat_code="B01", camera_id=camera.id, zone_x=0.1, zone_y=0.1, zone_width=0.2, zone_height=0.2),
            Seat(seat_code="B02", camera_id=camera.id, zone_x=0.4, zone_y=0.1, zone_width=0.2, zone_height=0.2),
            Seat(seat_code="B03", camera_id=camera.id, zone_x=0.7, zone_y=0.1, zone_width=0.2, zone_height=0.2),
        ]
        db.add_all(seats)
        db.flush()

        # 3. Create Workers and assign to seats
        workers = [
            Worker(name="John Doe", employee_code="E001", assigned_seat_id=seats[0].id, department="Engineering"),
            Worker(name="Jane Smith", employee_code="E002", assigned_seat_id=seats[1].id, department="Marketing"),
        ]
        db.add_all(workers)
        
        db.commit()
        print("Successfully seeded mockup data!")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
