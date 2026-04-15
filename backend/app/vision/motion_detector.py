import cv2
import numpy as np
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class MotionDetector:
    """
    Lightweight frame-differencing motion detector.

    Acts as a CPU-saving gate before YOLO inference:
    - If no motion detected → skip YOLO entirely
    - If motion detected → proceed to YOLO person detection

    Uses: grayscale + Gaussian blur + absolute frame difference + threshold + contour analysis
    """

    def __init__(self):
        self.prev_frame_gray = None
        self.blur_size = settings.MOTION_BLUR_SIZE
        self.threshold = settings.MOTION_THRESHOLD
        self.min_area = settings.MOTION_MIN_AREA

        # Ensure blur kernel size is always odd (required by OpenCV)
        if self.blur_size % 2 == 0:
            self.blur_size += 1

    def detect(self, frame: np.ndarray) -> bool:
        """
        Compare current frame against the previous one.

        Returns True if significant motion is detected, False otherwise.
        Always updates internal state with the current frame.
        """
        if frame is None:
            return False

        # Convert to grayscale and blur to reduce noise
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (self.blur_size, self.blur_size), 0)

        # Initialize on first frame — no comparison possible yet
        if self.prev_frame_gray is None:
            self.prev_frame_gray = blurred
            return False

        # Compute absolute pixel difference between frames
        diff = cv2.absdiff(self.prev_frame_gray, blurred)
        self.prev_frame_gray = blurred

        # Threshold: only keep pixels with large differences
        _, thresh = cv2.threshold(diff, self.threshold, 255, cv2.THRESH_BINARY)

        # Dilate to fill gaps in motion regions
        kernel = np.ones((5, 5), np.uint8)
        dilated = cv2.dilate(thresh, kernel, iterations=2)

        # Find contours of motion regions
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Check if any contour is large enough to be meaningful
        for contour in contours:
            if cv2.contourArea(contour) >= self.min_area:
                return True

        return False

    def reset(self):
        """Reset the detector state (e.g., after stream reconnect)."""
        self.prev_frame_gray = None
        logger.debug("Motion detector state reset.")
