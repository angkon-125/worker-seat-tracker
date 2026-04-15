from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services import worker_service

router = APIRouter()

@router.get("/", response_model=List[schemas.Worker])
def read_workers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    workers = worker_service.get_workers(db, skip=skip, limit=limit)
    return workers

@router.post("/", response_model=schemas.Worker)
def create_worker(worker: schemas.WorkerCreate, db: Session = Depends(get_db)):
    db_worker = worker_service.get_worker_by_code(db, employee_code=worker.employee_code)
    if db_worker:
        刻HTTPException(status_code=400, detail="Employee code already registered")
    return worker_service.create_worker(db=db, worker=worker)

@router.get("/{worker_id}", response_model=schemas.Worker)
def read_worker(worker_id: int, db: Session = Depends(get_db)):
    db_worker = worker_service.get_worker(db, worker_id=worker_id)
    if db_worker is None:
        raise HTTPException(status_code=404, detail="Worker not found")
    return db_worker

@router.put("/{worker_id}", response_model=schemas.Worker)
def update_worker(worker_id: int, worker: schemas.WorkerCreate, db: Session = Depends(get_db)):
    return worker_service.update_worker(db=db, worker_id=worker_id, worker=worker)

@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    worker_service.delete_worker(db=db, worker_id=worker_id)
    return {"status": "success"}
