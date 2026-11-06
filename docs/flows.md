# Flow aplikasi

## Autentikasi dan bootstrap user

1. Pengguna sign-in atau sign-up melalui Clerk.
2. Worker memvalidasi sesi Clerk dan authorized party.
3. Aplikasi mencari user D1 berdasarkan Clerk ID.
4. Jika belum ada, aplikasi mencoba menghubungkan user berdasarkan email terverifikasi; jika tidak ditemukan, user internal baru dibuat.
5. Organisasi aktif dibaca dari user. Jika kosong, membership pertama menjadi fallback.
6. Pengguna tanpa organisasi dapat membuat organisasi atau menerima undangan.

## Organisasi dan akses

Owner membuat organisasi dan otomatis menjadi anggota dengan role `owner`. Data selalu dipisahkan berdasarkan organisasi aktif.

| Kemampuan | Viewer | Treasurer | Admin | Owner |
| --- | :---: | :---: | :---: | :---: |
| Melihat dashboard, ledger, laporan | Ya | Ya | Ya | Ya |
| Membuat dan mengedit transaksi |  | Ya | Ya | Ya |
| Menghapus transaksi |  |  | Ya | Ya |
| Mengelola akun dan kategori |  |  | Ya | Ya |
| Mengelola anggota dan organisasi |  |  |  | Ya |

Admin dan treasurer dibatasi pada akun pemegang kas miliknya ketika aturan transaksi memerlukannya. Owner mempunyai cakupan organisasi penuh.

## Pencatatan transaksi

1. Pengguna memilih tipe, tanggal, nominal, sumber atau tujuan, kategori bila diperlukan, serta catatan.
2. Server memvalidasi input, role, kepemilikan organisasi, status akun, dan saldo yang cukup.
3. Aplikasi mengambil lock Durable Object untuk organisasi.
4. Header transaksi, movement, saldo akun, dan audit log ditulis dalam batch D1.
5. Lock dilepas dalam blok `finally`.
6. Jika ada bukti, file diunggah setelah transaksi mempunyai ID dan `proof_storage_path` diperbarui.

Edit transaksi hanya tersedia selama satu jam setelah dibuat untuk role minimal treasurer. Penghapusan selama jendela yang sama memerlukan minimal admin. Saat diedit, movement lama dibalik dan movement baru diterapkan secara atomik.

## Upload dan akses bukti

1. Pengguna memilih foto atau dokumen sampai 10 MB.
2. HEIC/HEIF dikonversi di browser; semua foto di-resize dan dikompres menjadi WebP maksimum 1 MB.
3. PDF dan dokumen Office/TXT/CSV/RTF dipertahankan dalam format asal.
4. API memvalidasi tipe, ukuran, transaksi, dan membership.
5. File disimpan di R2 sebagai `<transactionId>.<extension>` dan path dicatat di D1.
6. Preview selalu melalui route privat yang memvalidasi akses. Foto dan PDF dapat dipreview; dokumen lain diunduh.

Satu transaksi saat ini hanya mempunyai satu bukti. Mengunggah bukti baru mengganti bukti sebelumnya.

## Ledger dan laporan

Ledger berasal dari `transaction_movement`, sehingga satu transaksi transfer dapat muncul pada akun sumber dan tujuan. Filter tanggal, akun, dan tipe diterapkan di server. Pagination berikutnya dimuat melalui infinite scroll.

Dashboard merangkum saldo dan aktivitas terbaru. Halaman laporan menghitung ringkasan berdasarkan rentang tanggal serta dapat membuka preview PDF. Navigasi bulan selalu berpatokan pada bulan kalender aktif agar perpindahan bulan tidak menghilangkan bulan sekarang.

## Undangan anggota

1. Owner membuat undangan dengan email dan role.
2. Undangan pending mempunyai masa berlaku.
3. Penerima sign-in memakai email Clerk yang telah terverifikasi.
4. Halaman penerimaan memastikan email cocok dengan undangan.
5. Membership, status undangan, dan organisasi aktif diperbarui secara atomik.

## Penghapusan

Penghapusan transaksi mengembalikan dampak saldo, menghapus movement dan header dalam batch D1, mencatat audit, lalu mencoba membersihkan object bukti dari R2. Kegagalan cleanup R2 dicatat tanpa membatalkan transaksi D1 yang sudah berhasil.

