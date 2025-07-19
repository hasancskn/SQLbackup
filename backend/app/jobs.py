from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from . import models, schemas
from typing import List

router = APIRouter()

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/databases")
def get_databases():
    return [
        {"name": "MySQL", "command": "mysqldump -u <user> -p<password> <db> > backup.sql"},
        {"name": "PostgreSQL", "command": "pg_dump -U <user> <db> > backup.sql"},
        {"name": "MSSQL", "command": "sqlcmd -S <server> -U <user> -P <password> -Q \"BACKUP DATABASE [<db>] TO DISK='backup.bak'\""},
        {"name": "MongoDB", "command": "mongodump --db <db> --out /backup/"}
    ]

@router.post("/jobs", response_model=schemas.Job)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = models.Job(
        name=job.name,
        db_type=job.db_type,
        host=job.host,
        port=job.port,
        username=job.username,
        password=job.password,
        db_name=job.db_name,
        schedule=job.schedule
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/jobs", response_model=List[schemas.Job])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).all()

@router.post("/jobs/{job_id}/backup", response_model=schemas.Backup)
def start_backup(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    backup = models.Backup(job_id=job_id, status="started")
    db.add(backup)
    db.commit()
    db.refresh(backup)
    return backup

@router.get("/backups", response_model=List[schemas.Backup])
def list_backups(db: Session = Depends(get_db)):
    return db.query(models.Backup).all()

@router.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"ok": True}

@router.put("/jobs/{job_id}", response_model=schemas.Job)
def update_job(job_id: int, job: schemas.JobCreate = Body(...), db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in job.dict().items():
        setattr(db_job, field, value)
    db.commit()
    db.refresh(db_job)
    return db_job 