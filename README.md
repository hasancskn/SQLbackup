# SQLBackup Web Uygulaması

## Amaç
En popüler veritabanları için yedekleme (backup) komutlarını kolayca seçip, zamanlanmış işler (job) oluşturabileceğiniz, modern görünümlü ve Docker Compose ile kolayca kurulabilen bir web uygulamasıdır.

## Özellikler
- MySQL, PostgreSQL, MSSQL, MongoDB için hazır backup komutları
- Job oluşturma, listeleme, silme, düzenleme
- Job aktif/pasif durumu (toggle switch)
- Job'u elle tetikleme (Run Now)
- Job backup geçmişi (modalda detaylı tablo)
- Backup dosyasını indirme
- Backup geçmişinde hata mesajı ve başarı durumu
- Otomatik backup temizleme (son X yedek veya X gün ayarı)
- Modern ve responsive arayüz (Material UI, DataGrid)
- Backup başarı/başarısızlık oranı ve toplam yedek sayısı için grafik/istatistik dashboard'u
- Tamamen Docker Compose ile ayağa kalkar

## Kurulum
1. `git clone <repo-url>`
2. Proje klasörüne girin
3. `docker-compose up --build` komutunu çalıştırın

## Kullanım
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

## Temel Ekranlar
- **Job Oluşturma:** Veritabanı türü, bağlantı bilgileri, çalışma aralığı (cron desteği), aktif/pasif seçimi
- **Job Listesi:** Tüm joblar, aktif/pasif switch, düzenle, sil, elle çalıştır, geçmişi gör
- **Backup Geçmişi:** Her job için alınan yedeklerin tarihi, durumu, hata mesajı ve indirme butonu
- **Dashboard:** Backup istatistikleri ve grafikler (başarı oranı, toplam yedek sayısı)

## Geliştirici Notları
- Backend: FastAPI, SQLAlchemy, SQLite, APScheduler
- Frontend: React, Material UI, DataGrid, Chart.js
- Tüm servisler Docker Compose ile otomatik başlar

## Gelişmiş Özellikler
- Cron ifadesiyle esnek zamanlama
- Otomatik backup temizleme
- API üzerinden job ve backup yönetimi

## Katkı ve Lisans
Katkıda bulunmak için PR gönderebilir, öneri ve hata bildirimlerinizi iletebilirsiniz.

---

> Modern, güvenli ve kolay yedekleme yönetimi için SQLBackup!

