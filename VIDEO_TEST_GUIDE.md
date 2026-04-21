# Video Test Module - User Guide

## Overview

The Video Test + Tracking Window is a diagnostic and calibration tool for the Worker Seat Tracker system. It allows you to upload recorded videos, test occupancy tracking with the same logic used in live CCTV streams, and calibrate seat zones before deployment.

## Quick Start

### 1. Access the Video Test Page

Navigate to the dashboard and click **"Video Test"** in the navigation sidebar.

### 2. Upload a Video

- Drag and drop a video file into the upload area, or click to browse
- Supported formats: MP4, AVI, MOV, MKV, WebM
- The video will be uploaded to the backend for processing

### 3. Configure Seat Zones

- Use the **Seat Zones** panel to define where seats are in the video
- Click **"Quick Presets"** for common layouts:
  - **3 Seats (Row)**: Horizontal arrangement
  - **4 Seats (2x2)**: Grid arrangement
- Adjust coordinates manually using the input fields
- Coordinates are normalized (0.0 to 1.0):
  - `x1, y1`: Top-left corner
  - `x2, y2`: Bottom-right corner

### 4. Configure Analysis Settings

- **Analysis Mode**:
  - **Seat Only**: Fastest, zone occupancy only (recommended for CPU)
  - **Person Tracking**: Assigns temporary IDs (P1, P2...)
  - **Hybrid Debug**: Full debug with overlays
  
- **Frame Skip**: Process every Nth frame (default: 6)
  - Higher = faster but less accurate
  - Lower = slower but more accurate
  
- **Occupancy Threshold**: IoU threshold (default: 0.4)
  - How much overlap needed to count as occupied
  - Lower = more lenient, Higher = stricter
  
- **Toggle Options**:
  - **Enable Person Tracking**: Assign IDs to detected people
  - **Save Annotated Video**: Generate MP4 with overlays

### 5. Start Analysis

Click **"Start Analysis"** to begin. Progress will be shown in real-time.

### 6. Review Results

After analysis completes, you'll see:

- **Analysis Results**: Video summary, overall statistics
- **Session Timeline**: Visual timeline of occupancy per seat
- **Person Tracking**: List of detected people with interactions
- **Annotated Video**: Download and view the processed video

---

## Analysis Modes Explained

### SEAT_OCCUPANCY_ONLY (Default)

**Best for**: Production testing, calibration, seat timing validation

**Features**:
- Zone-based occupancy detection only
- No person IDs assigned
- Fastest processing
- Recommended for Intel i5-8400 hardware

**Output**:
- Seat sessions (start_time, end_time, duration)
- Total occupied time per seat
- Occupancy rate percentage

**Use when**:
- You only care about seat occupancy
- CPU performance is critical
- Testing zone configurations

---

### VIDEO_PERSON_TRACKING

**Best for**: Debugging, path analysis, person-seat interaction study

**Features**:
- Assigns temporary IDs (P1, P2...)
- Tracks person path across video
- Records which seats each person used
- Slightly slower but still CPU-friendly

**Output**:
- All SEAT_OCCUPANCY_ONLY outputs PLUS
- Person tracking summaries
- Seat interactions per person
- Path point counts

**Use when**:
- You want to track individual people
- Debugging detection issues
- Analyzing movement patterns

---

### HYBRID_DEBUG

**Best for**: Deep debugging, zone calibration, system validation

**Features**:
- All VIDEO_PERSON_TRACKING features
- Enhanced annotated video with:
  - Person bounding boxes (blue)
  - Seat zones (green=occupied, red=empty)
  - Person IDs overlay
  - Timestamp display
  - Session state labels

**Output**:
- Maximum detail for debugging
- Visual verification of detection

**Use when**:
- Calibrating seat zones
- Debugging detection logic
- Validating system behavior

---

## Zone Calibration Workflow

### Step 1: Upload Test Video

Choose a video that shows typical occupancy scenarios.

### Step 2: Use HYBRID_DEBUG Mode

This mode provides the most visual feedback.

### Step 3: Run Initial Analysis

Use default zones or a quick preset.

### Step 4: Review Annotated Video

- Download the annotated video
- Check if zones align with actual seat positions
- Verify detection boxes overlap correctly

### Step 5: Adjust Zone Coordinates

- If zones are misaligned, adjust `x1, y1, x2, y2` values
- Re-run analysis
- Iterate until satisfied

### Step 6: Export Zone Config

Once calibrated, save the zone configuration for use in live cameras.

---

## Understanding the Output

### Video Summary

```
Duration: 5m 30s
Processed Frames: 450
Processing Time: 12s
FPS: 30
```

### Seat Breakdown

For each seat:
- **Sessions**: Number of separate occupancy periods
- **Occupied Time**: Total time seat was occupied
- **Occupancy Rate**: Percentage of video duration

### Session Timeline

Visual representation of when seats were occupied:
- **Purple bars**: Occupied periods
- **Empty space**: Vacant periods
- **Green bars** (when person selected): Selected person's sessions

### Person Tracking

When enabled, shows:
- **Person ID**: Temporary ID (P1, P2...)
- **Visible Time**: Total time person was detected
- **Seat Interactions**: Which seats this person used
- **Path Points**: Number of detection points

---

## CPU Performance Tips

For Intel i5-8400, 24GB RAM, no GPU:

### Recommended Settings
- **Frame Skip**: 6 (process 5fps from 30fps video)
- **Resolution**: 640x360 (downscale for speed)
- **Motion Gating**: ON (skip static frames)
- **Person Tracking**: OFF (enable only when needed)
- **Mode**: SEAT_OCCUPANCY_ONLY

### Expected Performance
- 30-second video: ~10-15 seconds processing
- 5-minute video: ~2-3 minutes processing
- Live CCTV: 2-3 FPS detection is sufficient

### If Performance is Slow
1. Increase **Frame Skip** to 8-10
2. Disable **Person Tracking**
3. Disable **Motion Gating** if scene is very dynamic
4. Use **SEAT_OCCUPANCY_ONLY** mode

---

## Troubleshooting

### "Video not found" Error

**Cause**: Video upload failed or was deleted

**Solution**: Re-upload the video file

### Analysis Stuck at "Processing"

**Cause**: Backend issue or video corruption

**Solution**: 
- Check backend logs
- Try a different video file
- Reduce video length

### Zones Not Detecting Occupancy

**Cause**: Zone coordinates incorrect or threshold too high

**Solution**:
1. Lower **Occupancy Threshold** to 0.3
2. Use **HYBRID_DEBUG** mode to see detection boxes
3. Adjust zone coordinates to better align with seats

### Person Tracking Not Working

**Cause**: Person tracking disabled or mode not set correctly

**Solution**:
1. Ensure **Enable Person Tracking** is ON
2. Use **VIDEO_PERSON_TRACKING** or **HYBRID_DEBUG** mode
3. Check if people are actually being detected (view annotated video)

---

## Exporting Results

### Download Annotated Video

Click the **"Annotated Video"** button in the results panel to download the MP4 with overlays.

### JSON Results

The complete analysis results are available via API:
```
GET /api/v1/video-test/result/{job_id}
```

### Session Data

Session data includes:
- Session ID
- Start timestamp
- End timestamp
- Duration
- Person ID (if tracking enabled)

---

## Integration with Live System

The video test module uses the **same core logic** as the live camera system:

### Shared Components
- **VisionService**: Same YOLOv8n detection
- **Zone Checking**: Same IoU-based overlap calculation
- **State Machine**: Same occupancy logic

### Calibration to Production Workflow

1. Calibrate zones using video test
2. Export zone configuration
3. Add zones to live camera in database
4. CameraWorker automatically uses same logic

This ensures that test results match production behavior.

---

## API Reference

### Upload Video
```http
POST /api/v1/video-test/upload
Content-Type: multipart/form-data

Body: file (video file)
```

### Start Analysis
```http
POST /api/v1/video-test/analyze
Content-Type: application/json

{
  "video_filename": "test.mp4",
  "seat_zones": [
    {
      "seat_id": "A1",
      "x1": 0.1, "y1": 0.2,
      "x2": 0.3, "y2": 0.6
    }
  ],
  "config": {
    "mode": "seat_occupancy_only",
    "frame_skip": 6,
    "occupancy_threshold": 0.4,
    "enable_person_tracking": false,
    "save_annotated_video": true
  }
}
```

### Check Status
```http
GET /api/v1/video-test/status/{job_id}
```

### Get Results
```http
GET /api/v1/video-test/result/{job_id}
```

### Download Annotated Video
```http
GET /api/v1/video-test/download/{job_id}
```

### Delete Job
```http
DELETE /api/v1/video-test/jobs/{job_id}
```

---

## Best Practices

1. **Start with SEAT_OCCUPANCY_ONLY** mode for initial testing
2. **Use HYBRID_DEBUG** when calibrating zones
3. **Keep videos under 10 minutes** for faster processing
4. **Use representative test videos** that show typical scenarios
5. **Verify with annotated output** before trusting results
6. **Save zone configurations** for reuse across videos
7. **Monitor CPU usage** if processing multiple videos

---

## Limitations

- **YOLO doesn't detect "sitting"**: We use zone occupancy instead
- **Person tracking is lightweight**: Not designed for complex occlusion
- **CPU-only processing**: No GPU acceleration
- **No real-time preview**: Must run full analysis to see results
- **Zone coordinates are manual**: No visual drawing tool (yet)

---

## Future Enhancements

- [ ] Visual zone editor (draw on video frame)
- [ ] Real-time preview during analysis
- [ ] CSV export of session data
- [ ] Batch video processing
- [ ] Zone templates save/load
- [ ] Advanced person tracking (ByteTrack)
