from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    db_type = Column(String)
    host = Column(String)
    port = Column(Integer)
    username = Column(String)
    password = Column(String)
    db_name = Column(String)
    schedule = Column(String, default="manual")
    created_at = Column(DateTime, default=datetime.utcnow)
    backups = relationship("Backup", back_populates="job", cascade="all, delete-orphan")
    is_active = Column(Integer, default=1)  # 1: aktif, 0: pasif

class Backup(Base):
    __tablename__ = "backups"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    success = Column(Integer, default=1)  # 1: başarılı, 0: hata
    job = relationship("Job", back_populates="backups") 