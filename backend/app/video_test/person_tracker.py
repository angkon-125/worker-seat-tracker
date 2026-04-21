import numpy as np
from typing import Dict, List, Optional, Tuple
import uuid
from .schemas import PersonTracking


class CentroidTracker:
    """
    Lightweight centroid-based person tracker for video analysis.
    Uses simple Euclidean distance matching between frames.
    CPU-optimized for the target hardware (Intel i5-8400, no GPU).
    """
    
    def __init__(self, max_distance: float = 0.15, max_age: int = 30):
        """
        Args:
            max_distance: Maximum normalized distance (0-1) to match centroids
            max_age: Maximum frames a track can be missing before deletion
        """
        self.max_distance = max_distance
        self.max_age = max_age
        self.next_id = 1
        self.tracks: Dict[str, 'PersonTrack'] = {}
    
    def update(self, detections: List[List[float]], timestamp: float) -> List[str]:
        """
        Update tracker with new detections.
        
        Args:
            detections: List of bounding boxes [x1, y1, x2, y2] (normalized)
            timestamp: Video timestamp in seconds
            
        Returns:
            List of person IDs corresponding to detections
        """
        # Calculate centroids for new detections
        centroids = self._calculate_centroids(detections)
        
        # Initialize result list
        person_ids = []
        
        # Update existing tracks
        for person_id, track in list(self.tracks.items()):
            track.age += 1
            
            # Find best match
            best_match_idx = None
            best_distance = float('inf')
            
            for idx, centroid in enumerate(centroids):
                if idx in person_ids:
                    continue  # Already matched
                
                distance = self._euclidean_distance(centroid, track.last_centroid)
                if distance < self.max_distance and distance < best_distance:
                    best_distance = distance
                    best_match_idx = idx
            
            if best_match_idx is not None:
                # Update track
                track.update(centroids[best_match_idx], detections[best_match_idx], timestamp)
                track.age = 0
                person_ids.append(person_id)
            elif track.age > self.max_age:
                # Delete old track
                del self.tracks[person_id]
        
        # Create new tracks for unmatched detections
        for idx, (centroid, detection) in enumerate(zip(centroids, detections)):
            if idx not in person_ids:
                person_id = f"P{self.next_id}"
                self.next_id += 1
                
                self.tracks[person_id] = PersonTrack(
                    person_id=person_id,
                    centroid=centroid,
                    bbox=detection,
                    first_seen=timestamp
                )
                person_ids.append(person_id)
        
        # Reorder IDs to match detection order
        id_map = {det_idx: pid for det_idx, pid in enumerate(person_ids)}
        result_ids = [id_map.get(i, "") for i in range(len(detections))]
        
        return result_ids
    
    def _calculate_centroids(self, detections: List[List[float]]) -> List[Tuple[float, float]]:
        """Calculate centroids from bounding boxes"""
        centroids = []
        for det in detections:
            x1, y1, x2, y2 = det
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            centroids.append((cx, cy))
        return centroids
    
    def _euclidean_distance(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        """Calculate Euclidean distance between two points"""
        return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
    
    def get_summaries(self) -> List[PersonTracking]:
        """Get tracking summaries for all persons"""
        summaries = []
        for track in self.tracks.values():
            total_visible = track.last_seen - track.first_seen
            
            summary = PersonTracking(
                person_id=track.person_id,
                first_seen=track.first_seen,
                last_seen=track.last_seen,
                total_visible_time_seconds=total_visible,
                seat_interactions=track.seat_interactions,
                path_points_count=len(track.path)
            )
            summaries.append(summary)
        
        return summaries
    
    def get_person_path(self, person_id: str) -> List[Tuple[float, float]]:
        """Get path history for a specific person"""
        if person_id in self.tracks:
            return self.tracks[person_id].path
        return []


class PersonTrack:
    """Track data for a single person"""
    
    def __init__(self, person_id: str, centroid: Tuple[float, float], bbox: List[float], first_seen: float):
        self.person_id = person_id
        self.first_seen = first_seen
        self.last_seen = first_seen
        self.last_centroid = centroid
        self.path: List[Tuple[float, float]] = [centroid]
        self.bboxes: List[List[float]] = [bbox]
        self.age = 0
        self.seat_interactions: List[str] = []  # Seat IDs this person occupied
    
    def update(self, centroid: Tuple[float, float], bbox: List[float], timestamp: float):
        """Update track with new detection"""
        self.last_centroid = centroid
        self.last_seen = timestamp
        self.path.append(centroid)
        self.bboxes.append(bbox)
    
    def add_seat_interaction(self, seat_id: str):
        """Record a seat interaction"""
        if seat_id not in self.seat_interactions:
            self.seat_interactions.append(seat_id)


class PersonTrackerMode:
    """
    Modes for person tracking in video analysis.
    """
    
    SEAT_ONLY = "seat_only"  # No person tracking, just zone occupancy
    TEMPORARY_IDS = "temporary_ids"  # Assign temporary IDs like P1, P2
    SELECTED_TRACKING = "selected_tracking"  # Track selected person of interest
    
    @staticmethod
    def is_enabled(mode: str) -> bool:
        """Check if person tracking is enabled for a mode"""
        return mode in [PersonTrackerMode.TEMPORARY_IDS, PersonTrackerMode.SELECTED_TRACKING]
