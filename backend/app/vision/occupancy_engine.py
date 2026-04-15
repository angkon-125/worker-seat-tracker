"""
Thin wrapper around the OccupancyEngine — now mostly delegates to CameraManager.
Kept for backward compatibility with existing API routes.
"""
import logging

logger = logging.getLogger(__name__)


class OccupancyEngine:
    """
    Legacy façade. The actual work is done by CameraWorker instances
    managed by CameraManager. This class is retained for any code that
    still references it directly.
    """

    def __init__(self):
        logger.info("OccupancyEngine initialized (delegates to CameraManager).")

    def stop(self):
        from app.services.camera_manager import camera_manager
        camera_manager.stop_all()
