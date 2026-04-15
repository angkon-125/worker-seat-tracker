import threading
import logging
from typing import Dict, Optional, List

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.camera_worker import CameraWorker
from app.services.occupancy_runtime import occupancy_runtime
from app.services.stream_state import stream_state

logger = logging.getLogger(__name__)

class CameraManager:
    """
    Global orchestrator for multi-camera workers.
    
    Responsibilities:
    - Worker Lifecycle (Start, Stop, Restart)
    - Concurrency Enforcement (MAX_CAMERAS)
    - Status Aggregation
    """
    
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._workers: Dict[int, CameraWorker] = {}
                    cls._instance._registry_lock = threading.Lock()
        return cls._instance

    def start_camera(self, camera_id: int, db=None) -> dict:
        """Start a camera worker if within limits."""
        with self._registry_lock:
            if camera_id in self._workers:
                return {"status": "already_running", "camera_id": camera_id}
            
            if len(self._workers) >= settings.MAX_CAMERAS:
                raise ValueError(f"Concurrency limit reached ({settings.MAX_CAMERAS} cameras max).")

        own_db = db is None
        if own_db: db = SessionLocal()
        
        try:
            from app.models.models import Camera, Seat
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if not camera:
                raise ValueError(f"Camera ID {camera_id} not found.")

            # Initialize seat status in runtime RAM
            seats = db.query(Seat).filter(Seat.camera_id == camera_id).all()
            for s in seats:
                occupancy_runtime.initialize_seat(s.id, s.seat_code, camera_id, s.is_occupied)

            # Create and start worker
            worker = CameraWorker(camera.id, camera.name, camera.rtsp_url)
            
            with self._registry_lock:
                self._workers[camera_id] = worker
            
            worker.start()
            return {"status": "started", "camera_id": camera_id, "name": camera.name}
            
        finally:
            if own_db: db.close()

    def stop_camera(self, camera_id: int) -> dict:
        """Gracefully stop a camera worker."""
        with self._registry_lock:
            worker = self._workers.pop(camera_id, None)
        
        if not worker:
            return {"status": "not_running", "camera_id": camera_id}
        
        worker.stop()
        # Cleanup telemetry state
        stream_state.remove_worker(camera_id)
        
        logger.info(f"Camera {camera_id} stopped and removed from registry.")
        return {"status": "stopped", "camera_id": camera_id}

    def restart_camera(self, camera_id: int) -> dict:
        """Stop and then start a camera worker."""
        self.stop_camera(camera_id)
        return self.start_camera(camera_id)

    def get_camera_status(self, camera_id: int) -> Optional[dict]:
        """Get detailed status for a single camera."""
        status = stream_state.get_worker_status(camera_id)
        if not status:
            return {"camera_id": camera_id, "running": False, "connected": False}
        return status

    def list_camera_statuses(self) -> List[dict]:
        """Aggregate all worker statuses."""
        all_stats = stream_state.get_all_statuses()
        return [
            {"camera_id": cid, **stats}
            for cid, stats in all_stats.items()
        ]

    def start_all_active(self, db=None):
        """Auto-start 'active' cameras on startup."""
        own_db = db is None
        if own_db: db = SessionLocal()
        try:
            from app.models.models import Camera
            active = db.query(Camera).filter(Camera.status == "active").all()
            for cam in active:
                try:
                    self.start_camera(cam.id, db)
                except Exception as e:
                    logger.error(f"Auto-start failed for camera {cam.id}: {e}")
        finally:
            if own_db: db.close()

    def stop_all(self):
        """Shutdown all workers on exit."""
        with self._registry_lock:
            ids = list(self._workers.keys())
        for cid in ids:
            try:
                self.stop_camera(cid)
            except Exception as e:
                logger.error(f"Error stopping camera {cid} during shutdown: {e}")

camera_manager = CameraManager()
