import time
from typing import Dict, Optional
from app.core.config import settings

class OccupancyStatemachine:
    """
    Handles the debounce and confirmation logic for a single seat's occupancy.
    
    Rules:
    - confirm_frames: Consecutive frames a person is detected in zone to flip to "occupied".
    - exit_delay: Seconds without detection before flipping back to "empty".
    """
    
    def __init__(self, seat_id: int):
        self.seat_id = seat_id
        self.no_person_since: Optional[float] = None
        self.confirm_count = 0
        
    def process_detection(self, is_person_present: bool, current_is_occupied: bool) -> Optional[bool]:
        """
        Process a new detection flag and return the new state if it changed.
        Returns None if state remains the same.
        """
        current_time = time.time()
        
        if is_person_present:
            self.no_person_since = None
            self.confirm_count += 1
            
            # Transition to OCCUPIED
            if not current_is_occupied and self.confirm_count >= settings.OCCUPIED_CONFIRM_FRAMES:
                self.confirm_count = 0
                return True
        else:
            self.confirm_count = 0
            
            # Transition to EMPTY
            if current_is_occupied:
                if self.no_person_since is None:
                    self.no_person_since = current_time
                elif current_time - self.no_person_since >= settings.SEAT_EXIT_DELAY_SECONDS:
                    self.no_person_since = None
                    return False
                    
        return None
