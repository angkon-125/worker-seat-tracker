import cv2
import numpy as np
from ultralytics import YOLO
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self, model_path="yolov8n.pt"):
        try:
            self.model = YOLO(model_path)
            logger.info(f"Loaded YOLO model from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None

    def detect_people(self, frame):
        """Detects people in a frame and returns bounding boxes."""
        if self.model is None:
            return []
        
        # Run inference (class 0 is 'person' in COCO)
        results = self.model(frame, classes=[0], verbose=False)
        
        detections = []
        for r in results:
            boxes = r.boxes.xyxyn.cpu().numpy() # [x1, y1, x2, y2] normalized
            detections.extend(boxes)
            
        return detections

    def calculate_iou(self, box1, box2):
        """Calculates Intersection over Union between two normalized boxes."""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        # We care about how much of the SEAT is occupied, so we divide by seat area
        seat_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
        
        if seat_area == 0:
            return 0
        
        return intersection / seat_area

    def check_occupancy(self, detections, seats, threshold=0.3):
        """
        Maps detections to seats and returns occupancy states.
        seats: List of objects with {id, x_min, y_min, x_max, y_max}
        """
        occupancy_map = {}
        for seat in seats:
            seat_box = [seat.x_min, seat.y_min, seat.x_max, seat.y_max]
            is_occupied = False
            
            for det in detections:
                overlap = self.calculate_iou(det, seat_box)
                if overlap > threshold:
                    is_occupied = True
                    break
            
            occupancy_map[seat.id] = is_occupied
            
        return occupancy_map

# Global instance
vision_engine = VisionService()
