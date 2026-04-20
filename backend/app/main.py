from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .api.routes import router
from .api.intelligence_routes import router as intelligence_router
from .services.camera_manager import camera_manager
from .models import Camera
import logging

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Workforce Intelligence System API",
    description="AI-powered occupancy analytics, behavioral intelligence, and workforce insights.",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core occupancy routes
app.include_router(router, prefix="/api")

# Intelligence engine routes (v1)
app.include_router(intelligence_router, prefix="/api/v1")

@app.on_event("startup")
def startup_event():
    logging.info("Starting up API and camera workers...")
    db = SessionLocal()
    try:
        # Automatically start workers for all active cameras
        cameras = db.query(Camera).filter(Camera.is_active == True).all()
        for cam in cameras:
            camera_manager.start_camera(cam.id)
    finally:
        db.close()

@app.on_event("shutdown")
def shutdown_event():
    logging.info("Shutting down API and stopping camera workers...")
    camera_manager.stop_all()

@app.get("/")
def read_root():
    return {
        "system": "Workforce Intelligence System",
        "message": "API is online — v2.0 with Intelligence Engine active",
        "status": "active",
        "modules": ["vision_pipeline", "behavior_analyzer", "pattern_engine", "alert_engine", "scoring_engine"],
        "vision_model": "YOLOv8n"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
