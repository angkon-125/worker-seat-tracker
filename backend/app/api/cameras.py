from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services import camera_service

router = APIRouter()

@router.get("/", response_model=List[schemas.Camera])
def read_cameras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all registered cameras."""
    return camera_service.get_cameras(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.Camera)
def create_camera(camera: schemas.CameraCreate, db: Session = Depends(get_db)):
    """Register a new camera Node."""
    return camera_service.create_camera(db=db, camera=camera)

@router.get("/{camera_id}", response_model=schemas.Camera)
def read_camera(camera_id: int, db: Session = Depends(get_db)):
    """Get metadata for a specific camera."""
    db_camera = camera_service.get_camera(db, camera_id=camera_id)
    if db_camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    return db_camera

@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    """Unregister a camera Node."""
    camera_service.delete_camera(db=db, camera_id=camera_id)
    return {"status": "success"}
