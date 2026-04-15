import time
from app.core.database import SessionLocal, engine, Base
from app.services import occupancy_service
from app.models.models import Seat, SeatSession, Worker, Camera
from app.core.config import settings

def run_test():
    print("--- Starting Occupancy Logic Smoke Test ---")
    
    # 1. Initialize DB
    Base.metadata.drop_all(bind=engine) # Start fresh
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 2. Setup Mock Data
        camera = Camera(name="Test Cam", rtsp_url="mock://test", status="active")
        db.add(camera)
        db.flush()
        
        seat = Seat(seat_code="S1", camera_id=camera.id, zone_x=0, zone_y=0, zone_width=0.5, zone_height=0.5)
        db.add(seat)
        db.flush()
        
        worker = Worker(name="Tester", employee_code="T001", assigned_seat_id=seat.id)
        db.add(worker)
        db.commit()
        
        print(f"Test Environment Ready. Seat ID: {seat.id}")

        # 3. Simulate "Person Detected" (Occupied)
        print("Action: Person enters seat...")
        occupancy_service.handle_seat_state_change(db, seat.id, True)
        
        # Verify session started
        active_session = db.query(SeatSession).filter(SeatSession.seat_id == seat.id, SeatSession.status == "active").first()
        assert active_session is not None
        assert active_session.worker_id == worker.id
        print(f"SUCCESS: Active session started at {active_session.start_time}")

        # 4. Wait a bit
        print("Simulating occupancy duration...")
        time.sleep(2)

        # 5. Simulate "Person Leaves" (Empty)
        print("Action: Person leaves seat...")
        occupancy_service.handle_seat_state_change(db, seat.id, False)

        # Verify session ended
        db.refresh(seat)
        assert seat.is_occupied == False
        
        completed_session = db.query(SeatSession).filter(SeatSession.seat_id == seat.id, SeatSession.status == "completed").first()
        assert completed_session is not None
        assert completed_session.end_time is not None
        assert completed_session.duration_seconds >= 2
        print(f"SUCCESS: Session completed. Duration: {completed_session.duration_seconds} seconds")

        # 6. Check Stats
        stats = occupancy_service.get_dashboard_stats(db)
        print(f"Dashboard Stats: Seats={stats.total_seats}, Occupied={stats.occupied_seats}, Free={stats.empty_seats}")
        assert stats.occupied_seats == 0
        assert stats.empty_seats == 1

        print("\n--- ALL TESTS PASSED! ---")

    except Exception as e:
        print(f"TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
