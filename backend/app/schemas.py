from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class JobBase(BaseModel):
    name: str
    db_type: str
    host: str
    port: int
    username: str
    password: str
    db_name: str
    schedule: str = "manual"

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class BackupBase(BaseModel):
    job_id: int
    status: str

class Backup(BackupBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True 