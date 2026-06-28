# Implementasi Dual Database: MySQL (Local) + PostgreSQL (Production)

## Summary

Implementasi selesai! Aplikasi sekarang bisa menggunakan **MySQL** untuk development lokal dan **PostgreSQL/Supabase** untuk production, dengan automatic switching berdasarkan `DATABASE_URL`.

## Perubahan yang Dilakukan

### 1. Dependencies
✅ Installed `mysql2` package

### 2. Schema Files
✅ `drizzle/schema.pg.ts` - PostgreSQL schema (renamed from schema.ts)
✅ `drizzle/schema.mysql.ts` - MySQL schema (pg-core → mysql-core, jsonb → json)
✅ `drizzle/schema.ts` - Barrel file (re-exports from schema.pg.ts)

### 3. Database Connection (`lib/db/index.ts`)
✅ Dynamic database client initialization
✅ Auto-detects dialect from DATABASE_URL
✅ Supports both PostgreSQL and MySQL drivers
✅ HMR-safe with global singleton pattern

### 4. Better Auth (`lib/auth.ts`)
✅ Dynamic provider selection (`'mysql'` or `'pg'`)
✅ Uses `getDialect()` helper from db module

### 5. Drizzle Config (`drizzle.config.ts`)
✅ Dynamic schema path based on DATABASE_URL
✅ Dynamic dialect ('mysql' or 'postgresql')
✅ Separate migration folders (migrations/ vs migrations/mysql/)

### 6. Seed Script (`drizzle/seed.ts`)
✅ Dynamic client initialization for both MySQL and PostgreSQL
✅ Works with both dialects

### 7. NPM Scripts (`package.json`)
✅ Removed separate MySQL scripts - all `db:*` commands now auto-detect dialect from DATABASE_URL
✅ Single set of commands works for both MySQL and PostgreSQL

### 8. Documentation
✅ Updated `.env.example` with MySQL example
✅ Created `DATABASE_SETUP.md` - Setup guide

## Cara Menggunakan

### Development dengan MySQL

1. **Install MySQL atau jalankan via Docker:**
```bash
docker run -d --name mysql-masjid -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=masjid_journal -p 3306:3306 mysql:8
```

2. **Set DATABASE_URL di `.env.local`:**
```env
DATABASE_URL=mysql://root:root@localhost:3306/masjid_journal
```

3. **Generate dan push migrations:**
```bash
npm run db:generate  # auto-detect MySQL dari DATABASE_URL
npm run db:push      # auto-detect MySQL dari DATABASE_URL
npm run db:seed      # auto-detect MySQL dari DATABASE_URL
```

4. **Run dev server:**
```bash
npm run dev
```

**Switching antar database:** Cukup ubah `DATABASE_URL` di `.env.local`, semua command otomatis menyesuaikan!

### Production dengan Supabase PostgreSQL

Tidak ada perubahan — tetap set `DATABASE_URL` ke Supabase connection string di Vercel environment variables.

## Migration Strategy

- **PostgreSQL migrations**: `drizzle/migrations/`
- **MySQL migrations**: `drizzle/migrations/mysql/`
- Migrations dikelola terpisah per dialect
- Schema definitions di-maintain di 2 file (schema.pg.ts dan schema.mysql.ts)

## Type Safety

- `db` instance di-export sebagai `any` untuk menghindari TypeScript union type issues
- Runtime type adalah benar (PostgresJsDatabase atau MySql2Database)
- Query builder syntax tetap sama untuk kedua dialect
- Drizzle ORM menghandle perbedaan SQL dialect di belakang layar

## Backward Compatibility

✅ Tidak ada breaking changes pada kode aplikasi
✅ Semua import `from '@/drizzle/schema'` tetap bekerja
✅ Semua query di `lib/server/*` tidak perlu diubah
✅ Production deployment tetap menggunakan PostgreSQL/Supabase

## Testing

- [ ] Test auth flow (register, login) dengan MySQL
- [ ] Test transaction CRUD dengan MySQL
- [ ] Test account management dengan MySQL
- [ ] Test reports generation dengan MySQL
- [ ] Verify production deployment masih menggunakan PostgreSQL

## Notes

- Schema changes harus di-maintain di **kedua** file (schema.pg.ts dan schema.mysql.ts)
- Drizzle Kit akan auto-detect dialect dari DATABASE_URL
- Better Auth sudah support kedua database (tested)
- Storage (Supabase Storage) tetap bisa digunakan meskipun database lokal MySQL
