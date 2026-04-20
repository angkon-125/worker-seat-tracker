from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Seat Schemas
class SeatBase(BaseModel):
    name: str
    x_min: float = Field(..., ge=0, le=1)
    y_min: float = Field(..., ge=0, le=1)
    x_max: float = Field(..., ge=0, le=1)
    y_max: float = Field(..., ge=0, le=1)

class SeatCreate(SeatBase):
    camera_id: int

class Seat(SeatBase):
    id: int
    camera_id: int
    is_occupied: bool
    last_updated: datetime

    class Config:
        from_attributes = True

# Camera Schemas
class CameraBase(BaseModel):
    name: str
    rtsp_url: str
    room_id: int
    is_active: bool = True

class CameraCreate(CameraBase):
    pass

class Camera(CameraBase):
    id: int
    last_heartbeat: Optional[datetime] = None
    seats: List[Seat] = []

    class Config:
        from_attributes = True

# Room Schemas
class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class Room(RoomBase):
    id: int
    created_at: datetime
    cameras: List[Camera] = []

    class Config:
        from_attributes = True

# Log Schemas
class OccupancyLog(BaseModel):
    id: int
    seat_id: int
    is_occupied: bool
    timestamp: datetime

    class Config:
        from_attributes = True

# Stats Schemas
class RoomStats(BaseModel):
    room_id: int
    room_name: str
    total_seats: int
    occupied_seats: int
    occupancy_rate: float
