# Database Setup Guide

Proyek ini mendukung **MySQL** untuk development lokal dan **PostgreSQL (Supabase)** untuk production.

## Pilihan 1: MySQL (Lokal) - Recommended untuk Development

### Prerequisites
- MySQL 8.0+ terinstall di komputer Anda
- Atau gunakan Docker: `docker run -d --name mysql-masjid -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=masjid_journal -p 3306:3306 mysql:8`

### Setup

1. **Buat database MySQL:**
```sql
CREATE DATABASE masjid_journal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Set DATABASE_URL di `.env.local`:**
```env
DATABASE_URL=mysql://root:root@localhost:3306/masjid_journal
```

3. **Generate & Push migrasi:**
```bash
npm run db:generate
npm run db:push
```

4. **Seed default categories:**
```bash
npm run db:seed
```

5. **Run dev server:**
```bash
npm run dev
```

**Catatan:** Semua command `db:*` sekarang otomatis detect dialect dari `DATABASE_URL` di `.env.local`. Tidak perlu script terpisah!

## Pilihan 2: PostgreSQL Lokal via Docker

Jika Anda tidak ingin mengubah kode sama sekali:

```bash
docker run -d \
  --name masjid-journal-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=masjid_journal \
  -p 5432:5432 \
  postgres:16
```

Lalu set di `.env.local`:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/masjid_journal
```

Jalankan migrasi:
```bash
npm run db:push
npm run db:seed
```

## Production (Supabase PostgreSQL)

Di Vercel, set environment variable:
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Migrasi akan dijalankan otomatis saat deployment dengan `drizzle-kit push`.

## Troubleshooting

### Error: "Unknown database"
- Pastikan database sudah dibuat: `CREATE DATABASE masjid_journal;`

### Error: "Client does not support authentication protocol"
- MySQL: Ubah password method ke `mysql_native_password`
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;
```

### Migrasi folder terpisah
- PostgreSQL migrations: `drizzle/migrations/`
- MySQL migrations: `drizzle/migrations/mysql/`

### Melihat isi database
- MySQL: `npm run db:studio` (jika DATABASE_URL MySQL)
- PostgreSQL: `npm run db:studio` (jika DATABASE_URL PostgreSQL)
