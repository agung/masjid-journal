# Deployment production

## Infrastruktur saat ini

- Worker: `masjid-journal`
- Domain aplikasi: `https://masjidku.nugs.web.id`
- D1: `masjid-journal`
- R2 bukti: `masjid-journal-proofs`
- R2 cache: `masjid-journal-response-cache`
- Durable Object: `LedgerCoordinator`
- Autentikasi: Clerk production

## Konfigurasi production

Worker membutuhkan:

| Nama | Jenis | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Variable | Origin production lengkap |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Secret/binding | Publishable key Clerk production |
| `CLERK_SECRET_KEY` | Secret | Backend secret Clerk production |
| `CLERK_JWT_KEY` | Secret | Public PEM untuk verifikasi JWT lokal |

GitHub environment `production` membutuhkan `CLOUDFLARE_ACCOUNT_ID` dan `CLOUDFLARE_API_TOKEN`. Variable `CLOUDFLARE_ACCOUNT_SUBDOMAIN` dipakai smoke test `workers.dev`. Token Cloudflare perlu izin minimum untuk deploy Worker dan menerapkan migrasi D1.

## Domain dan Clerk

DNS `masjidku.nugs.web.id` dikelola Cloudflare dan dipasang sebagai custom domain Worker. Origin yang sama harus dipakai oleh `NEXT_PUBLIC_APP_URL`, authorized parties Clerk, callback URL, dan redirect URL. Konfigurasi OAuth provider dilakukan di instance Clerk production.

## Pipeline GitHub Actions

Push atau merge ke `main` menjalankan `.github/workflows/deploy.yml` secara serial:

1. checkout source dan setup Node.js;
2. `npm ci`;
3. lint, typecheck, test, dan `vinext check`;
4. build vinext;
5. menerapkan migrasi D1 production;
6. deploy Worker menggunakan hasil build;
7. smoke test endpoint health dan sign-in melalui `workers.dev`.

Environment production sebaiknya memakai required reviewers. Jangan push ke `main` untuk mencoba konfigurasi; gunakan pemeriksaan lokal dan branch PR.

## Provisioning baru

Untuk environment Cloudflare baru:

1. autentikasi Wrangler;
2. buat D1 `masjid-journal` dan catat ID-nya;
3. buat R2 `masjid-journal-proofs` dan `masjid-journal-response-cache`;
4. perbarui ID dan binding di `wrangler.jsonc` serta `cloudflare.config.ts`;
5. pastikan migration Durable Object tetap tercantum;
6. tambahkan domain Worker dan DNS;
7. buat atau hubungkan instance Clerk production;
8. simpan variable dan secret Worker;
9. simpan secret dan variable GitHub environment;
10. terapkan migrasi D1, deploy, lalu verifikasi flow utama.

## Migrasi dan rollback

Migrasi D1 diterapkan sebelum Worker baru. Karena rollback Worker tidak mengembalikan schema D1, setiap migrasi harus forward-only dan kompatibel dengan versi Worker sebelum dan sesudah deployment.

Jika release bermasalah, deploy kembali versi Worker sebelumnya selama schema masih kompatibel. Jangan menghapus kolom atau data production sebagai langkah rollback spontan. Buat migrasi korektif terpisah bila schema perlu diperbaiki.

## Operasi

- Health check: `/api/health`
- Log realtime: `npx wrangler tail masjid-journal`
- Status Clerk: `npx -y clerk@latest deploy status --mode agent`
- Migrasi manual bila diperlukan: `npm run db:migrate:remote`
- Deployment manual bila diperlukan: `npm run deploy:vinext`

Setelah deployment, verifikasi sign-in, dashboard, pembuatan transaksi, perubahan saldo, upload dan preview bukti, laporan, serta akses berdasarkan role.

