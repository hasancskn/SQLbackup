from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from . import models, schemas
from typing import List
from fastapi.responses import FileResponse
import os
import subprocess

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
        {"name": "Oracle", "command": "expdp <user>/<password>@<db> schemas=<schema> directory=<dir> dumpfile=backup.dmp logfile=backup.log"},
        {"name": "SQLite", "command": "sqlite3 <db> .backup backup.sqlite"},
        {"name": "MongoDB", "command": "mongodump --db <db> --out /backup/"},
        {"name": "Redis", "command": "redis-cli BGSAVE && cp /var/lib/redis/dump.rdb /backup/"},
        {"name": "MariaDB", "command": "mysqldump -u <user> -p<password> <db> > backup.sql"},
        {"name": "IBM Db2", "command": "db2 backup db <db> to /backup/"},
        {"name": "Amazon Aurora", "command": "mysqldump -h <endpoint> -u <user> -p<password> <db> > backup.sql"},
        {"name": "Cassandra", "command": "nodetool snapshot <keyspace>"},
        {"name": "Elasticsearch", "command": "curl -XPUT 'localhost:9200/_snapshot/my_backup/snapshot_1'"},
        {"name": "Firebase Realtime Database", "command": "firebase database:get / > backup.json"},
        {"name": "CouchDB", "command": "couchbackup --url http://<user>:<password>@<host>:<port> --db <db> > backup.json"},
        {"name": "Neo4j", "command": "neo4j-admin backup --from=<host>:<port> --backup-dir=/backup/"}
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

@router.patch("/jobs/{job_id}/toggle")
def toggle_job_active(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_active = 0 if job.is_active else 1
    db.commit()
    db.refresh(job)
    return job

@router.post("/jobs/{job_id}/run", response_model=schemas.Backup)
def run_job_now(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        # Simüle backup işlemi: bağlantı hatası veya dosya oluşmama durumu
        if job.host in ["localhost", "127.0.0.1"]:
            # Simülasyon: bağlantı başarılı, dosya oluştu
            file_path = f"/backups/job_{job_id}_{job.name}.bak"
            backup = models.Backup(job_id=job_id, status="completed", file_path=file_path, success=1)
        else:
            # Simülasyon: bağlantı hatası
            raise Exception("Veritabanına bağlanılamadı veya backup dosyası oluşturulamadı.")
    except Exception as e:
        backup = models.Backup(job_id=job_id, status="failed", file_path=None, success=0, error_message=str(e))
    db.add(backup)
    db.commit()
    db.refresh(backup)
    return backup

@router.get("/jobs/{job_id}/backups", response_model=List[schemas.Backup])
def get_job_backups(job_id: int, db: Session = Depends(get_db)):
    return db.query(models.Backup).filter(models.Backup.job_id == job_id).order_by(models.Backup.created_at.desc()).all()

@router.get("/backups/{backup_id}/download")
def download_backup(backup_id: int, db: Session = Depends(get_db)):
    backup = db.query(models.Backup).filter(models.Backup.id == backup_id).first()
    if not backup or not backup.file_path or not os.path.exists(backup.file_path):
        raise HTTPException(status_code=404, detail="Backup file not found")
    return FileResponse(backup.file_path, filename=os.path.basename(backup.file_path))

@router.post("/migrate")
def migrate_databases(request: Request, body: dict, db: Session = Depends(get_db)):
    source = body.get("source")
    target = body.get("target")
    migration_cmd = ""
    info = ""
    # Genişletilmiş migration kombinasyonları
    if source["type"] == "MySQL" and target["type"] == "PostgreSQL":
        migration_cmd = f"pgloader mysql://{source['user']}:{source['password']}@{source['host']}:{source['port']}/{source['db_name']} postgresql://{target['user']}:{target['password']}@{target['host']}:{target['port']}/{target['db_name']}"
        info = "MySQL'den PostgreSQL'e pgloader ile migration (tutarlı, önerilen yol)"
    elif source["type"] == "MySQL" and target["type"] == "MariaDB":
        migration_cmd = f"mysqldump -u {source['user']} -p{source['password']} -h {source['host']} -P {source['port']} {source['db_name']} | mysql -u {target['user']} -p{target['password']} -h {target['host']} -P {target['port']} {target['db_name']}"
        info = "MySQL'den MariaDB'ye dump + import (tam uyumlu)"
    elif source["type"] == "MariaDB" and target["type"] == "MySQL":
        migration_cmd = f"mysqldump -u {source['user']} -p{source['password']} -h {source['host']} -P {source['port']} {source['db_name']} | mysql -u {target['user']} -p{target['password']} -h {target['host']} -P {target['port']} {target['db_name']}"
        info = "MariaDB'den MySQL'e dump + import (tam uyumlu)"
    elif source["type"] == "PostgreSQL" and target["type"] == "PostgreSQL":
        migration_cmd = f"pg_dump -U {source['user']} -h {source['host']} -p {source['port']} {source['db_name']} | psql -U {target['user']} -h {target['host']} -p {target['port']} {target['db_name']}"
        info = "PostgreSQL'den PostgreSQL'e dump + import (tam uyumlu)"
    elif source["type"] == "PostgreSQL" and target["type"] == "MySQL":
        migration_cmd = f"pg2mysql --host={source['host']} --port={source['port']} --user={source['user']} --password={source['password']} --database={source['db_name']} > {target['db_name']}.sql && mysql -u {target['user']} -p{target['password']} -h {target['host']} -P {target['port']} {target['db_name']} < {target['db_name']}.sql"
        info = "PostgreSQL'den MySQL'e pg2mysql ile migration (temel veri için)"
    elif source["type"] == "SQLite" and target["type"] == "PostgreSQL":
        migration_cmd = f"pgloader sqlite:///{source['db_name']}.db postgresql://{target['user']}:{target['password']}@{target['host']}:{target['port']}/{target['db_name']}"
        info = "SQLite'dan PostgreSQL'e pgloader ile migration (temel veri için)"
    elif source["type"] == "Oracle" and target["type"] == "PostgreSQL":
        migration_cmd = f"ora2pg -t TABLE -o output.sql -b ./ -c config_file"
        info = "Oracle'dan PostgreSQL'e ora2pg ile migration (mapping ve test gerekebilir)"
    elif source["type"] == "MSSQL" and target["type"] == "PostgreSQL":
        migration_cmd = f"pgloader mssql://{source['user']}:{source['password']}@{source['host']}:{source['port']}/{source['db_name']} postgresql://{target['user']}:{target['password']}@{target['host']}:{target['port']}/{target['db_name']}"
        info = "MSSQL'den PostgreSQL'e pgloader ile migration (sınırlı, temel veri için)"
    elif source["type"] == "MongoDB" and target["type"] == "PostgreSQL":
        migration_cmd = f"mongo2sql --db {source['db_name']} --out {target['db_name']}.sql"
        info = "MongoDB'den PostgreSQL'e mongo2sql ile migration (temel veri için, çıktı SQL dosyası olarak alınır)"
    elif source["type"] == "SQLite" and target["type"] == "SQLite":
        migration_cmd = f"sqlite3 {source['db_name']}.db .backup {target['db_name']}.db"
        info = "SQLite'dan SQLite'a .backup ile migration (tam uyumlu)"
    elif source["type"] == "Elasticsearch" and target["type"] == "Elasticsearch":
        migration_cmd = f"curl -XPUT 'http://{source['host']}:{source['port']}/_snapshot/my_backup/snapshot_1' && curl -XPOST 'http://{target['host']}:{target['port']}/_snapshot/my_backup/snapshot_1/_restore'"
        info = "Elasticsearch'ten Elasticsearch'e snapshot/restore ile migration (aynı veya farklı cluster için)"
    else:
        info = "Bu migration türü için otomatik komut önerisi yok. Manuel migration veya özel script gerekebilir."
    result = None
    if migration_cmd:
        try:
            output = f"(Simülasyon) Komut: {migration_cmd}"
        except Exception as e:
            output = str(e)
    else:
        output = info
    return {"command": migration_cmd, "info": info, "output": output} 