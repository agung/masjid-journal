# Desain produk

## Prinsip

Masjid Journal dirancang mobile-first untuk pencatatan cepat oleh pengurus masjid. Informasi nominal, sumber dana, tujuan dana, dan saldo harus mudah dipindai. Aksi berisiko harus jelas, dan status loading, kosong, gagal, serta terkunci harus selalu terlihat.

## Navigasi

Navigasi utama memakai bottom navigation lima item:

1. Dashboard
2. Ledger
3. Input sebagai aksi utama
4. Laporan
5. Settings

Layout aplikasi memakai top bar, lebar konten yang nyaman di perangkat mobile, dan safe-area padding untuk perangkat iOS. Halaman transaksi detail menjadi pusat untuk melihat movement, bukti, edit, dan hapus.

## Identitas visual

- Font utama: Poppins.
- Font aksen: Reem Kufi.
- Warna utama: hijau dengan skala `green-50` sampai `green-900`; aksi utama memakai `green-600`.
- Pemasukan menggunakan hijau, pengeluaran menggunakan merah, dan peringatan lock menggunakan amber.
- Radius dasar 0,75 rem; card utama umumnya memakai `rounded-xl` atau `rounded-2xl`.
- Light dan dark theme menggunakan semantic CSS variables di `app/globals.css`.

## Pola komponen

- Form memakai label tetap terlihat, pesan error dekat input, dan tombol submit selebar container.
- Nominal memakai format Rupiah dan tidak boleh mengandalkan warna saja untuk menunjukkan arah.
- Card ledger menampilkan tanggal, nomor transaksi, tipe, akun, nominal, saldo sebelum, dan saldo sesudah.
- Bukti foto memakai `object-contain` agar seluruh dokumen terlihat. PDF memakai viewer; dokumen lain memakai card file dan aksi unduh.
- Loading halaman memakai skeleton. Mutation menonaktifkan aksi dan menampilkan status proses.
- Empty state menjelaskan keadaan dan memberi aksi berikutnya bila relevan.

## Responsive dan PWA

Target utama adalah portrait mobile, tetapi konten tetap dapat digunakan di desktop. Bottom navigation dibatasi pada lebar maksimum agar tetap rapat. Aplikasi menyediakan manifest PWA, ikon maskable, splash screen, dan safe-area support.

## Aksesibilitas

- Gunakan elemen semantic dan label yang terhubung dengan input.
- Semua aksi harus dapat dioperasikan dengan keyboard.
- Ikon dekoratif tidak boleh menjadi satu-satunya penjelasan aksi.
- Pertahankan kontras yang cukup pada light dan dark theme.
- Gunakan fokus yang terlihat, pesan error berupa teks, dan target sentuh yang memadai.
- Dialog dan menu memakai primitive Radix agar focus management konsisten.

## Aturan perubahan desain

Gunakan token dan pola yang sudah ada sebelum menambah variasi baru. Jika navigasi, token, komponen dasar, atau perilaku responsif berubah, perbarui dokumen ini dan screenshot atau aset terkait bila tersedia.

