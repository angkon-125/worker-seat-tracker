from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    assigned_seat_id = Column(Integer, ForeignKey("seats.id"), nullable=True)
    department = Column(String, nullable=True)
    shift_start = Column(String, nullable=True) # "HH:MM"
    shift_end = Column(String, nullable=True)   # "HH:MM"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assigned_seat = relationship("Seat", back_populates="worker", uselist=False)
    sessions = relationship("SeatSession", back_populates="worker")

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    seat_code = Column(String(50), unique=True, index=True, nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    
    # Zone coordinates (normalized 0.0 to 1.0)
    zone_x = Column(Float, nullable=False)
    zone_y = Column(Float, nullable=False)
    zone_width = Column(Float, nullable=False)
    zone_height = Column(Float, nullable=False)
    
    is_occupied = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    camera = relationship("Camera", back_populates="seats")
    worker = relationship("Worker", back_populates="assigned_seat")
    sessions = relationship("SeatSession", back_populates="seat")
    events = relationship("OccupancyEvent", back_populates="seat")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rtsp_url = Column(String, nullable=False)
    location = Column(String, nullable=True)
    status = Column(String, default="inactive") # active, inactive, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seats = relationship("Seat", back_populates="camera")
    sessions = relationship("SeatSession", back_populates="camera")

class SeatSession(Base):
    __tablename__ = "seat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    status = Column(String, default="active") # active, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    worker = relationship("Worker", back_populates="sessions")
    seat = relationship("Seat", back_populates="sessions")
    camera = relationship("Camera", back_populates="sessions")

class OccupancyEvent(Base):
    __tablename__ = "occupancy_events"

    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    event_type = Column(String, nullable=False) # occupied, empty
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    meta_json = Column(JSON, nullable=True)

    seat = relationship("Seat", back_populates="events")
