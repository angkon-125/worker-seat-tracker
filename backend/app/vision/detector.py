from ultralytics import YOLO
import cv2
import numpy as np
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class PersonDetector:
    """
    CPU-optimized YOLO person detector.

    Key optimizations:
    - Forces CPU device (no GPU dependency)
    - Filters class 0 (person) at the YOLO level, not post-process
    - Uses imgsz matched to FRAME_WIDTH for efficient inference
    - Verbose=False to suppress Ultralytics stdout spam
    """

    def __init__(self, model_path: str = None):
        model_path = model_path or settings.YOLO_MODEL_PATH
        logger.info(f"Loading YOLO model: {model_path} (CPU mode)")

        self.model = YOLO(model_path)
        # Force CPU — critical for our hardware constraints
        self.device = "cpu"
        # COCO class 0 = person
        self.person_class_id = 0
        # Match inference size to our capture resolution width
        self._imgsz = settings.FRAME_WIDTH

    def detect(self, frame: np.ndarray) -> list:
        """
        Detect persons in a pre-resized frame.

        Args:
            frame: BGR numpy array (already resized to FRAME_WIDTH x FRAME_HEIGHT)

        Returns:
            List of [x1, y1, x2, y2] normalized bounding boxes (0.0–1.0)
        """
        if frame is None:
            return []

        h, w = frame.shape[:2]

        results = self.model(
            frame,
            verbose=False,
            conf=settings.YOLO_CONFIDENCE,
            classes=[self.person_class_id],  # Filter at inference time — faster
            device=self.device,
            imgsz=self._imgsz,
        )[0]

        detections = []
        for box in results.boxes:
            coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2] in pixels
            detections.append([
                coords[0] / w,
                coords[1] / h,
                coords[2] / w,
                coords[3] / h,
            ])

        return detections
