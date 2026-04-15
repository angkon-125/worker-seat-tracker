import threading
from typing import Dict, Optional, Any
from datetime import datetime

class StreamState:
    """
    Thread-safe in-memory store for camera worker health and telemetry.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._workers: Dict[int, Dict[str, Any]] = {}
                    cls._instance._store_lock = threading.Lock()
        return cls._instance

    def update_worker(self, camera_id: int, **kwargs):
        with self._store_lock:
            if camera_id not in self._workers:
                self._workers[camera_id] = {
                    "running": False,
                    "connected": False,
                    "reconnect_count": 0,
                    "last_error": None,
                    "last_frame_time": None,
                    "fps_estimate": 0.0,
                    "last_update": datetime.now()
                }
            self._workers[camera_id].update(kwargs)
            self._workers[camera_id]["last_update"] = datetime.now()

    def get_worker_status(self, camera_id: int) -> Optional[Dict[str, Any]]:
        with self._store_lock:
            return self._workers.get(camera_id)

    def get_all_statuses(self) -> Dict[int, Dict[str, Any]]:
        with self._store_lock:
            return self._workers.copy()

    def remove_worker(self, camera_id: int):
        with self._store_lock:
            if camera_id in self._workers:
                del self._workers[camera_id]

stream_state = StreamState()
