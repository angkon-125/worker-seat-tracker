import cv2
import time
import threading
import logging
import numpy as np
from datetime import datetime
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class StreamReader:
    """
    Abstractions around OpenCV VideoCapture for stable RTSP stream reading.
    
    Features:
    - Auto-reconnect with backoff.
    - Captures and resizes on a background thread.
    - Exposes stream health metrics (FPS, error state).
    """
    
    def __init__(self, camera_id: int, rtsp_url: str, name: str = "Camera"):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.name = name
        
        self.cap: Optional[cv2.VideoCapture] = None
        self.running = False
        self.is_connected = False
        
        # Stats & Metadata
        self.reconnect_count = 0
        self.last_error: Optional[str] = None
        self.last_frame_time: Optional[datetime] = None
        self.fps_estimate = 0.0
        
        # Internal sizing
        self._target_dim = (settings.FRAME_WIDTH, settings.FRAME_HEIGHT)
        
        # Threading
        self._last_frame: Optional[np.ndarray] = None
        self._frame_lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        
    def start(self):
        """Start the background capture thread."""
        self.running = True
        self._thread = threading.Thread(
            target=self._capture_loop,
            daemon=True,
            name=f"reader-{self.name}"
        )
        self._thread.start()
        logger.info(f"[{self.name}] StreamReader started.")

    def stop(self):
        """Gracefully stop and release resources."""
        self.running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)
        self._release_cap()
        logger.info(f"[{self.name}] StreamReader stopped.")

    def get_frame(self) -> Optional[np.ndarray]:
        """Thread-safe access to the latest resized frame."""
        with self._frame_lock:
            return self._last_frame

    def _capture_loop(self):
        consecutive_failures = 0
        frame_times = []
        
        while self.running:
            if self.cap is None or not self.cap.isOpened():
                self._connect()
                if not self.is_connected:
                    time.sleep(settings.CAMERA_RECONNECT_DELAY)
                    continue

            ret, frame = self.cap.read()
            
            if not ret or frame is None:
                consecutive_failures += 1
                if consecutive_failures >= settings.CAMERA_MAX_READ_FAILURES:
                    logger.warning(f"[{self.name}] Stream read failure limit reached. Reconnecting...")
                    self._release_cap()
                    consecutive_failures = 0
                    self.reconnect_count += 1
                continue
                
            consecutive_failures = 0
            
            # Update metrics
            now = datetime.now()
            self.last_frame_time = now
            
            # Simple FPS estimation
            t_now = time.time()
            frame_times.append(t_now)
            if len(frame_times) > 30:
                frame_times.pop(0)
                fps = len(frame_times) / (frame_times[-1] - frame_times[0])
                self.fps_estimate = round(fps, 1)

            # Resize on capture thread
            resized = cv2.resize(frame, self._target_dim, interpolation=cv2.INTER_LINEAR)
            
            with self._frame_lock:
                self._last_frame = resized
                
            # Cap the internal read rate to save CPU
            time.sleep(0.01)

    def _connect(self):
        """Attempt to open the RTSP stream."""
        logger.info(f"[{self.name}] Attempting connection to RTSP...")
        try:
            self.cap = cv2.VideoCapture(self.rtsp_url)
            if self.cap.isOpened():
                self.is_connected = True
                self.last_error = None
                logger.info(f"[{self.name}] Stream connected successfully.")
            else:
                self.is_connected = False
                self.last_error = "Failed to open stream (invalid URL or device offline)"
                self._release_cap()
        except Exception as e:
            self.is_connected = False
            self.last_error = f"Connect exception: {str(e)}"
            self._release_cap()

    def _release_cap(self):
        if self.cap:
            self.cap.release()
            self.cap = None
        self.is_connected = False
