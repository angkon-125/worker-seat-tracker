import threading
import cv2
import time
import logging
from typing import Dict, List
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Camera, Seat, OccupancyLog
from .vision_service import vision_engine

logger = logging.getLogger(__name__)

class CameraWorker(threading.Thread):
    def __init__(self, camera_id: int):
        super().__init__()
        self.camera_id = camera_id
        self.stop_event = threading.Event()
        self._name = f"CameraWorker-{camera_id}"
        self.daemon = True

    def run(self):
        logger.info(f"Starting worker for camera {self.camera_id}")
        db: Session = SessionLocal()
        
        try:
            camera = db.query(Camera).filter(Camera.id == self.camera_id).first()
            if not camera:
                logger.error(f"Camera {self.camera_id} not found in DB")
                return

            cap = cv2.VideoCapture(camera.rtsp_url)
            
            while not self.stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    logger.warning(f"Failed to read from camera {self.camera_id}. Retrying...")
                    cap.release()
                    time.sleep(5)
                    cap = cv2.VideoCapture(camera.rtsp_url)
                    continue

                # Refresh seats from DB (in case of updates)
                seats = db.query(Seat).filter(Seat.camera_id == self.camera_id).all()
                if not seats:
                    time.sleep(1)
                    continue

                # Detect people
                detections = vision_engine.detect_people(frame)
                
                # Check occupancy
                occupancy_results = vision_engine.check_occupancy(detections, seats)
                
                # Update DB
                for seat_id, is_occupied in occupancy_results.items():
                    seat = db.query(Seat).filter(Seat.id == seat_id).first()
                    if seat and seat.is_occupied != is_occupied:
                        # Log change and update state
                        seat.is_occupied = is_occupied
                        log = OccupancyLog(seat_id=seat_id, is_occupied=is_occupied)
                        db.add(log)
                        db.commit()

                # Update camera heartbeat
                camera.last_heartbeat = time.strftime('%Y-%m-%d %H:%M:%S')
                db.commit()

                # Throttle to save CPU (2-3 FPS is plenty for occupancy)
                time.sleep(0.5)

            cap.release()
        except Exception as e:
            logger.error(f"Error in camera worker {self.camera_id}: {e}")
        finally:
            db.close()
            logger.info(f"Stopped worker for camera {self.camera_id}")

    def stop(self):
        self.stop_event.set()

class CameraManager:
    def __init__(self):
        self.workers: Dict[int, CameraWorker] = {}

    def start_camera(self, camera_id: int):
        if camera_id in self.workers and self.workers[camera_id].is_alive():
            logger.info(f"Worker for camera {camera_id} already running")
            return
        
        worker = CameraWorker(camera_id)
        self.workers[camera_id] = worker
        worker.start()

    def stop_camera(self, camera_id: int):
        if camera_id in self.workers:
            self.workers[camera_id].stop()
            self.workers[camera_id].join(timeout=2)
            del self.workers[camera_id]

    def stop_all(self):
        for worker in self.workers.values():
            worker.stop()
        for worker in self.workers.values():
            worker.join(timeout=2)
        self.workers.clear()

# Global manager
camera_manager = CameraManager()
