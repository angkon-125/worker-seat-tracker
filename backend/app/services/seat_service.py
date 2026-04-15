from sqlalchemy.orm import Session
from app.models.models import Seat
from app.schemas.schemas import SeatCreate

def get_seats(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Seat).offset(skip).limit(limit).all()

def get_seat(db: Session, seat_id: int):
    return db.query(Seat).filter(Seat.id == seat_id).first()

def get_seats_by_camera(db: Session, camera_id: int):
    return db.query(Seat).filter(Seat.camera_id == camera_id).all()

def create_seat(db: Session, seat: SeatCreate):
    db_seat = Seat(**seat.dict())
    db.add(db_seat)
    db.commit()
    db.refresh(db_seat)
    return db_seat

def update_seat(db: Session, seat_id: int, seat: SeatCreate):
    db_seat = get_seat(db, seat_id)
    if db_seat:
        for key, value in seat.dict().items():
            setattr(db_seat, key, value)
        db.commit()
        db.refresh(db_seat)
    return db_seat

def delete_seat(db: Session, seat_id: int):
    db_seat = get_seat(db, seat_id)
    if db_seat:
        db.delete(db_seat)
        db.commit()
    return db_seat

def update_seat_occupancy(db: Session, seat_id: int, is_occupied: bool):
    db_seat = get_seat(db, seat_id)
    if db_seat:
        db_seat.is_occupied = is_occupied
        db.commit()
        db.refresh(db_seat)
    return db_seat
