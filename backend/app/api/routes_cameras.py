from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.camera_manager import camera_manager

router = APIRouter(prefix="/runtime/cameras", tags=["Camera Control"])

@router.post("/{camera_id}/start")
async def start_camera(camera_id: int, db: Session = Depends(get_db)):
    """Start a specific camera worker via the Manager."""
    try:
        return camera_manager.start_camera(camera_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start camera: {str(e)}")

@router.post("/{camera_id}/stop")
async def stop_camera(camera_id: int):
    """Gracefully stop a specific camera worker."""
    return camera_manager.stop_camera(camera_id)

@router.post("/{camera_id}/restart")
async def restart_camera(camera_id: int, db: Session = Depends(get_db)):
    """Stop and then restart a specific camera worker."""
    try:
        return camera_manager.restart_camera(camera_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restart camera: {str(e)}")
