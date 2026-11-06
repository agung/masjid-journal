# Masjid Journal

Masjid Journal adalah aplikasi pencatatan dan pelaporan keuangan masjid yang mobile-first. Aplikasi mendukung banyak organisasi, buku kas per akun, transaksi dengan jejak saldo, bukti transaksi privat, laporan PDF, undangan anggota, dan kontrol akses berbasis peran.

## Teknologi

- Next.js 16 dan React 19 melalui vinext
- Cloudflare Workers sebagai runtime
- Cloudflare D1 dan Drizzle ORM untuk data aplikasi
- Cloudflare R2 untuk bukti transaksi privat
- Durable Objects untuk mengurutkan perubahan saldo per organisasi
- Clerk untuk autentikasi
- Tailwind CSS dan Radix UI untuk antarmuka

## Mulai cepat

Prasyarat: Node.js 22, npm, akun Cloudflare, dan aplikasi Clerk.

```bash
npm ci
npm run db:migrate:local
npm run dev
```

Siapkan `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, dan `CLERK_JWT_KEY` untuk pengembangan lokal. Jangan commit file `.env.local` atau nilai secret apa pun.

## Perintah utama

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan aplikasi lokal |
| `npm run lint` | Memeriksa aturan lint |
| `npm run typecheck` | Membuat tipe Worker dan memeriksa TypeScript |
| `npm test` | Menjalankan test Node |
| `npm run db:generate` | Membuat migrasi D1 dari perubahan schema |
| `npm run db:migrate:local` | Menerapkan migrasi ke D1 lokal |
| `npm run db:migrate:remote` | Menerapkan migrasi ke D1 production |
| `npm run build:vinext` | Membuat build Worker |
| `npm run deploy:vinext` | Deploy dengan vinext-cloudflare |

## Dokumentasi

Mulai dari [indeks dokumentasi](docs/README.md). Di sana tersedia arsitektur, flow aplikasi, aturan desain, setup lokal, deployment, dan proposal pengembangan.

Kontributor berbasis agent wajib membaca [AGENTS.md](AGENTS.md). Claude juga membaca [CLAUDE.md](CLAUDE.md). Perubahan flow, desain, setup, arsitektur, atau deployment harus memperbarui dokumentasi terkait dalam perubahan yang sama.

## Deployment

Push atau merge ke `main` menjalankan GitHub Actions untuk lint, typecheck, test, pemeriksaan vinext, build, migrasi D1, deployment Worker, dan smoke test. Detail resource, secret, domain, rollback, dan observability tersedia di [dokumentasi deployment](docs/deployment.md).

