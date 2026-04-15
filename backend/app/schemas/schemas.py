from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any

# Worker Schemas
class WorkerBase(BaseModel):
    name: str
    employee_code: str
    department: Optional[str] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    assigned_seat_id: Optional[int] = None

class WorkerCreate(WorkerBase):
    pass

class Worker(WorkerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Seat Schemas
class SeatBase(BaseModel):
    seat_code: str
    camera_id: int
    zone_x: float
    zone_y: float
    zone_width: float
    zone_height: float

class SeatCreate(SeatBase):
    pass

class Seat(SeatBase):
    id: int
    is_occupied: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Camera Schemas
class CameraBase(BaseModel):
    name: str
    rtsp_url: str
    location: Optional[str] = None
    status: str = "inactive"

class CameraCreate(CameraBase):
    pass

class Camera(CameraBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# SeatSession Schemas
class SeatSessionBase(BaseModel):
    worker_id: Optional[int] = None
    seat_id: int
    camera_id: int
    status: str = "active"

class SeatSessionCreate(SeatSessionBase):
    start_time: Optional[datetime] = None

class SeatSession(SeatSessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# OccupancyEvent Schemas
class OccupancyEventBase(BaseModel):
    seat_id: int
    camera_id: int
    event_type: str
    meta_json: Optional[Any] = None

class OccupancyEvent(OccupancyEventBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Dashboard Stats
class DashboardStats(BaseModel):
    total_seats: int
    occupied_seats: int
    empty_seats: int
    active_cameras: int
