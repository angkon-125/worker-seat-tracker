from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services import seat_service, occupancy_service

router = APIRouter()

@router.get("/", response_model=List[schemas.Seat])
def read_seats(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    seats = seat_service.get_seats(db, skip=skip, limit=limit)
    return seats

@router.post("/", response_model=schemas.Seat)
def create_seat(seat: schemas.SeatCreate, db: Session = Depends(get_db)):
    return seat_service.create_seat(db=db, seat=seat)

@router.get("/{seat_id}", response_model=schemas.Seat)
def read_seat(seat_id: int, db: Session = Depends(get_db)):
    db_seat = seat_service.get_seat(db, seat_id=seat_id)
    if db_seat is None:
        raise HTTPException(status_code=404, detail="Seat not found")
    return db_seat

@router.put("/{seat_id}", response_model=schemas.Seat)
def update_seat(seat_id: int, seat: schemas.SeatCreate, db: Session = Depends(get_db)):
    return seat_service.update_seat(db=db, seat_id=seat_id, seat=seat)

@router.post("/{seat_id}/occupancy")
def trigger_occupancy(seat_id: int, is_occupied: bool, db: Session = Depends(get_db)):
    """
    Manual override or test endpoint for occupancy logic.
    """
    seat = occupancy_service.handle_seat_state_change(db, seat_id, is_occupied)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return {"status": "success", "is_occupied": is_occupied}
