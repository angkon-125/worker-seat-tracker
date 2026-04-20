from app.database import SessionLocal, engine, Base
from app.models import Room, Camera, Seat
import logging

logging.basicConfig(level=logging.INFO)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if room already exists
        if db.query(Room).first():
            logging.info("Database already has data. Skipping seed.")
            return

        # Create a sample room
        room = Room(name="Main IQ Office", description="Main operations area")
        db.add(room)
        db.commit()
        db.refresh(room)

        # Create a sample camera
        # Note: Using a fake RTSP URL for demonstration. In production, replace with real stream.
        camera = Camera(
            room_id=room.id, 
            name="CCTV-01", 
            rtsp_url="rtsp://admin:admin123@192.168.1.64/stream1"
        )
        db.add(camera)
        db.commit()
        db.refresh(camera)

        # Create 16 seats in a grid pattern
        seats = []
        for i in range(4): # rows
            for j in range(4): # cols
                seat = Seat(
                    camera_id=camera.id,
                    name=f"S{i*4 + j + 1}",
                    x_min=j * 0.25,
                    y_min=i * 0.25,
                    x_max=(j + 1) * 0.25,
                    y_max=(i + 1) * 0.25,
                    is_occupied=False
                )
                seats.append(seat)
        
        db.add_all(seats)
        db.commit()
        logging.info(f"Successfully seeded DB with 1 room, 1 camera, and {len(seats)} seats.")

    except Exception as e:
        logging.error(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
