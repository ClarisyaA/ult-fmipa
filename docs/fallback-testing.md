# Fallback Testing Checklist

Use this checklist after changing database/API fallback behavior.

## With Database Running

1. Start the app normally.
2. Visit `/admin/dashboard`, `/admin/requests`, and `/admin/reports`.
3. Visit `/staff/dashboard` and `/staff/requests`.
4. Visit `/mahasiswa/riwayat`.
5. Visit `/informasi`.
6. Visit `/layanan/surat-izin-kegiatan/ajukan`.
7. Submit a Magang request.
8. Submit and continue the SIK workflow.

## With Database Stopped

1. Stop MariaDB or the Docker database container.
2. Visit `/admin/dashboard`, `/admin/requests`, and `/admin/reports`.
3. Visit `/staff/dashboard` and `/staff/requests`.
4. Visit `/mahasiswa/riwayat`.
5. Visit `/informasi`.
6. Confirm pages show `Data belum dapat dimuat` instead of a runtime stack screen.
7. Call high-risk APIs and confirm DB unavailable responses use status `503`.
8. Confirm API JSON has `success: false` and `error.code: DATABASE_UNAVAILABLE`.
9. Open the request notification panel and confirm polling does not spam the console.
10. Restart the database and refresh the pages to confirm recovery.
