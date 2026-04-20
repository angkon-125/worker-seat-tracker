from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..services.camera_manager import camera_manager

router = APIRouter()

# --- Room Endpoints ---
@router.get("/rooms", response_model=List[schemas.Room])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(models.Room).all()

@router.post("/rooms", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    db_room = models.Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

# --- Camera Endpoints ---
@router.get("/cameras", response_model=List[schemas.Camera])
def get_cameras(db: Session = Depends(get_db)):
    return db.query(models.Camera).all()

@router.post("/cameras", response_model=schemas.Camera)
def create_camera(camera: schemas.CameraCreate, db: Session = Depends(get_db)):
    db_camera = models.Camera(**camera.dict())
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    # Start worker automatically if active
    if db_camera.is_active:
        camera_manager.start_camera(db_camera.id)
    return db_camera

@router.post("/cameras/{camera_id}/start")
def start_camera(camera_id: int):
    camera_manager.start_camera(camera_id)
    return {"status": "started"}

@router.post("/cameras/{camera_id}/stop")
def stop_camera(camera_id: int):
    camera_manager.stop_camera(camera_id)
    return {"status": "stopped"}

# --- Seat Endpoints ---
@router.get("/seats", response_model=List[schemas.Seat])
def get_seats(camera_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Seat)
    if camera_id:
        query = query.filter(models.Seat.camera_id == camera_id)
    return query.all()

@router.post("/seats", response_model=schemas.Seat)
def create_seat(seat: schemas.SeatCreate, db: Session = Depends(get_db)):
    db_seat = models.Seat(**seat.dict())
    db.add(db_seat)
    db.commit()
    db.refresh(db_seat)
    return db_seat

# --- Dashboard Stats ---
@router.get("/stats", response_model=List[schemas.RoomStats])
def get_stats(db: Session = Depends(get_db)):
    rooms = db.query(models.Room).all()
    stats = []
    for room in rooms:
        total_seats = 0
        occupied_seats = 0
        for camera in room.cameras:
            total_seats += len(camera.seats)
            occupied_seats += sum(1 for s in camera.seats if s.is_occupied)
        
        stats.append(schemas.RoomStats(
            room_id=room.id,
            room_name=room.name,
            total_seats=total_seats,
            occupied_seats=occupied_seats,
            occupancy_rate=(occupied_seats / total_seats * 100) if total_seats > 0 else 0
        ))
    return stats


# --- Audit Logs ---
from datetime import datetime, timedelta
from typing import Optional

@router.get("/logs")
def get_occupancy_logs(
    seat_id: Optional[int] = None,
    camera_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get occupancy audit logs with optional filtering."""
    query = db.query(
        models.OccupancyLog,
        models.Seat.name.label('seat_name'),
        models.Camera.name.label('camera_name'),
        models.Room.name.label('room_name')
    ).join(
        models.Seat, models.OccupancyLog.seat_id == models.Seat.id
    ).join(
        models.Camera, models.Seat.camera_id == models.Camera.id
    ).join(
        models.Room, models.Camera.room_id == models.Room.id
    )
    
    if seat_id:
        query = query.filter(models.OccupancyLog.seat_id == seat_id)
    if camera_id:
        query = query.filter(models.Seat.camera_id == camera_id)
    if start_date:
        query = query.filter(models.OccupancyLog.timestamp >= start_date)
    if end_date:
        query = query.filter(models.OccupancyLog.timestamp <= end_date)
    
    total = query.count()
    logs = query.order_by(models.OccupancyLog.timestamp.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": [
            {
                "id": log.OccupancyLog.id,
                "seat_id": log.OccupancyLog.seat_id,
                "seat_name": log.seat_name,
                "camera_name": log.camera_name,
                "room_name": log.room_name,
                "is_occupied": log.OccupancyLog.is_occupied,
                "timestamp": log.OccupancyLog.timestamp.isoformat() if log.OccupancyLog.timestamp else None
            }
            for log in logs
        ]
    }


@router.get("/logs/summary")
def get_logs_summary(db: Session = Depends(get_db)):
    """Get summary statistics for audit logs."""
    total_logs = db.query(models.OccupancyLog).count()
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_logs = db.query(models.OccupancyLog).filter(models.OccupancyLog.timestamp >= today).count()
    
    # Get most active seat
    most_active = db.query(
        models.Seat.id,
        models.Seat.name,
        db.func.count(models.OccupancyLog.id).label('event_count')
    ).join(
        models.OccupancyLog, models.Seat.id == models.OccupancyLog.seat_id
    ).group_by(
        models.Seat.id, models.Seat.name
    ).order_by(db.desc('event_count')).first()
    
    return {
        "total_logs": total_logs,
        "today_logs": today_logs,
        "most_active_seat": {
            "id": most_active.id if most_active else None,
            "name": most_active.name if most_active else None,
            "event_count": most_active.event_count if most_active else 0
        } if most_active else None
    }
