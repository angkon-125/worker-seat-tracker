import os
import uuid
import cv2
from pathlib import Path
from typing import Dict, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import logging

from ..video_test.schemas import (
    VideoAnalysisRequest,
    VideoAnalysisResult,
    AnalysisJobStatus,
    VideoUploadResponse
)
from ..video_test.analyzer import VideoAnalyzerFactory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/video-test", tags=["video-test"])

# Storage directories
UPLOAD_DIR = Path("video_test_uploads")
OUTPUT_DIR = Path("video_test_output")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# In-memory job storage (in production, use Redis or database)
jobs: Dict[str, AnalysisJobStatus] = {}
videos: Dict[str, str] = {}  # filename -> path mapping


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for analysis.
    Supports common video formats: mp4, avi, mov, mkv
    """
    try:
        # Validate file extension
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        ext = file.filename.lower().split('.')[-1]
        allowed_extensions = ['mp4', 'avi', 'mov', 'mkv', 'webm']
        
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save uploaded file
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Get video metadata
        cap = cv2.VideoCapture(str(file_path))
        if not cap.isOpened():
            os.remove(file_path)
            raise HTTPException(status_code=400, detail="Cannot read video file")
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        cap.release()
        
        # Store video mapping
        videos[file.filename] = str(file_path)
        
        return VideoUploadResponse(
            success=True,
            filename=file.filename,
            video_path=str(file_path),
            duration=duration,
            fps=fps,
            total_frames=total_frames,
            resolution={"width": width, "height": height}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/analyze", response_model=AnalysisJobStatus)
async def analyze_video(request: VideoAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Start video analysis in background.
    Returns job ID for tracking progress.
    """
    try:
        # Get video path
        if request.video_filename not in videos:
            raise HTTPException(status_code=404, detail="Video not found. Upload first.")
        
        video_path = videos[request.video_filename]
        
        # Check if file exists
        if not Path(video_path).exists():
            raise HTTPException(status_code=404, detail="Video file not found on disk")
        
        # Create job
        job_id = str(uuid.uuid4())
        jobs[job_id] = AnalysisJobStatus(
            job_id=job_id,
            status="pending",
            progress=0,
            current_frame=0,
            total_frames=0
        )
        
        # Start background analysis
        background_tasks.add_task(
            run_analysis,
            job_id,
            video_path,
            request
        )
        
        return jobs[job_id]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis start failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis start failed: {str(e)}")


@router.get("/status/{job_id}", response_model=AnalysisJobStatus)
async def get_job_status(job_id: str):
    """
    Get status of an analysis job.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return jobs[job_id]


@router.get("/result/{job_id}", response_model=VideoAnalysisResult)
async def get_job_result(job_id: str):
    """
    Get full result of a completed analysis job.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    if job.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job not completed. Current status: {job.status}"
        )
    
    if not job.result:
        raise HTTPException(status_code=500, detail="Result not available")
    
    return job.result


@router.get("/download/{job_id}")
async def download_annotated_video(job_id: str):
    """
    Download annotated video output.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    if job.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job not completed. Current status: {job.status}"
        )
    
    if not job.result or not job.result.annotated_video_path:
        raise HTTPException(status_code=404, detail="Annotated video not available")
    
    video_path = Path(job.result.annotated_video_path)
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Annotated video file not found")
    
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"annotated_{job_id}.mp4"
    )


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its associated files.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    # Delete annotated video if exists
    if job.result and job.result.annotated_video_path:
        video_path = Path(job.result.annotated_video_path)
        if video_path.exists():
            try:
                os.remove(video_path)
            except Exception as e:
                logger.warning(f"Failed to delete annotated video: {e}")
    
    # Delete job
    del jobs[job_id]
    
    return {"message": "Job deleted successfully"}


async def run_analysis(job_id: str, video_path: str, request: VideoAnalysisRequest):
    """
    Background task to run video analysis.
    """
    try:
        # Update job status
        jobs[job_id].status = "processing"
        jobs[job_id].message = "Initializing analyzer..."
        
        # Create analyzer
        analyzer = VideoAnalyzerFactory.create(output_dir=str(OUTPUT_DIR))
        
        # Progress callback
        def progress_callback(current_frame: int, total_frames: int):
            if job_id in jobs:
                jobs[job_id].current_frame = current_frame
                jobs[job_id].total_frames = total_frames
                jobs[job_id].progress = (current_frame / total_frames) * 100 if total_frames > 0 else 0
                jobs[job_id].message = f"Processing frame {current_frame}/{total_frames}"
        
        # Run analysis
        result = analyzer.analyze(
            video_path,
            request,
            progress_callback=progress_callback
        )
        
        # Update job with result
        if job_id in jobs:
            jobs[job_id].status = result.status
            jobs[job_id].progress = 100
            jobs[job_id].result = result
            jobs[job_id].message = "Analysis completed" if result.status == "completed" else "Analysis failed"
            
            if result.status == "completed":
                from datetime import datetime
                jobs[job_id].completed_at = datetime.utcnow()
        
        logger.info(f"Job {job_id} completed with status: {result.status}")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        if job_id in jobs:
            jobs[job_id].status = "failed"
            jobs[job_id].message = f"Analysis failed: {str(e)}"
            jobs[job_id].progress = 0
