import time
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from .schemas import OccupancySession, SeatSummary


class SessionTracker:
    """
    Tracks occupancy sessions for seat zones with debounce and timing logic.
    Mirrors the occupancy logic used in the live camera worker system.
    """
    
    def __init__(self, confirmation_frames: int = 2, exit_delay_seconds: float = 5.0):
        """
        Args:
            confirmation_frames: Number of consecutive detections before marking occupied
            exit_delay_seconds: Delay in seconds before marking seat as empty
        """
        self.confirmation_frames = confirmation_frames
        self.exit_delay_seconds = exit_delay_seconds
        
        # State tracking per seat
        self.seat_states: Dict[str, 'SeatState'] = {}
    
    def update(self, seat_id: str, is_detected: bool, timestamp: float) -> Optional[OccupancySession]:
        """
        Update occupancy state for a seat based on detection.
        
        Args:
            seat_id: Seat identifier
            is_detected: Whether a person was detected in the seat zone
            timestamp: Video timestamp in seconds
            
        Returns:
            OccupancySession if a session ended, None otherwise
        """
        if seat_id not in self.seat_states:
            self.seat_states[seat_id] = SeatState(seat_id)
        
        return self.seat_states[seat_id].update(
            is_detected, 
            timestamp, 
            self.confirmation_frames, 
            self.exit_delay_seconds
        )
    
    def finalize(self, video_duration: float) -> List[SeatSummary]:
        """
        Finalize all sessions and generate summaries.
        
        Args:
            video_duration: Total video duration in seconds
            
        Returns:
            List of seat summaries with sessions
        """
        summaries = []
        
        for seat_id, state in self.seat_states.items():
            # Close any open sessions
            closed_session = state.close(video_duration)
            
            total_occupied_time = sum(
                s.duration_seconds for s in state.sessions if s.duration_seconds
            )
            
            occupancy_rate = (total_occupied_time / video_duration * 100) if video_duration > 0 else 0
            
            summary = SeatSummary(
                seat_id=seat_id,
                total_occupied_time_seconds=total_occupied_time,
                total_sessions=len(state.sessions),
                sessions=state.sessions,
                occupancy_rate=occupancy_rate
            )
            summaries.append(summary)
        
        return summaries
    
    def get_current_state(self, seat_id: str) -> Optional[str]:
        """Get current occupancy state for a seat"""
        if seat_id not in self.seat_states:
            return None
        return self.seat_states[seat_id].current_state


class SeatState:
    """State machine for a single seat's occupancy tracking"""
    
    def __init__(self, seat_id: str):
        self.seat_id = seat_id
        self.current_state = "empty"  # "empty", "confirming_occupied", "occupied", "confirming_empty"
        self.sessions: List[OccupancySession] = []
        self.current_session: Optional[OccupancySession] = None
        self.confirmation_count = 0
        self.empty_since: Optional[float] = None
    
    def update(
        self, 
        is_detected: bool, 
        timestamp: float, 
        confirmation_frames: int, 
        exit_delay_seconds: float
    ) -> Optional[OccupancySession]:
        """
        Update state based on detection. Returns session if one ends.
        """
        if is_detected:
            # Person detected
            self.empty_since = None
            
            if self.current_state == "empty":
                # Start confirmation
                self.current_state = "confirming_occupied"
                self.confirmation_count = 1
            
            elif self.current_state == "confirming_occupied":
                self.confirmation_count += 1
                if self.confirmation_count >= confirmation_frames:
                    # Confirmed occupied
                    self.current_state = "occupied"
                    self.current_session = OccupancySession(
                        session_id=str(uuid.uuid4()),
                        start_time=timestamp,
                        person_id=None
                    )
            
            elif self.current_state == "confirming_empty":
                # Person returned during exit delay, cancel exit
                self.current_state = "occupied"
                self.empty_since = None
        
        else:
            # No person detected
            if self.current_state == "occupied":
                # Start exit delay
                self.current_state = "confirming_empty"
                self.empty_since = timestamp
            
            elif self.current_state == "confirming_empty":
                if self.empty_since and (timestamp - self.empty_since) >= exit_delay_seconds:
                    # Exit delay passed, mark as empty
                    self.current_state = "empty"
                    if self.current_session:
                        # Close the session
                        self.current_session.end_time = timestamp
                        self.current_session.duration_seconds = timestamp - self.current_session.start_time
                        self.sessions.append(self.current_session)
                        closed_session = self.current_session
                        self.current_session = None
                        return closed_session
            
            elif self.current_state == "confirming_occupied":
                # Detection lost during confirmation
                self.current_state = "empty"
                self.confirmation_count = 0
        
        return None
    
    def close(self, timestamp: float) -> Optional[OccupancySession]:
        """Close any open session and return it"""
        if self.current_session:
            self.current_session.end_time = timestamp
            self.current_session.duration_seconds = timestamp - self.current_session.start_time
            self.sessions.append(self.current_session)
            closed = self.current_session
            self.current_session = None
            return closed
        return None


class SessionAggregator:
    """Aggregates session data for reporting"""
    
    @staticmethod
    def format_duration(seconds: float) -> str:
        """Format seconds to human-readable string"""
        if seconds < 60:
            return f"{seconds:.1f}s"
        elif seconds < 3600:
            minutes = seconds / 60
            return f"{minutes:.1f}m"
        else:
            hours = seconds / 3600
            return f"{hours:.1f}h"
    
    @staticmethod
    def get_session_timeline(seat_summaries: List[SeatSummary]) -> Dict[str, List[Dict]]:
        """
        Generate timeline data for visualization.
        
        Returns:
            Dict mapping seat_id to list of session dicts
        """
        timeline = {}
        for summary in seat_summaries:
            timeline[summary.seat_id] = [
                {
                    "start": session.start_time,
                    "end": session.end_time,
                    "duration": session.duration_seconds,
                    "person_id": session.person_id
                }
                for session in summary.sessions
            ]
        return timeline
    
    @staticmethod
    def get_overall_stats(seat_summaries: List[SeatSummary], video_duration: float) -> Dict:
        """Calculate overall statistics across all seats"""
        total_sessions = sum(s.total_sessions for s in seat_summaries)
        total_occupied_time = sum(s.total_occupied_time_seconds for s in seat_summaries)
        avg_occupancy_rate = sum(s.occupancy_rate or 0 for s in seat_summaries) / len(seat_summaries) if seat_summaries else 0
        
        return {
            "total_seats": len(seat_summaries),
            "total_sessions": total_sessions,
            "total_occupied_time_seconds": total_occupied_time,
            "overall_occupancy_rate": avg_occupancy_rate,
            "avg_session_duration": total_occupied_time / total_sessions if total_sessions > 0 else 0
        }
