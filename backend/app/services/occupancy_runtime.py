import threading
import time
from typing import Dict, Optional, Any

class OccupancyRuntime:
    """
    Thread-safe in-memory store for live seat occupancy status.
    Single source of truth for the real-time API.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._seats: Dict[int, Dict[str, Any]] = {}
                    cls._instance._store_lock = threading.Lock()
        return cls._instance

    def initialize_seat(self, seat_id: int, seat_code: str, camera_id: int, is_occupied: bool = False):
        with self._store_lock:
            self._seats[seat_id] = {
                "seat_code": seat_code,
                "camera_id": camera_id,
                "is_occupied": is_occupied,
                "since": time.time(),
            }

    def update_occupancy(self, seat_id: int, is_occupied: bool):
        with self._store_lock:
            if seat_id in self._seats:
                if self._seats[seat_id]["is_occupied"] != is_occupied:
                    self._seats[seat_id]["is_occupied"] = is_occupied
                    self._seats[seat_id]["since"] = time.time()

    def get_snapshot(self) -> Dict[int, Dict[str, Any]]:
        now = time.time()
        with self._store_lock:
            return {
                sid: {
                    **data,
                    "live_duration_seconds": int(now - data["since"])
                }
                for sid, data in self._seats.items()
            }

occupancy_runtime = OccupancyRuntime()
