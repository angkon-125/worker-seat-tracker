from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from app.models.models import Seat, SeatSession, OccupancyEvent, Worker, Camera
from app.schemas.schemas import DashboardStats
import logging

logger = logging.getLogger(__name__)

def handle_seat_state_change(db: Session, seat_id: int, is_occupied: bool):
    """
    Handles seat state transitions and manages sessions.
    """
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        return None

    # If state is the same, do nothing
    if seat.is_occupied == is_occupied:
        return seat

    # Create occupancy event
    event = OccupancyEvent(
        seat_id=seat.id,
        camera_id=seat.camera_id,
        event_type="occupied" if is_occupied else "empty"
    )
    db.add(event)

    # Manage Session
    if is_occupied:
        # Start new session
        # Find if there is a worker assigned to this seat
        worker = db.query(Worker).filter(Worker.assigned_seat_id == seat.id).first()
        worker_id = worker.id if worker else None
        
        session = SeatSession(
            worker_id=worker_id,
            seat_id=seat.id,
            camera_id=seat.camera_id,
            status="active"
        )
        db.add(session)
        logger.info(f"Started session for seat {seat.seat_code}")
    else:
        # End active session
        active_session = db.query(SeatSession).filter(
            SeatSession.seat_id == seat.id,
            SeatSession.status == "active"
        ).first()
        
        if active_session:
            # Ensure start_time is timezone-aware if the DB returns a naive one
            now_utc = datetime.now(timezone.utc)
            start_time = active_session.start_time
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            
            active_session.end_time = now_utc
            active_session.status = "completed"
            
            # Calculate duration
            duration = now_utc - start_time
            active_session.duration_seconds = int(duration.total_seconds())
            logger.info(f"Ended session for seat {seat.seat_code}. Duration: {active_session.duration_seconds}s")

    # Update seat status
    seat.is_occupied = is_occupied
    db.commit()
    db.refresh(seat)
    return seat

def get_dashboard_stats(db: Session) -> DashboardStats:
    total_seats = db.query(func.count(Seat.id)).scalar()
    occupied_seats = db.query(func.count(Seat.id)).filter(Seat.is_occupied == True).scalar()
    active_cameras = db.query(func.count(Camera.id)).filter(Camera.status == "active").scalar()
    
    return DashboardStats(
        total_seats=total_seats or 0,
        occupied_seats=occupied_seats or 0,
        empty_seats=(total_seats or 0) - (occupied_seats or 0),
        active_cameras=active_cameras or 0
    )

def get_recent_sessions(db: Session, limit: int = 10):
    return db.query(SeatSession).order_by(SeatSession.start_time.desc()).limit(limit).all()
