# Setup Guide — Keuangan Masjid

Panduan lengkap untuk mengkonfigurasi semua layanan eksternal sebelum deploy.

---

## Daftar Isi

1. [Supabase (Database)](#1-supabase-database)
2. [Better Auth (Secret)](#2-better-auth-secret)
3. [Google OAuth (Login dengan Google)](#3-google-oauth-login-dengan-google)
4. [Google Drive (Bukti Transaksi)](#4-google-drive-bukti-transaksi)
5. [Vercel (Hosting)](#5-vercel-hosting)
6. [Variabel Lingkungan Lengkap](#6-variabel-lingkungan-lengkap)
7. [Jalankan Lokal](#7-jalankan-lokal)
8. [Setelah Deploy](#8-setelah-deploy)

---

## 1. Supabase (Database)

### 1.1 Buat Project

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi nama project: `masjid-journal`
3. Pilih region terdekat (contoh: Southeast Asia — Singapore)
4. Catat **Database Password** yang dibuat

### 1.2 Ambil Connection String

1. Masuk ke project → **Project Settings** → **Database**
2. Scroll ke bagian **Connection String**
3. Pilih mode **URI** (bukan Transaction Pooler)
4. Copy string, contoh:
   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Ganti `[YOUR-PASSWORD]` dengan password yang dicatat tadi
6. Simpan sebagai nilai `DATABASE_URL`

### 1.3 Push Schema

Setelah `.env.local` terisi, jalankan:

```bash
npm run db:push
npm run db:seed
```

Ini akan membuat semua tabel dan mengisi kategori default.

---

## 2. Better Auth (Secret)

### 2.1 Generate Secret

Jalankan salah satu dari berikut:

```bash
# macOS/Linux
openssl rand -base64 32

# Atau menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Salin hasilnya sebagai nilai `BETTER_AUTH_SECRET`.

> **Penting**: Jangan gunakan secret yang sama di berbagai environment (dev vs production).

---

## 3. Google OAuth (Login dengan Google)

Konfigurasi OAuth agar pengguna bisa login/daftar menggunakan akun Google.

### 3.1 Buat OAuth Consent Screen

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Pilih project (bisa project yang sudah dibuat untuk Google Drive, atau buat baru)
3. Menu → **APIs & Services** → **OAuth consent screen**
4. Pilih **External** → **Create**
5. Isi **App name**: `Keuangan Masjid`
6. Isi **User support email**: email kamu
7. Scroll ke **Developer contact information** → isi email kamu
8. Klik **Save and Continue**
9. **Scopes**: langsung klik **Save and Continue** (skip, tidak perlu tambah scope)
10. **Test users**: klik **Save and Continue** (skip)
11. Kembali ke **Dashboard**

### 3.2 Buat OAuth Client ID

1. Menu → **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Web Login`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `https://domain-vercel-kamu.vercel.app` (production, jika sudah deploy)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://domain-vercel-kamu.vercel.app/api/auth/callback/google` (production)
7. Klik **Create**
8. Akan muncul popup dengan **Client ID** dan **Client Secret**
9. Catat kedua nilai tersebut

### 3.3 Set Environment Variables

```env
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
```

### 3.4 Test

1. Jalankan dev server: `npm run dev`
2. Buka `/login` — klik tombol **Masuk dengan Google**
3. Pilih akun Google → redirect balik ke dashboard

> **Catatan**: Karena status OAuth consent screen adalah **Testing**, hanya email yang kamu daftarkan sebagai test user yang bisa login. Untuk production, kamu harus mempublikasikan consent screen (submission ke Google — butuh logo, privacy policy, dll).

---

## 4. Google Drive (Bukti Transaksi)

> ⚠️ Jika hanya ingin login dengan Google (SSO), tidak perlu setup Google Drive.
> Drive hanya dibutuhkan untuk upload bukti foto transaksi ke folder terpusat.

### 3.1 Buat Google Cloud Project

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Klik dropdown project di atas → **New Project**
3. Isi nama: `masjid-journal`
4. Klik **Create**

### 3.2 Aktifkan Google Drive API

1. Masuk ke project yang baru dibuat
2. Menu → **APIs & Services** → **Library**
3. Cari **Google Drive API**
4. Klik **Enable**

### 3.3 Buat Service Account

1. Menu → **APIs & Services** → **Credentials**
2. **Create Credentials** → **Service Account**
3. Isi nama: `masjid-journal-uploader`
4. Klik **Create and Continue** → **Done** (skip role assignment)

### 3.4 Download JSON Key

1. Di halaman **Credentials**, klik email service account yang baru dibuat
2. Tab **Keys** → **Add Key** → **Create new key**
3. Pilih **JSON** → **Create**
4. File JSON akan terdownload otomatis

### 3.5 Encode JSON Key ke Base64

```bash
# macOS/Linux
base64 -i service-account.json

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes('service-account.json'))
```

Salin hasil encode sebagai nilai `GOOGLE_SERVICE_ACCOUNT_KEY`.

Ambil juga nilai `client_email` dari file JSON sebagai `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

### 3.6 Buat Folder di Google Drive

1. Buka [drive.google.com](https://drive.google.com)
2. Klik **New** → **New folder**
3. Nama: `Bukti Transaksi Masjid` (atau sesuai keinginan)
4. Klik kanan folder → **Share**
5. Masukkan email service account (dari file JSON, field `client_email`)
   Contoh: `masjid-journal-uploader@masjid-journal.iam.gserviceaccount.com`
6. Pilih role **Editor** → **Send**

### 3.7 Ambil Folder ID

1. Buka folder yang sudah dibuat
2. Lihat URL browser:
   ```
   https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
   ```
3. Bagian terakhir URL (`1AbCdEfGhIjKlMnOpQrStUvWxYz`) adalah Folder ID
4. Simpan sebagai nilai `GOOGLE_DRIVE_FOLDER_ID`

---

## 5. Vercel (Hosting)

### 5.1 Push ke GitHub

```bash
# Pastikan repo sudah dibuat di github.com/agung/masjid-journal
git push -u origin main
```

### 5.2 Import ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project**
2. Import repo `agung/masjid-journal` dari GitHub
3. Framework: Next.js (otomatis terdeteksi)
4. Klik **Deploy** (akan gagal dulu karena belum ada env vars — itu normal)

### 5.3 Set Environment Variables di Vercel

1. Project → **Settings** → **Environment Variables**
2. Tambahkan semua variabel dari tabel di bawah
3. Pastikan **BETTER_AUTH_URL** diisi dengan URL production Vercel
   Contoh: `https://masjid-journal.vercel.app`
4. Klik **Redeploy**

### 5.4 Custom Domain (Opsional)

1. Project → **Settings** → **Domains**
2. Tambah domain custom
3. Update `BETTER_AUTH_URL` dan `NEXT_PUBLIC_APP_URL` dengan domain baru

---

## 6. Variabel Lingkungan Lengkap

Buat file `.env.local` di root project:

```env
# Better Auth
BETTER_AUTH_SECRET=hasil-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Google OAuth (SSO Login)
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx

# Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL=masjid-journal-uploader@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Keuangan Masjid"
```

| Variable | Wajib | Keterangan |
|---|---|---|
| `BETTER_AUTH_SECRET` | Ya | Random string 32 bytes |
| `BETTER_AUTH_URL` | Ya | URL app (localhost atau Vercel URL) |
| `DATABASE_URL` | Ya | Supabase PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Ya* | Client ID dari Google OAuth (wajib jika pakai SSO) |
| `GOOGLE_CLIENT_SECRET` | Ya* | Client Secret dari Google OAuth (wajib jika pakai SSO) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Ya* | Service account email (wajib jika pakai upload Drive) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Ya* | Base64 encoded JSON key (wajib jika pakai upload Drive) |
| `GOOGLE_DRIVE_FOLDER_ID` | Ya* | Folder ID tujuan upload (wajib jika pakai upload Drive) |
| `NEXT_PUBLIC_APP_URL` | Opsional | URL app untuk metadata |
| `NEXT_PUBLIC_APP_NAME` | Opsional | Nama app yang ditampilkan |

\* = Hanya wajib jika fitur terkait digunakan.

---

## 7. Jalankan Lokal

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Edit .env.local dan isi semua nilai

# Push schema ke database
npm run db:push

# Seed kategori default
npm run db:seed

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 8. Setelah Deploy

### Checklist

- [ ] `npm run db:push` berhasil dijalankan
- [ ] `npm run db:seed` berhasil dijalankan
- [ ] Register akun pertama di `/register`
- [ ] Buat organisasi masjid di dashboard
- [ ] Tambah holder kas (pemegang uang)
- [ ] Tambah rekening bank
- [ ] Coba input transaksi pertama
- [ ] Test upload bukti foto dari HP
- [ ] Buka di HP → klik **Add to Home Screen**

### Install sebagai PWA di HP

**Android (Chrome)**:
1. Buka URL app di Chrome
2. Tap menu (⋮) → **Add to Home screen**
3. Tap **Add**

**iPhone (Safari)**:
1. Buka URL app di Safari
2. Tap tombol Share (□↑)
3. Scroll → **Add to Home Screen**
4. Tap **Add**

### Undang Anggota

1. Login sebagai owner
2. Settings → Members → Invite
3. Masukkan email anggota
4. Pilih role sesuai:
   - **owner**: pengurus utama / ketua
   - **admin**: sekretaris / bendahara senior
   - **treasurer**: bendahara
   - **viewer**: pengurus lain yang hanya perlu lihat laporan

---

## Troubleshooting

### Database tidak terkoneksi
- Pastikan `DATABASE_URL` menggunakan **Pooler** mode (port 6543), bukan Direct (port 5432)
- Cek apakah IP Vercel sudah di-whitelist di Supabase (Settings → Database → Connection Pooling)

### Google SSO gagal
- Pastikan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` sudah di-set
- Pastikan **redirect URI** di Google Cloud Console sudah tepat: `http://localhost:3000/api/auth/callback/google`
- Jika error "redirect_uri_mismatch", periksa daftar Authorized redirect URIs di Google Cloud

### Upload ke Google Drive gagal
- Pastikan folder sudah di-share ke email service account dengan role **Editor**
- Pastikan `GOOGLE_SERVICE_ACCOUNT_KEY` adalah base64 dari **full JSON** (bukan hanya private key)
- Cek log Vercel untuk error detail

### Better Auth error: default secret
- Generate `BETTER_AUTH_SECRET` dengan `openssl rand -base64 32`
- Pastikan nilai diset di Vercel environment variables

### PWA tidak bisa di-install
- Pastikan app sudah di-deploy ke HTTPS (Vercel otomatis)
- Pastikan `public/manifest.json` bisa diakses
- Buka Chrome DevTools → Application → Manifest untuk debug
