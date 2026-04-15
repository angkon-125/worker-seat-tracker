import threading
import logging
from typing import List, Optional
import numpy as np

from app.core.config import settings
from app.vision.detector import PersonDetector

logger = logging.getLogger(__name__)

class DetectorService:
    """
    Singleton service to manage a shared PersonDetector (YOLOv8).
    
    This ensures we only load the model once and share it across all
    active CameraWorkers, significantly saving memory and CPU on mid-range hardware.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._detector = None
                    cls._instance._init_lock = threading.Lock()
                    cls._instance._detect_lock = threading.Lock()
        return cls._instance

    def _ensure_detector(self):
        """Lazy initialization of the underlying detector."""
        if self._detector is None:
            with self._init_lock:
                if self._detector is None:
                    logger.info("Initializing shared PersonDetector service...")
                    self._detector = PersonDetector()
        return self._detector

    def detect(self, frame: np.ndarray) -> List[List[float]]:
        """
        Run detection on a frame using the shared model.
        
        Args:
            frame: BGR numpy array
            
        Returns:
            List of normalized bounding boxes [x1, y1, x2, y2]
        """
        detector = self._ensure_detector()
        
        # Guard YOLO inference with a lock. 
        # While YOLO itself can be thread-safe, concurrent inference on a 
        # single CPU can lead to cache thrashing or resource contention.
        # Serializing inference ensures stable latency per frame across workers.
        with self._detect_lock:
            return detector.detect(frame)

# Global singleton instance
detector_service = DetectorService()
