import time
import threading
import logging
from typing import List, Optional, Dict
from datetime import datetime

from app.core.config import settings
from app.core.database import SessionLocal
from app.vision.stream_reader import StreamReader
from app.vision.detector_service import detector_service
from app.vision.motion_detector import MotionDetector
from app.vision.zone_checker import is_person_in_zone
from app.vision.occupancy_logic import OccupancyStatemachine

from app.services.occupancy_runtime import occupancy_runtime
from app.services.stream_state import stream_state
from app.services import occupancy_service, seat_service

logger = logging.getLogger(__name__)

class CameraWorker:
    """
    Independent processing unit for a single camera.
    
    Integrates:
    - StreamReader: Captures frames.
    - MotionDetector: Skips processing if idle.
    - PersonDetector: Standard YOLO person detection.
    - ZoneChecker + OccupancyLogic: Spatial & temporal logic.
    """

    def __init__(self, camera_id: int, camera_name: str, rtsp_url: str):
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.rtsp_url = rtsp_url

        # Infrastructure
        self._reader = StreamReader(camera_id, rtsp_url, name=camera_name)
        # self._detector = PersonDetector() # Removed in favor of shared DetectorService
        self._motion = MotionDetector()
        
        # Internal control
        self._running = False
        self._thread: Optional[threading.Thread] = None
        
        # Per-seat state machines
        self._seat_logics: Dict[int, OccupancyStatemachine] = {}
        
    def start(self):
        """Initialize stats and start the background thread."""
        self._running = True
        stream_state.update_worker(self.camera_id, running=True)
        
        self._thread = threading.Thread(
            target=self._run_loop,
            daemon=True,
            name=f"worker-{self.camera_id}"
        )
        self._thread.start()
        logger.info(f"[{self.camera_name}] CameraWorker started.")

    def stop(self):
        """Signal exit and wait for thread."""
        self._running = False
        stream_state.update_worker(self.camera_id, running=False)
        self._reader.stop()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        logger.info(f"[{self.camera_name}] CameraWorker stopped.")

    def _run_loop(self):
        self._reader.start()
        db = SessionLocal()
        frame_tick = 0
        
        try:
            while self._running:
                frame_tick += 1
                
                # --- Stream Health Sync ---
                stream_state.update_worker(
                    self.camera_id,
                    connected=self._reader.is_connected,
                    reconnect_count=self._reader.reconnect_count,
                    last_error=self._reader.last_error,
                    last_frame_time=self._reader.last_frame_time,
                    fps_estimate=self._reader.fps_estimate
                )
                
                # --- Frame Fetch & Skip ---
                frame = self._reader.get_frame()
                if frame is None or frame_tick % settings.FRAME_SKIP != 0:
                    time.sleep(0.01)
                    continue
                
                # --- Motion Gate ---
                if not self._motion.detect(frame):
                    time.sleep(0.01)
                    continue
                
                # --- Inference ---
                persons = detector_service.detect(frame)
                
                # --- Seat Processing ---
                # Fetch fresh seat config (in case of zone updates)
                seats = seat_service.get_seats_by_camera(db, self.camera_id)
                
                for seat in seats:
                    logic = self._seat_logics.setdefault(seat.id, OccupancyStatemachine(seat.id))
                    
                    seat_zone = {
                        "x": seat.zone_x, 
                        "y": seat.zone_y, 
                        "w": seat.zone_width, 
                        "h": seat.zone_height
                    }
                    
                    is_present = is_person_in_zone(persons, seat_zone, settings.OCCUPANCY_THRESHOLD)
                    
                    # Logic returns a bool (True/False) only if state changed
                    new_state = logic.process_detection(is_present, seat.is_occupied)
                    
                    if new_state is not None:
                        logger.info(f"[{self.camera_name}] Seat {seat.seat_code} transition → {new_state}")
                        # Persist to DB
                        occupancy_service.handle_seat_state_change(db, seat.id, new_state)
                        # Sync to Runtime RAM
                        occupancy_runtime.update_occupancy(seat.id, new_state)
                
                time.sleep(0.01)
                
        except Exception as e:
            logger.error(f"[{self.camera_name}] Fatal worker error: {e}", exc_info=True)
            stream_state.update_worker(self.camera_id, last_error=str(e))
        finally:
            db.close()
            self._reader.stop()
            logger.info(f"[{self.camera_name}] Worker thread finished.")
