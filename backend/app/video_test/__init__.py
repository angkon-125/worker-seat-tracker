"""
Video Test + Tracking Window Module for Worker Seat Tracker

This module provides video-based testing and calibration for the occupancy
tracking system, mirroring the live camera worker architecture.

Components:
- analyzer: Main video analysis pipeline
- session_tracker: Occupancy session timing and state machine
- person_tracker: Lightweight centroid-based person tracking
- schemas: Pydantic models for requests/responses

Usage:
    from app.video_test import VideoAnalyzerFactory
    
    analyzer = VideoAnalyzerFactory.create()
    result = analyzer.analyze(video_path, request)
"""

from .analyzer import VideoAnalyzer, VideoAnalyzerFactory
from .session_tracker import SessionTracker, SessionAggregator
from .person_tracker import CentroidTracker, PersonTrackerMode
from .schemas import (
    AnalysisMode,
    SeatZone,
    VideoConfig,
    OccupancySession,
    SeatSummary,
    PersonTracking,
    VideoSummary,
    VideoAnalysisRequest,
    VideoAnalysisResult,
    AnalysisJobStatus,
    VideoUploadResponse,
)

__all__ = [
    "VideoAnalyzer",
    "VideoAnalyzerFactory",
    "SessionTracker",
    "SessionAggregator",
    "CentroidTracker",
    "PersonTrackerMode",
    "AnalysisMode",
    "SeatZone",
    "VideoConfig",
    "OccupancySession",
    "SeatSummary",
    "PersonTracking",
    "VideoSummary",
    "VideoAnalysisRequest",
    "VideoAnalysisResult",
    "AnalysisJobStatus",
    "VideoUploadResponse",
]