# Setup pengembangan

## Prasyarat

- Node.js 22
- npm
- akun Cloudflare dengan akses D1, R2, Workers, dan Durable Objects
- aplikasi Clerk development
- Wrangler yang terautentikasi untuk operasi Cloudflare

## Instalasi

```bash
npm ci
npm run db:migrate:local
npm run dev
```

Vinext menjalankan aplikasi di runtime yang menyerupai Cloudflare Worker. Jangan mengganti akses binding dengan koneksi database Node biasa.

## Environment lokal

Buat `.env.local` yang tidak di-commit:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----..."
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

Gunakan nilai development dari Clerk. Jangan menyalin production secret ke dokumentasi, issue, log, atau commit.

## Database

Schema utama berada di `drizzle/schema.sqlite.ts`.

Untuk perubahan schema:

1. Ubah schema TypeScript.
2. Jalankan `npm run db:generate`.
3. Tinjau migrasi baru di `drizzle/migrations/`.
4. Terapkan secara lokal dengan `npm run db:migrate:local`.
5. Pastikan migrasi forward-only dan kompatibel dengan Worker yang sedang production.

Jangan mengubah migrasi yang sudah diterapkan dan jangan menjalankan `drizzle-kit push` terhadap production.

## Resource lokal dan binding

Binding runtime didefinisikan di `wrangler.jsonc` dan `cloudflare.config.ts`:

- `DB`: D1 `masjid-journal`
- `PROOF_BUCKET`: R2 `masjid-journal-proofs`
- `LEDGER_COORDINATOR`: Durable Object
- response cache bucket vinext

Jika binding berubah, kedua konfigurasi dan `docs/architecture.md` harus tetap sinkron.

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test
npx vinext check
npm run build:vinext
```

CI menjalankan rangkaian tersebut sebelum deployment. Untuk perubahan kecil, dokumentasikan pemeriksaan yang dijalankan dan yang belum dijalankan.

## Aturan Git

Jalankan `git fetch origin --prune`, mulai pekerjaan baru dari `origin/main`, dan gunakan branch khusus. Jangan mengedit atau commit langsung di `main`. Jangan menghapus perubahan yang sudah ada di working tree. Detail aturan agent tersedia di `AGENTS.md`.

