# Video Test + Tracking Window Architecture

## Overview

The Video Test module is a **diagnostic and calibration window** into the Worker Seat Tracker system. It provides a way to test, validate, and calibrate the occupancy tracking logic using uploaded video files before deploying to live CCTV streams.

**Key Principle**: This module uses the **same core logic** as the live camera system, ensuring consistency between testing and production.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VIDEO TEST MODULE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  UPLOADED VIDEO                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │Frame Reader │───▶│Frame Skip   │───▶│   Resize    │───▶│   Motion    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    │   Gating    │   │
│                                                           └──────┬──────┘   │
│                                                                  │          │
│                                                                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   YOLOv8n   │◀───│  Optional   │    │ Zone Check  │───▶│  Occupancy  │   │
│  │   Person    │    │   Motion    │    │ (IoU-based) │    │State Machine│   │
│  │ Detection   │    │   Detect    │    └─────────────┘    └──────┬──────┘   │
│  └─────────────┘    └─────────────┘                              │          │
│                                                                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Session   │◀───│   Timing    │    │   Person    │    │  Annotated  │   │
│  │   Tracker   │    │ Calculation │    │  Tracker    │───▶│Video Output │   │
│  │             │    │             │    │ (Optional)  │    │             │   │
│  └──────┬──────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    STRUCTURED OUTPUT                            │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │       │
│  │  │ Seat Sessions│  │Person Tracks │  │  Annotated Video     │   │       │
│  │  │  (JSON/CSV)  │  │  (Optional)  │  │   (MP4 with overlay) │   │       │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         LIVE CAMERA WORKER (for comparison)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CAMERA STREAM                                                              │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │Frame Reader │───▶│Frame Skip   │───▶│   Resize    │───▶│   Motion    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    │   Gating    │   │
│                                                           └──────┬──────┘   │
│                                                                  │          │
│                                                                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   YOLOv8n   │◀───│  Optional   │    │ Zone Check  │───▶│  Occupancy  │   │
│  │   Person    │    │   Motion    │    │ (IoU-based) │    │State Machine│   │
│  │ Detection   │    │   Detect    │    └─────────────┘    └──────┬──────┘   │
│  └─────────────┘    └─────────────┘                              │          │
│                                                                  ▼          │
│                                                           ┌─────────────┐   │
│                                                           │   Runtime   │   │
│                                                           │    State    │   │
│                                                           │(OccupancyLog)│   │
│                                                           └──────┬──────┘   │
│                                                                  │          │
│                                                                  ▼          │
│                                                           ┌─────────────┐   │
│                                                           │   Events/   │   │
│                                                           │  Dashboard  │   │
│                                                           └─────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Video Analyzer (`analyzer.py`)

**Purpose**: Main pipeline orchestrating video analysis

**Pipeline Steps**:
1. **Frame Reading** - OpenCV VideoCapture with timestamp extraction
2. **Frame Skip** - Process every Nth frame (default: 6) for CPU efficiency
3. **Resize** - Downscale to 640x360 for faster processing
4. **Motion Gating** - Skip frames with no motion (optional, enabled by default)
5. **YOLOv8n Detection** - Person detection (class 0 only)
6. **Zone Check** - IoU-based overlap detection between person and seat zones
7. **State Machine** - Track occupancy state transitions
8. **Session Tracking** - Calculate start/end times and durations
9. **Person Tracking** - Optional centroid-based tracking
10. **Annotated Output** - Generate visualization video

**Key Design**:
```python
# Mirrors the live camera worker logic exactly
detections = vision_service.detect_people(frame)
occupancy_results = vision_service.check_occupancy(detections, seats)
session = session_tracker.update(seat_id, is_detected, timestamp)
```

---

### 2. Session Tracker (`session_tracker.py`)

**Purpose**: State machine for occupancy timing with debounce logic

**State Machine**:
```
                    ┌─────────────────┐
         ┌─────────▶│      EMPTY      │◀────────┐
         │          └────────┬────────┘         │
         │                   │ person detected  │
         │                   ▼                  │ no person
         │          ┌─────────────────┐         │ for exit_delay
         │          │ CONFIRMING_OCC  │─────────┘ seconds
         │          │ (confirmation   │
         │          │  frames)        │
         │          └────────┬────────┘
         │                   │ confirmation_frames
         │                   │ reached
         │                   ▼
         │          ┌─────────────────┐
         └──────────│    OCCUPIED     │◀────────┐
            person  └────────┬────────┘         │
            detected         │ no person        │ person
                             │ detected         │ detected
                             ▼                  │
                    ┌─────────────────┐         │
                    │ CONFIRMING_EMPTY│─────────┘
                    │ (exit_delay     │
                    │  seconds)       │
                    └─────────────────┘
```

**Configuration**:
- `confirmation_frames`: Frames needed to confirm occupancy (default: 2)
- `exit_delay_seconds`: Seconds before marking empty (default: 5)

**This prevents flickering** - a person briefly leaving the frame won't immediately mark the seat empty.

---

### 3. Person Tracker (`person_tracker.py`)

**Purpose**: Lightweight centroid-based tracking (optional, modular)

**Algorithm**:
1. Calculate centroids from bounding boxes: `cx = (x1 + x2) / 2, cy = (y1 + y2) / 2`
2. Match centroids between frames using Euclidean distance
3. Assign IDs (P1, P2, P3...)
4. Track path history and seat interactions

**CPU Optimizations**:
- Simple distance matching (no DeepSORT/ByteTrack by default)
- Configurable max_distance threshold (default: 0.15 normalized)
- Max age limit for track deletion (default: 30 frames)

**Usage Modes**:
- `SEAT_ONLY`: No person tracking, fastest
- `TEMPORARY_IDS`: Assign P1, P2 IDs, track seat interactions
- `SELECTED_TRACKING`: Track specific person of interest

---

### 4. Vision Service (`vision_service.py`)

**Shared between video test and live system**:

```python
class VisionService:
    def detect_people(self, frame) -> List[BoundingBox]
    def check_occupancy(self, detections, seats) -> Dict[seat_id, is_occupied]
    def calculate_iou(self, box1, box2) -> float  # Intersection over Union
```

**Key Logic**:
- IoU threshold determines occupancy (default: 0.4)
- If person box overlaps seat zone by >40% → seat is occupied
- YOLOv8n only, class 0 (person), CPU-optimized

---

## Analysis Modes

### Mode 1: SEAT_OCCUPANCY_ONLY (Default)
**Use Case**: Production testing, calibration, seat timing validation

**Features**:
- Zone-based occupancy detection only
- No person IDs assigned
- Fastest processing
- Recommended for Intel i5-8400 hardware

**Output**:
- Seat sessions (start_time, end_time, duration)
- Total occupied time per seat
- Occupancy rate percentage

---

### Mode 2: VIDEO_PERSON_TRACKING
**Use Case**: Debugging, path analysis, person-seat interaction study

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

---

### Mode 3: HYBRID_DEBUG
**Use Case**: Deep debugging, zone calibration, system validation

**Features**:
- All VIDEO_PERSON_TRACKING features
- Enhanced annotated video with:
  - Person bounding boxes (blue)
  - Seat zones (green=occupied, red=empty)
  - Person IDs overlay
  - Timestamp display
  - Session state labels

---

## API Endpoints

```
POST /api/v1/video-test/upload
  → Upload video file, get metadata

POST /api/v1/video-test/analyze
  → Start analysis job (async background task)
  Body: { video_filename, seat_zones[], config }

GET /api/v1/video-test/status/{job_id}
  → Poll job progress (0-100%)

GET /api/v1/video-test/result/{job_id}
  → Get complete analysis results

GET /api/v1/video-test/download/{job_id}
  → Download annotated video

DELETE /api/v1/video-test/jobs/{job_id}
  → Clean up job and files
```

---

## Frontend Components

```
app/dashboard/video-test/page.tsx
├── VideoUploadPanel.tsx       # Drag-drop upload, validation
├── ZoneEditorPanel.tsx        # Define/adjust seat zones
├── AnalysisControls.tsx       # Mode selection, tuning
├── VideoPreview.tsx           # Original + annotated playback
├── ResultsSummary.tsx         # Statistics overview
├── SessionTimeline.tsx        # Visual timeline of sessions
└── PersonTrackingPanel.tsx    # Person list, interactions
```

---

## CPU Optimization Strategy

**Hardware Target**: Intel i5-8400, 24GB RAM, Intel UHD 630 (no GPU)

| Setting | Default | Purpose |
|---------|---------|---------|
| YOLO Model | yolov8n.pt | Smallest, fastest |
| Frame Skip | 6 | Process 5fps from 30fps video |
| Resolution | 640x360 | Downscale for speed |
| Motion Gating | ON | Skip static frames |
| Person Tracking | OFF | Enable only when needed |
| Detection Class | 0 (person only) | Skip other classes |

**Performance Expectations**:
- 30-second video: ~10-15 seconds processing
- 5-minute video: ~2-3 minutes processing
- Live CCTV: 2-3 FPS detection is sufficient for occupancy

---

## Data Flow: Video Test vs Live System

### Video Test Flow
```
Video File → Analyzer → SessionTracker → JSON Results
                ↓
         PersonTracker (optional)
                ↓
         Annotated Video
```

### Live Camera Flow
```
RTSP Stream → CameraWorker → VisionService → Database
                  ↓
            Runtime State
                  ↓
            Dashboard/Events
```

**Shared Components**:
- `VisionService` - Same YOLO detection, same IoU logic
- `Zone Checking` - Same overlap calculation
- `State Machine Concept` - SessionTracker mirrors runtime logic

---

## Seat Zone Configuration

**Format** (normalized coordinates 0-1):
```json
{
  "seat_id": "A1",
  "x1": 0.1, "y1": 0.2,
  "x2": 0.3, "y2": 0.6,
  "label": "Desk A1"
}
```

**Preset Templates**:
- 3 Seats (Row): Side-by-side horizontal arrangement
- 4 Seats (2x2): Grid arrangement

**Calibration Workflow**:
1. Upload test video
2. Use HYBRID_DEBUG mode
3. Adjust zone coordinates visually
4. Run analysis, review annotated output
5. Export zone config for production use

---

## Extending to Live CCTV

The video test module is designed to be a **test harness** for the live system:

```python
# Video Test (now)
analyzer = VideoAnalyzerFactory.create()
result = analyzer.analyze("test.mp4", request)

# Live CCTV (future) - Same core logic
camera_worker = CameraWorker(camera_id)
camera_worker.start()  # Uses same VisionService, same zone checking
```

**Migration Path**:
1. Validate zones using video test
2. Export zone configuration
3. Apply to live camera in database
4. CameraWorker automatically uses same logic

---

## Configuration Reference

```python
# Video Test Config (VideoConfig schema)
{
  "mode": "seat_occupancy_only",  # or "video_person_tracking", "hybrid_debug"
  "frame_skip": 6,                 # Process every 6th frame
  "frame_width": 640,              # Processing resolution
  "frame_height": 360,
  "use_motion_gating": true,       # Skip static frames
  "occupancy_threshold": 0.4,     # IoU threshold (0-1)
  "confirmation_frames": 2,         # Frames to confirm occupancy
  "exit_delay_seconds": 5.0,      # Seconds before marking empty
  "enable_person_tracking": false, # Optional person IDs
  "save_annotated_video": true     # Generate MP4 output
}
```

---

## Output Format

### Session Summary (per seat)
```json
{
  "seat_id": "A1",
  "total_occupied_time_seconds": 125.5,
  "total_sessions": 3,
  "occupancy_rate": 41.8,
  "sessions": [
    {
      "session_id": "uuid",
      "start_time": 10.5,
      "end_time": 45.0,
      "duration_seconds": 34.5,
      "person_id": "P1"
    }
  ]
}
```

### Person Tracking (optional)
```json
{
  "person_id": "P1",
  "first_seen": 5.2,
  "last_seen": 120.0,
  "total_visible_time_seconds": 114.8,
  "seat_interactions": ["A1", "A2"],
  "path_points_count": 45
}
```

---

## Key Design Decisions

1. **YOLOv8n Only**: Smallest model for CPU inference
2. **No "Sitting" Detection**: YOLO doesn't detect sitting; we use zone occupancy
3. **Frame Skipping**: Essential for CPU performance
4. **Motion Gating**: Reduces unnecessary inference on static scenes
5. **IoU-based Occupancy**: Simple, effective zone-person overlap check
6. **State Machine**: Prevents flickering with debounce logic
7. **Modular Person Tracking**: Can be enabled/disabled per-analysis
8. **Same Logic as Live**: Ensures test results match production behavior

---

## Files Reference

### Backend
```
backend/app/video_test/
├── __init__.py           # Module exports
├── analyzer.py         # Main pipeline (378 lines)
├── session_tracker.py  # State machine & timing (223 lines)
├── person_tracker.py   # Centroid tracking (166 lines)
└── schemas.py          # Pydantic models (120 lines)

backend/app/api/routes_video_test.py  # API endpoints (274 lines)
backend/app/services/vision_service.py  # Shared detection logic (72 lines)
```

### Frontend
```
frontend/app/video-test/page.tsx           # Main page (314 lines)
frontend/components/video-test/
├── VideoUploadPanel.tsx      # Upload UI (189 lines)
├── ZoneEditorPanel.tsx       # Zone config (203 lines)
├── AnalysisControls.tsx      # Settings UI (170 lines)
├── VideoPreview.tsx          # Video player (128 lines)
├── ResultsSummary.tsx        # Stats display (169 lines)
├── SessionTimeline.tsx       # Timeline viz (90 lines)
└── PersonTrackingPanel.tsx   # Person list (new)

frontend/lib/video-test/types.ts  # TypeScript types (109 lines)
```

---

## Usage Example

```typescript
// Frontend: Start analysis
const request = {
  video_filename: "test_meeting.mp4",
  seat_zones: [
    { seat_id: "A1", x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.6 },
    { seat_id: "A2", x1: 0.35, y1: 0.2, x2: 0.55, y2: 0.6 }
  ],
  config: {
    mode: "seat_occupancy_only",
    frame_skip: 6,
    occupancy_threshold: 0.4,
    enable_person_tracking: false
  }
};

const response = await fetch('/api/v1/video-test/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});

const job = await response.json();
// Poll /api/v1/video-test/status/{job.job_id} until complete
```

---

## Summary

The Video Test + Tracking Window is a **production-grade diagnostic tool** that:

- ✅ Uses the **same core logic** as live CCTV workers
- ✅ Provides **calibration** via visual zone editing
- ✅ Supports **three analysis modes** (seat-only default, person tracking optional)
- ✅ Generates **annotated output** for debugging
- ✅ Outputs **structured session data** (JSON/CSV ready)
- ✅ Remains **CPU-friendly** for Intel i5-8400 hardware
- ✅ Acts as a **window into the entire system** for validation and testing
