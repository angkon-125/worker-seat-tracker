from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import workers, seats, cameras, routes_cameras, routes_runtime
from app.core.config import settings
from app.core.database import engine, Base

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan: startup and graceful shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    - Startup: create DB tables, initialize state store, auto-start active cameras.
    - Shutdown: stop all camera workers cleanly.
    """
    # Create all tables (idempotent — safe to call every startup)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created.")

    # Import here to avoid circular imports at module level
    from app.services.camera_manager import camera_manager
    from app.core.database import SessionLocal
    from app.services.occupancy_runtime import occupancy_runtime
    from app.models.models import Seat

    # Pre-populate occupancy runtime with all seats from DB
    db = SessionLocal()
    try:
        all_seats = db.query(Seat).all()
        for s in all_seats:
            occupancy_runtime.initialize_seat(s.id, s.seat_code, s.camera_id, s.is_occupied)
        logger.info(f"Occupancy runtime initialized with {len(all_seats)} seat(s).")

        # Auto-start cameras marked 'active' in the DB (managed by Manager)
        camera_manager.start_all_active(db)
    finally:
        db.close()

    logger.info(f"✅ {settings.APP_NAME} is ready.")
    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down — stopping all camera workers...")
    camera_manager.stop_all()
    logger.info("All workers stopped. Goodbye.")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# New Production Routing
app.include_router(routes_runtime.router, prefix=settings.API_V1_STR)
app.include_router(routes_cameras.router, prefix=settings.API_V1_STR)

# Legacy/Management Routing
app.include_router(workers.router, prefix=f"{settings.API_V1_STR}/workers", tags=["Workers"])
app.include_router(seats.router,   prefix=f"{settings.API_V1_STR}/seats",   tags=["Seats"])
app.include_router(cameras.router, prefix=f"{settings.API_V1_STR}/cameras", tags=["Cameras"])


@app.get("/health")
def health_check():
    from app.services.camera_manager import camera_manager
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "active_cameras": camera_manager.running_count(),
        "max_cameras": settings.MAX_CAMERAS,
    }
