# Dokumentasi Masjid Journal

Folder ini adalah sumber dokumentasi utama proyek. Agent dan kontributor harus membacanya sebelum mengubah perilaku aplikasi.

## Peta dokumentasi

- [Arsitektur](architecture.md): komponen runtime, model data, keamanan, dan keputusan teknis.
- [Flow aplikasi](flows.md): autentikasi, organisasi, transaksi, ledger, bukti, laporan, dan undangan.
- [Desain produk](design.md): prinsip UI, navigasi, warna, tipografi, komponen, dan aksesibilitas.
- [Setup](setup.md): prasyarat, instalasi lokal, environment, D1, Clerk, dan perintah pengembangan.
- [Deployment](deployment.md): resource Cloudflare, GitHub Actions, domain, secret, migrasi, rollback, dan operasi.
- [Proposal](proposal.md): arah pengembangan yang belum menjadi perilaku production.

## Aturan pemeliharaan

Dokumentasi harus diperbarui dalam perubahan yang sama dengan kode:

- perubahan alur pengguna atau aturan bisnis memperbarui `flows.md`;
- perubahan komponen, token visual, navigasi, atau pola interaksi memperbarui `design.md`;
- perubahan data, service, auth, storage, atau integrasi memperbarui `architecture.md`;
- perubahan kebutuhan lokal atau konfigurasi memperbarui `setup.md`;
- perubahan CI, resource production, secret, domain, atau release memperbarui `deployment.md`;
- ide yang belum diimplementasikan dicatat di `proposal.md`.

Jangan menyimpan instruksi aktif di dokumen root lain. `README.md` berfungsi sebagai pengantar, sedangkan detail teknis hidup di folder ini.

