from sqlalchemy.orm import Session
from app.models.models import Camera
from app.schemas.schemas import CameraCreate


def get_cameras(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Camera).offset(skip).limit(limit).all()


def get_camera(db: Session, camera_id: int):
    return db.query(Camera).filter(Camera.id == camera_id).first()


def create_camera(db: Session, camera: CameraCreate):
    db_camera = Camera(**camera.dict())
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera


def update_camera_status(db: Session, camera_id: int, status: str):
    db_camera = get_camera(db, camera_id)
    if db_camera:
        db_camera.status = status
        db.commit()
        db.refresh(db_camera)
    return db_camera


def delete_camera(db: Session, camera_id: int):
    db_camera = get_camera(db, camera_id)
    if db_camera:
        db.delete(db_camera)
        db.commit()
    return db_camera


# ---------------------------------------------------------------------------
# Vision Worker Wrappers (delegate to CameraManager)
# ---------------------------------------------------------------------------

def start_camera_worker(camera_id: int, db: Session) -> dict:
    """Start vision processing for a camera — delegates to CameraManager."""
    from app.services.camera_manager import camera_manager
    return camera_manager.start_camera(camera_id, db)


def stop_camera_worker(camera_id: int) -> dict:
    """Stop vision processing for a camera — delegates to CameraManager."""
    from app.services.camera_manager import camera_manager
    return camera_manager.stop_camera(camera_id)
