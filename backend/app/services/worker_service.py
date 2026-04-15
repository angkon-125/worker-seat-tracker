from sqlalchemy.orm import Session
from app.models.models import Worker
from app.schemas.schemas import WorkerCreate

def get_workers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Worker).offset(skip).limit(limit).all()

def get_worker(db: Session, worker_id: int):
    return db.query(Worker).filter(Worker.id == worker_id).first()

def get_worker_by_code(db: Session, employee_code: str):
    return db.query(Worker).filter(Worker.employee_code == employee_code).first()

def create_worker(db: Session, worker: WorkerCreate):
    db_worker = Worker(**worker.dict())
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    return db_worker

def update_worker(db: Session, worker_id: int, worker: WorkerCreate):
    db_worker = get_worker(db, worker_id)
    if db_worker:
        for key, value in worker.dict().items():
            setattr(db_worker, key, value)
        db.commit()
        db.refresh(db_worker)
    return db_worker

def delete_worker(db: Session, worker_id: int):
    db_worker = get_worker(db, worker_id)
    if db_worker:
        db.delete(db_worker)
        db.commit()
    return db_worker
