from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services import occupancy_service
from app.services.camera_manager import camera_manager
from app.services.occupancy_runtime import occupancy_runtime

router = APIRouter(prefix="/runtime", tags=["System Runtime Status"])

@router.get("/cameras/status")
async def get_all_camera_status():
    """Get health and telemetry for all active workers."""
    return {"workers": camera_manager.list_camera_statuses()}

@router.get("/cameras/{camera_id}/status")
async def get_camera_status(camera_id: int):
    """Get detailed health/telemetry for a specific camera worker."""
    return camera_manager.get_camera_status(camera_id)

@router.get("/live-status")
async def get_live_occupancy():
    """Real-time seat occupancy from memory store (designed for fast polling)."""
    seats = occupancy_runtime.get_snapshot()
    return {
        "seat_count": len(seats),
        "seats": list(seats.values())
    }

@router.get("/stats", response_model=schemas.DashboardStats)
def read_dashboard_stats(db: Session = Depends(get_db)):
    """Get aggregated seat/camera statistics from database."""
    return occupancy_service.get_dashboard_stats(db)

@router.get("/recent-sessions", response_model=List[schemas.SeatSession])
def read_recent_sessions(limit: int = 10, db: Session = Depends(get_db)):
    """Get the most recent seat sessions from database."""
    return occupancy_service.get_recent_sessions(db, limit=limit)
