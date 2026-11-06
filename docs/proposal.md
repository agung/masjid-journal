# Proposal produk dan pengembangan

## Latar belakang

Pencatatan kas masjid sering tersebar di buku, spreadsheet, chat, dan rekening yang dikelola beberapa pengurus. Kondisi ini menyulitkan rekonsiliasi saldo, pelacakan asal transaksi, pergantian pengurus, dan penyusunan laporan yang dapat dipertanggungjawabkan.

Masjid Journal mengusulkan satu ledger organisasi yang mencatat setiap perubahan saldo, akun yang terlibat, pelaku, waktu, dan bukti transaksi. Aplikasi dibuat mobile-first agar pencatatan dapat dilakukan segera setelah aktivitas keuangan terjadi.

## Tujuan

- Menyatukan kas tunai dan rekening bank dalam satu ledger.
- Menjaga saldo dapat ditelusuri melalui movement dan audit log.
- Membatasi tindakan sesuai tanggung jawab pengurus.
- Memudahkan laporan periodik tanpa mengolah ulang data.
- Menjaga bukti transaksi tetap privat dan terhubung dengan transaksi.
- Menyediakan fondasi multi-organisasi yang aman.

## Ruang lingkup saat ini

Produk mencakup autentikasi, organisasi dan anggota, role, akun kas/bank, kategori, enam tipe transaksi, ledger, bukti transaksi, dashboard, laporan, PDF, undangan, dan PWA. Integrasi bank otomatis, approval berlapis, akuntansi double-entry lengkap, payroll, inventaris, dan portal donatur belum termasuk ruang lingkup saat ini.

## Prinsip keberhasilan

- Tidak ada mutation saldo tanpa transaction movement dan audit yang sesuai.
- Data satu organisasi tidak dapat diakses anggota organisasi lain.
- Pengurus dapat mencatat transaksi umum dari perangkat mobile dengan langkah singkat.
- Laporan menghasilkan angka yang konsisten dengan movement ledger.
- Deployment dan migrasi dapat dilakukan tanpa kehilangan data production.

## Proposal pengembangan

Bagian berikut memuat arah yang belum menjadi perilaku production. Setiap item perlu desain, acceptance criteria, dan keputusan prioritas sebelum implementasi. Setelah fitur dikirim, pindahkan informasi faktualnya ke dokumentasi terkait dan hapus proposal yang selesai.

## Prioritas dekat

### Konsistensi bukti transaksi

- Tambahkan test untuk upload HEIC/HEIF, batas hasil foto 1 MB, PDF, dan dokumen Office.
- Tambahkan observability untuk kegagalan konversi browser dan cleanup R2.
- Pertimbangkan validasi magic bytes di server agar validasi tidak hanya bergantung pada MIME dan ekstensi.

### Ketahanan ledger

- Tambahkan test concurrency untuk mutation dalam organisasi yang sama dan organisasi berbeda.
- Tambahkan rekonsiliasi yang membandingkan saldo akun dengan akumulasi movement.
- Sediakan prosedur koreksi melalui transaksi adjustment dan audit, tanpa edit saldo langsung.

### Operasional dan backup

- Dokumentasikan serta otomatisasi export D1 berkala.
- Tetapkan retensi backup dan latihan restore.
- Tambahkan pemeriksaan orphan object R2 dan path bukti yang hilang.

## Arah menengah

### Multi-bukti per transaksi

Saat ini satu transaksi mempunyai satu `proof_storage_path`. Dukungan multi-bukti memerlukan tabel attachment terpisah yang menyimpan ID, transaksi, object key, MIME, ukuran, nama asli, pembuat, dan waktu upload. Flow UI, authorization, cleanup, dan migrasi data lama harus dirancang bersama.

### Approval transaksi

Pertimbangkan status draft, submitted, approved, dan rejected untuk organisasi yang membutuhkan pemisahan tugas. Approval tidak boleh mengubah ledger sampai transaksi disetujui, atau harus memakai reversal yang tercatat jelas.

### Ekspor dan transparansi publik

Sediakan ekspor CSV/PDF yang konsisten dan halaman ringkasan publik opsional. Data pribadi, nomor rekening, nama pemegang kas, dan bukti transaksi harus tetap privat secara default.

## Kriteria penerimaan proposal

Sebelum proposal masuk implementasi, tentukan:

- masalah pengguna dan ruang lingkup;
- perubahan data dan strategi migrasi;
- permission dan batas organisasi;
- dampak ledger dan audit;
- desain UI serta state gagal/kosong/loading;
- observability, rollback, dan dokumentasi;
- test yang membuktikan acceptance criteria.

