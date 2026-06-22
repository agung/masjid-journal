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

## 4. Supabase Storage (Bukti Transaksi)

> ⚠️ Jika hanya ingin login dengan Google (SSO), tidak perlu setup Storage.
> Storage hanya dibutuhkan untuk upload bukti foto transaksi.

Kamu bisa pilih provider storage dengan mengatur env `STORAGE_PROVIDER`:

- `STORAGE_PROVIDER=supabase` → **Supabase Storage** (default, gratis 1 GB)
- `STORAGE_PROVIDER=google_drive` → **Google Drive OAuth** (pakai quota Drive 15 GB)

---

### Opsi A: Pakai Supabase Storage (default)

### 4.1 Buat Bucket Storage

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) → pilih project
2. Menu → **Storage**
3. Klik **New Bucket**
4. Nama: `bukti-transaksi`
5. **Public bucket**: **disable** (file diakses via signed URL dengan expired 60 detik)
6. Klik **Create bucket**

### 4.2 Ambil Environment Variables

1. Menu → **Project Settings** → **API**
2. Salin **Project URL** sebagai `NEXT_PUBLIC_SUPABASE_URL`
3. Salin **service_role key** sebagai `SUPABASE_SERVICE_ROLE_KEY`

### 4.3 Set di `.env.local`

```env
STORAGE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

### Opsi B: Pakai Google Drive OAuth

### 4.4 Setup Google OAuth

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials** → OAuth Client ID (bisa reuse dari SSO)
3. Tambahkan **Authorized redirect URIs**:
   - `http://localhost:3000/api/drive-setup/callback` (development)
   - `https://domain-vercel-kamu.vercel.app/api/drive-setup/callback` (production)
4. Pastikan **Google Drive API** sudah di-enabled di **APIs & Services → Library**

### 4.5 Dapatkan Refresh Token via App

Cara termudah — langsung dari app yang sudah berjalan:

1. Buka **Settings → Sistem → Penyimpanan Bukti**
2. Ikuti langkah-langkah di halaman tersebut
3. Klik tombol **Hubungkan Google Drive**
4. Login dengan akun pemilik folder Drive
5. Setujui akses
6. Salin refresh token yang muncul
7. Tambahkan ke Vercel / `.env.local`

> Atau alternatif: pakai [OAuth Playground](https://developers.google.com/oauthplayground) dengan redirect URI:
> `https://developers.google.com/oauthplayground`

### 4.6 Set di `.env.local`

```env
STORAGE_PROVIDER=google_drive
GOOGLE_DRIVE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_DRIVE_REFRESH_TOKEN=1//0gabcdef...
GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

### Test Upload

Setelah env terisi, jalankan dev server dan upload foto bukti transaksi.
Foto akan otomatis dikompres ke WebP (kualitas tinggi) di browser sebelum diupload.

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

# General
STORAGE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

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
| `STORAGE_PROVIDER` | Opsional | `supabase` (default) atau `google_drive` |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya* | Supabase project URL (wajib jika STORAGE_PROVIDER=supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya* | Service role key (wajib jika STORAGE_PROVIDER=supabase) |
| `GOOGLE_DRIVE_CLIENT_ID` | Ya* | OAuth Client ID (wajib jika STORAGE_PROVIDER=google_drive) |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Ya* | OAuth Client Secret (wajib jika STORAGE_PROVIDER=google_drive) |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Ya* | Refresh token (wajib jika STORAGE_PROVIDER=google_drive) |
| `GOOGLE_DRIVE_FOLDER_ID` | Ya* | Folder Drive tujuan (wajib jika STORAGE_PROVIDER=google_drive) |
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

### Upload ke Supabase Storage gagal
- Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah di-set di `.env.local`
- Pastikan bucket `bukti-transaksi` sudah dibuat di Supabase Dashboard → Storage
- Pastikan bucket bersifat **private** (bukan public) — signed URL akan gagal untuk bucket public
- Cek log Vercel atau terminal dev server untuk error detail

### Better Auth error: default secret
- Generate `BETTER_AUTH_SECRET` dengan `openssl rand -base64 32`
- Pastikan nilai diset di Vercel environment variables

### PWA tidak bisa di-install
- Pastikan app sudah di-deploy ke HTTPS (Vercel otomatis)
- Pastikan `public/manifest.json` bisa diakses
- Buka Chrome DevTools → Application → Manifest untuk debug
