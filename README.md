# SQLBackup Web Uygulaması

## Amaç
En popüler veritabanları için yedekleme (backup) ve veritabanı migration işlemlerini kolayca yönetebileceğiniz, modern görünümlü ve Docker Compose ile kolayca kurulabilen bir web uygulamasıdır.

## Özellikler
- MySQL, PostgreSQL, MSSQL, Oracle, SQLite, MongoDB, MariaDB, Elasticsearch ve daha fazlası için hazır backup komutları
- Job oluşturma, listeleme, silme, düzenleme
- Job aktif/pasif durumu (toggle switch)
- Job'u elle tetikleme (Run Now)
- Job backup geçmişi (modalda detaylı tablo)
- Backup dosyasını indirme
- Backup geçmişinde hata mesajı ve başarı durumu
- Otomatik backup temizleme (son X yedek veya X gün ayarı)
- Modern ve responsive arayüz (Material UI, DataGrid)
- Backup başarı/başarısızlık oranı ve toplam yedek sayısı için grafik/istatistik dashboard'u
- **Veritabanı Migration:**
  - Kaynak ve hedef veritabanı seçimi
  - Sadece gerçekten migration yapılabilen kombinasyonlar gösterilir
  - Otomatik komut/araç önerisi (pgloader, ora2pg, mongo2sql, dump/import, snapshot/restore, vs.)
  - Migration işlemini başlatma ve log/sonuç gösterimi
- Tamamen Docker Compose ile ayağa kalkar

## Kurulum
1. `git clone <repo-url>`
2. Proje klasörüne girin
3. `docker-compose up --build` komutunu çalıştırın

## Kullanım
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

## Temel Ekranlar
- **Job Yönetimi:** Backup job oluşturma, yönetme, geçmişi görme
- **Migration:** Farklı veritabanları arasında veri taşıma, otomatik komut ve araç önerisi
- **Backup Geçmişi:** Her job için alınan yedeklerin tarihi, durumu, hata mesajı ve indirme butonu
- **Dashboard:** Backup istatistikleri ve grafikler (başarı oranı, toplam yedek sayısı)

## Geliştirici Notları
- Backend: FastAPI, SQLAlchemy, SQLite, APScheduler, pgloader, ora2pg, mongo2sql, vs.
- Frontend: React, Material UI, DataGrid, Chart.js
- Tüm servisler Docker Compose ile otomatik başlar

## Gelişmiş Özellikler
- Cron ifadesiyle esnek zamanlama
- Otomatik backup temizleme
- API üzerinden job ve backup yönetimi
- Migration için sadece desteklenen kombinasyonlar gösterilir
- Migration araçları otomatik kurulur (pgloader, ora2pg, mongo2sql, vs.)

## Katkı ve Lisans
Katkıda bulunmak için PR gönderebilir, öneri ve hata bildirimlerinizi iletebilirsiniz.

---



