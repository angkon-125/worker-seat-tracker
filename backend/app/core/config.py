from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Worker Seat Tracker"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./test.db"

    # API
    API_V1_STR: str = "/api/v1"

    # Vision — YOLO
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    YOLO_CONFIDENCE: float = 0.4

    # Vision — Frame Processing
    FRAME_SKIP: int = 6           # Process 1 out of every N frames
    FRAME_WIDTH: int = 640        # Resize width before inference
    FRAME_HEIGHT: int = 360       # Resize height before inference

    # Vision — Motion Detection
    MOTION_THRESHOLD: int = 25    # Pixel diff threshold for motion (0-255)
    MOTION_MIN_AREA: int = 1500   # Minimum contour area to count as motion (px²)
    MOTION_BLUR_SIZE: int = 21    # Gaussian blur kernel size (must be odd)

    # Vision — Occupancy Logic
    OCCUPANCY_THRESHOLD: float = 0.4      # Min overlap fraction to mark seat occupied
    SEAT_EXIT_DELAY_SECONDS: int = 5      # Seconds without detection before marking empty
    OCCUPIED_CONFIRM_FRAMES: int = 2      # Frames in a row needed to confirm occupied

    # Camera Manager
    MAX_CAMERAS: int = 2          # Hard cap: max concurrent camera workers
    CAMERA_RECONNECT_DELAY: int = 3
    CAMERA_MAX_READ_FAILURES: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
