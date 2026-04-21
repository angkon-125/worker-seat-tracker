import cv2
import numpy as np
import time
import uuid
import os
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import logging

from .schemas import (
    VideoAnalysisRequest, VideoAnalysisResult, VideoSummary,
    SeatZone, VideoConfig, AnalysisMode
)
from .session_tracker import SessionTracker, SessionAggregator
from .person_tracker import CentroidTracker, PersonTrackerMode
from ..services.vision_service import VisionService

logger = logging.getLogger(__name__)


class VideoAnalyzer:
    """
    Main video analysis pipeline for Worker Seat Tracker.
    Mirrors the live camera worker architecture for video testing.
    
    Pipeline:
    1. Read frame
    2. Skip frame if frame_count % FRAME_SKIP != 0
    3. Resize frame
    4. Optional motion gating
    5. YOLOv8n person detection (class 0 only)
    6. Zone check for each seat
    7. Occupancy state machine update
    8. Session timing update
    9. Optional person tracking
    10. Render optional overlay
    11. Save structured events
    """
    
    def __init__(self, vision_service: VisionService, output_dir: str = "video_test_output"):
        self.vision_service = vision_service
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def analyze(
        self,
        video_path: str,
        request: VideoAnalysisRequest,
        progress_callback: Optional[callable] = None
    ) -> VideoAnalysisResult:
        """
        Analyze video file for seat occupancy.
        
        Args:
            video_path: Path to video file
            request: Analysis configuration
            progress_callback: Optional callback(frame, total_frames) for progress updates
            
        Returns:
            VideoAnalysisResult with seat summaries and session data
        """
        job_id = str(uuid.uuid4())
        config = request.config
        start_time = time.time()
        
        try:
            # Open video
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Cannot open video: {video_path}")
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # Initialize components
            session_tracker = SessionTracker(
                confirmation_frames=config.confirmation_frames,
                exit_delay_seconds=config.exit_delay_seconds
            )
            
            person_tracker = None
            if config.enable_person_tracking:
                person_tracker = CentroidTracker()
            
            # Video writer for annotated output
            video_writer = None
            if config.save_annotated_video:
                output_path = self.output_dir / f"annotated_{job_id}.mp4"
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                video_writer = cv2.VideoWriter(
                    str(output_path),
                    fourcc,
                    fps,
                    (width, height)
                )
            
            # Processing loop
            frame_count = 0
            processed_frames = 0
            prev_frame = None
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                timestamp = frame_count / fps if fps > 0 else 0
                
                # Progress callback
                if progress_callback and frame_count % 10 == 0:
                    progress_callback(frame_count, total_frames)
                
                # Frame skipping
                if frame_count % config.frame_skip != 0:
                    if video_writer:
                        video_writer.write(frame)
                    continue
                
                # Resize for processing
                processed_frame = cv2.resize(
                    frame,
                    (config.frame_width, config.frame_height)
                )
                
                # Optional motion gating
                if config.use_motion_gating and prev_frame is not None:
                    if not self._has_motion(prev_frame, processed_frame):
                        prev_frame = processed_frame
                        if video_writer:
                            video_writer.write(frame)
                        continue
                
                prev_frame = processed_frame
                
                # YOLOv8n person detection
                detections = self.vision_service.detect_people(processed_frame)
                
                # Normalize detections if they're not already
                normalized_detections = self._normalize_detections(
                    detections,
                    config.frame_width,
                    config.frame_height
                )
                
                # Person tracking (if enabled)
                person_ids = []
                if person_tracker and config.enable_person_tracking:
                    person_ids = person_tracker.update(normalized_detections, timestamp)
                
                # Check occupancy for each seat zone
                for zone in request.seat_zones:
                    zone_box = [zone.x1, zone.y1, zone.x2, zone.y2]
                    
                    # Check if any person is in the seat zone
                    is_detected = False
                    detected_person_id = None
                    
                    for i, det in enumerate(normalized_detections):
                        overlap = self.vision_service.calculate_iou(det, zone_box)
                        if overlap > config.occupancy_threshold:
                            is_detected = True
                            if i < len(person_ids):
                                detected_person_id = person_ids[i]
                            break
                    
                    # Update session tracker
                    session = session_tracker.update(zone.seat_id, is_detected, timestamp)
                    
                    # Link person ID to session if tracking enabled
                    if session and detected_person_id:
                        session.person_id = detected_person_id
                        if person_tracker and detected_person_id in person_tracker.tracks:
                            person_tracker.tracks[detected_person_id].add_seat_interaction(zone.seat_id)
                
                processed_frames += 1
                
                # Draw annotations
                if video_writer:
                    annotated_frame = self._draw_annotations(
                        frame,
                        request.seat_zones,
                        normalized_detections,
                        session_tracker,
                        person_ids if person_tracker else None,
                        timestamp
                    )
                    video_writer.write(annotated_frame)
            
            # Cleanup
            cap.release()
            if video_writer:
                video_writer.release()
            
            # Finalize sessions
            seat_summaries = session_tracker.finalize(duration)
            
            # Get person tracking summaries
            person_tracking = None
            if person_tracker:
                person_tracking = person_tracker.get_summaries()
            
            # Build result
            processing_time = time.time() - start_time
            video_summary = VideoSummary(
                video_name=request.video_filename,
                duration_seconds=duration,
                fps=fps,
                total_frames=total_frames,
                processed_frames=processed_frames,
                skipped_frames=total_frames - processed_frames,
                analysis_mode=config.mode,
                processing_time_seconds=processing_time
            )
            
            result = VideoAnalysisResult(
                job_id=job_id,
                status="completed",
                video_summary=video_summary,
                seat_summaries=seat_summaries,
                person_tracking=person_tracking,
                annotated_video_path=str(output_path) if config.save_annotated_video else None
            )
            
            logger.info(f"Video analysis completed: {job_id}")
            return result
            
        except Exception as e:
            logger.error(f"Video analysis failed: {e}")
            return VideoAnalysisResult(
                job_id=job_id,
                status="failed",
                video_summary=VideoSummary(
                    video_name=request.video_filename,
                    duration_seconds=0,
                    fps=0,
                    total_frames=0,
                    processed_frames=0,
                    skipped_frames=0,
                    analysis_mode=config.mode,
                    processing_time_seconds=0
                ),
                seat_summaries=[],
                error=str(e)
            )
    
    def _normalize_detections(
        self,
        detections: List[List[float]],
        width: int,
        height: int
    ) -> List[List[float]]:
        """Ensure detections are normalized to 0-1 range"""
        normalized = []
        for det in detections:
            # YOLO returns normalized coordinates, but verify
            if det[0] <= 1 and det[1] <= 1 and det[2] <= 1 and det[3] <= 1:
                normalized.append(det)
            else:
                # Convert pixel coordinates to normalized
                normalized.append([
                    det[0] / width,
                    det[1] / height,
                    det[2] / width,
                    det[3] / height
                ])
        return normalized
    
    def _has_motion(self, prev_frame: np.ndarray, curr_frame: np.ndarray, threshold: float = 0.02) -> bool:
        """
        Simple motion detection using frame difference.
        CPU-optimized for the target hardware.
        """
        # Convert to grayscale
        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(curr_frame, cv2.COLOR_BGR2GRAY)
        
        # Calculate absolute difference
        diff = cv2.absdiff(prev_gray, curr_gray)
        
        # Threshold
        _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        
        # Calculate motion ratio
        motion_pixels = np.count_nonzero(thresh)
        total_pixels = thresh.shape[0] * thresh.shape[1]
        motion_ratio = motion_pixels / total_pixels
        
        return motion_ratio > threshold
    
    def _draw_annotations(
        self,
        frame: np.ndarray,
        seat_zones: List[SeatZone],
        detections: List[List[float]],
        session_tracker: SessionTracker,
        person_ids: Optional[List[str]],
        timestamp: float
    ) -> np.ndarray:
        """Draw annotations on frame for debugging"""
        annotated = frame.copy()
        height, width = frame.shape[:2]
        
        # Draw seat zones
        for zone in seat_zones:
            x1 = int(zone.x1 * width)
            y1 = int(zone.y1 * height)
            x2 = int(zone.x2 * width)
            y2 = int(zone.y2 * height)
            
            # Get current state
            state = session_tracker.get_current_state(zone.seat_id)
            color = (0, 255, 0) if state == "occupied" else (0, 0, 255)
            
            # Draw zone rectangle
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{zone.seat_id}: {state}"
            cv2.putText(
                annotated,
                label,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2
            )
        
        # Draw person bounding boxes
        for i, det in enumerate(detections):
            x1 = int(det[0] * width)
            y1 = int(det[1] * height)
            x2 = int(det[2] * width)
            y2 = int(det[3] * height)
            
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            # Draw person ID if tracking
            if person_ids and i < len(person_ids):
                cv2.putText(
                    annotated,
                    person_ids[i],
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 0, 0),
                    2
                )
        
        # Draw timestamp
        cv2.putText(
            annotated,
            f"Time: {timestamp:.1f}s",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )
        
        return annotated


class VideoAnalyzerFactory:
    """Factory for creating video analyzers"""
    
    @staticmethod
    def create(output_dir: str = "video_test_output") -> VideoAnalyzer:
        """Create a new video analyzer instance"""
        vision_service = VisionService(model_path="yolov8n.pt")
        return VideoAnalyzer(vision_service, output_dir)
