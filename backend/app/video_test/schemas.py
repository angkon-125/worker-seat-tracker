from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AnalysisMode(str, Enum):
    """Analysis mode configuration"""
    SEAT_OCCUPANCY_ONLY = "seat_occupancy_only"
    VIDEO_PERSON_TRACKING = "video_person_tracking"
    HYBRID_DEBUG = "hybrid_debug"


class SeatZone(BaseModel):
    """Seat zone definition for video analysis"""
    seat_id: str
    x1: float  # Normalized coordinates (0-1)
    y1: float
    x2: float
    y2: float
    label: Optional[str] = None


class VideoConfig(BaseModel):
    """Configuration for video analysis"""
    mode: AnalysisMode = AnalysisMode.SEAT_OCCUPANCY_ONLY
    frame_skip: int = Field(default=6, description="Process every Nth frame")
    frame_width: int = Field(default=640, description="Resize width for processing")
    frame_height: int = Field(default=360, description="Resize height for processing")
    use_motion_gating: bool = Field(default=True, description="Enable motion detection pre-filter")
    occupancy_threshold: float = Field(default=0.4, description="IoU threshold for seat occupancy")
    confirmation_frames: int = Field(default=2, description="Frames to confirm occupancy")
    exit_delay_seconds: float = Field(default=5.0, description="Delay before marking seat empty")
    enable_person_tracking: bool = Field(default=False, description="Enable person ID tracking")
    save_annotated_video: bool = Field(default=True, description="Generate annotated output video")


class OccupancySession(BaseModel):
    """Single occupancy session for a seat"""
    session_id: str
    start_time: float  # Video timestamp in seconds
    end_time: Optional[float] = None
    duration_seconds: Optional[float] = None
    person_id: Optional[str] = None  # Optional person tracking ID


class SeatSummary(BaseModel):
    """Summary of occupancy for a single seat"""
    seat_id: str
    total_occupied_time_seconds: float
    total_sessions: int
    sessions: List[OccupancySession]
    occupancy_rate: Optional[float] = None  # Percentage of video duration


class PersonTracking(BaseModel):
    """Person tracking summary (if enabled)"""
    person_id: str
    first_seen: float  # Video timestamp
    last_seen: float
    total_visible_time_seconds: float
    seat_interactions: List[str]  # List of seat_ids interacted with
    path_points_count: int


class VideoSummary(BaseModel):
    """Overall video analysis summary"""
    video_name: str
    duration_seconds: float
    fps: float
    total_frames: int
    processed_frames: int
    skipped_frames: int
    analysis_mode: AnalysisMode
    processing_time_seconds: float


class VideoAnalysisRequest(BaseModel):
    """Request to start video analysis"""
    video_filename: str
    seat_zones: List[SeatZone]
    config: VideoConfig = Field(default_factory=VideoConfig)


class VideoAnalysisResult(BaseModel):
    """Complete video analysis result"""
    job_id: str
    status: str
    video_summary: VideoSummary
    seat_summaries: List[SeatSummary]
    person_tracking: Optional[List[PersonTracking]] = None
    annotated_video_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None


class AnalysisJobStatus(BaseModel):
    """Status of an analysis job"""
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: float  # 0-100
    current_frame: int
    total_frames: int
    message: Optional[str] = None
    result: Optional[VideoAnalysisResult] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class VideoUploadResponse(BaseModel):
    """Response for video upload"""
    success: bool
    filename: str
    video_path: str
    duration: Optional[float] = None
    fps: Optional[float] = None
    total_frames: Optional[int] = None
    resolution: Optional[Dict[str, int]] = None
    error: Optional[str] = None
