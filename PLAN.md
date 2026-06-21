# Masjid Finance Tracker — Implementation Plan

## Context

Masjid saat ini mencatat keuangan manual di Google Sheet, upload bukti transaksi ke Google Drive, lalu paste link ke sheet. Proses ini menyulitkan karena input transaksi sering dilakukan dari lapangan/HP.

**Target**: PWA mobile-first yang bisa di-install di HP, gratis untuk hosting/database/storage, dengan pencatatan ledger lengkap.

**Infrastruktur 100% gratis**: Vercel (hosting) + Supabase (DB & storage) + Better Auth (auth) — Rp 0 per bulan.

**Repo**: `git@github.com:agung/masjid-journal.git` (masih perlu dicek akses SSH / buat repo dulu di GitHub).

---

## Tech Stack

| Layer | Choice | Cost |
|---|---|---|
| Framework | Next.js 15 App Router, TypeScript strict | Free |
| UI | Tailwind CSS + shadcn/ui (mobile-first) | Free |
| Auth | Better Auth: email/password + magic link | Free (OSS) |
| Database | Supabase PostgreSQL (500MB) | Free |
| ORM | Drizzle ORM + migrations | Free |
| File Storage | Supabase Storage (1GB) — ganti Google Drive | Free |
| Hosting | Vercel Hobby (100GB bw/month) | Free |
| PWA | Serwist + manifest + service worker | Free |
| Validation | Zod + React Hook Form | Free |

---

## Fitur Utama

### Multi-Masjid (Multi-Tenant)
- Setiap record punya `organization_id`.
- User bisa jadi anggota >1 masjid (bendahara bisa handle beberapa masjid).
- Semua query WAJIB filter by organization.

### Multi-Role
| Role | Permission |
|---|---|
| `owner` | Full access, manage users, delete data |
| `admin` | Manage master data, transactions, reports |
| `treasurer` | Create/edit transactions, upload proof, view reports |
| `viewer` | Read-only dashboard, ledger, reports |

### 6 Tipe Transaksi
| Type | Movement |
|---|---|
| ✅ **Income** (Pemasukan) | 1 movement `in` ke target akun |
| ✅ **Expense** (Pengeluaran) | 1 movement `out` dari sumber akun |
| ✅ **Transfer** (antar holder) | 2 movements: source `out` + dest `in` |
| ✅ **Deposit** (setor ke bank) | 2 movements: holder `out` + bank `in` |
| ✅ **Withdrawal** (tarik dari bank) | 2 movements: bank `out` + holder `in` |
| ✅ **Adjustment** (koreksi) | 1 movement, owner/admin only |

### Ledger Movement
Setiap baris menampilkan:
```
Tanggal | No.Trans | Tipe | Keterangan | Kategori | Akun | +/- | Amount | Balance Before | Balance After | Input By | Bukti
```

Transaksi multi-movement (transfer/deposit/withdrawal) muncul sebagai 2 baris dengan warna link.

### Upload Bukti
- Upload foto dari kamera HP langsung.
- Simpan di Supabase Storage path: `{org_id}/{yyyy}/{mm}/{tx_id}-{filename}`.
- Tampilkan preview/link di ledger dan detail transaksi.

---

## Database Schema

### accounts (holders & banks dalam 1 tabel)

```sql
id uuid PK
organization_id uuid FK → organizations
kind text: 'cash_holder' | 'bank'
name text
holder_name text          -- untuk cash holder
holder_user_id uuid       -- opsional, link ke user
bank_name text            -- untuk bank
account_number text
account_holder_name text
initial_balance bigint default 0
is_active boolean default true
created_by uuid FK → users
created_at, updated_at
```

### transactions

```sql
id uuid PK
organization_id uuid FK → organizations
transaction_no text         -- INC-202506-0001
type text: income | expense | transfer | deposit | withdrawal | adjustment
transaction_date date
amount bigint > 0
category_id uuid FK → categories
description text
notes text
proof_storage_path text
proof_public_url text
created_by uuid FK → users
updated_by uuid
created_at, updated_at
UNIQUE (organization_id, transaction_no)
```

### transaction_movements

```sql
id uuid PK
organization_id uuid FK → organizations
transaction_id uuid FK → transactions
account_id uuid FK → accounts
direction text: 'in' | 'out'
amount bigint > 0
signed_amount bigint   -- positif untuk 'in', negatif untuk 'out'
balance_before bigint  -- snapshot dari balance account sebelum movement
balance_after bigint   -- balance_before + signed_amount
created_at timestamptz
```

### categories (seed data)

**Income**: Infak Jumat, Infak Kotak Amal, Zakat, Donasi, Wakaf, Lain-lain  
**Expense**: Operasional, ATK, Kebersihan, Air/Listrik, Konsumsi, Transport, Perawatan Bangunan, Honor/Kegiatan, Lain-lain

> Semua kategori bertipe `is_system = true` (default) + `organization_id = null` (global).

---

## Halaman Web

| Route | Page |
|---|---|
| `/login` | Login email/password |
| `/register` | Register akun baru |
| `/ dashboard` | Summary saldo total, kas tunai, bank, income/expense bulan ini |
| `/transactions` | Ledger movement list with filters |
| `/transactions/new` | Smart transaction form (step-by-step by type) |
| `/transactions/[id]` | Detail transaksi + movements |
| `/accounts` | List all accounts (holder & bank) + balance |
| `/accounts/new` | Create holder or bank account |
| `/categories` | Manage categories |
| `/reports` | Monthly report + printable |
| `/settings/members` | Manage organization members & roles |
| `/settings/organization` | Profile masjid |

**Mobile Nav**: `Dashboard | Ledger | + Input | Laporan | Settings`

---

## Implementation Phases

### Phase 1: Project Foundation
1. `npm create next-app@latest` — App Router, TypeScript, Tailwind
2. Install dependencies: shadcn/ui, Drizzle, Supabase client, Better Auth, Zod, React Hook Form
3. Config: `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `components.json`
4. Base layout with mobile-first viewport meta
5. **Commit**: `feat: initialize next.js project with tailwind and shadcn/ui`

### Phase 2: Auth & Organizations
1. Configure Better Auth: auth.ts, auth-client.ts, API route
2. Login page, register page, middleware
3. Organization creation flow (create org after first login)
4. Member management (invite + role assignment)
5. Role guard helpers: `requireAuth()`, `requireOrg()`, `requireRole([...])`
6. Protect all `/app` routes with middleware
7. **Commit**: `feat: add authentication, organizations, and role-based access`

### Phase 3: Database Schema & Seed
1. Drizzle schema definitions for all 7 tables
2. Run migration + push to Supabase
3. Seed script: 2 default income, 2 default expense categories
4. Seed script: register `is_system = true` for default categories
5. Indexes on query-critical columns
6. **Commit**: `feat: add database schema with drizzle and migrations`

### Phase 4: Accounts CRUD
1. Account list page with groups: cash holders / bank accounts
2. Show latest balance per account (query from last movement)
3. Create cash holder form
4. Create bank account form
5. Toggle active/inactive
6. **Commit**: `feat: add accounts management for holders and banks`

### Phase 5: Transaction Engine
1. Server action `createTransaction(input)`: validate with Zod, generate movements
2. Transaction number generation per organization per month
3. Movement logic: income/expense → 1 movement; transfer/deposit/withdrawal → 2 movements
4. Balance calculation: snapshot `balance_before` from last movement, compute `balance_after`
5. Validation: source/destination accounts must be active, same organization, valid type
6. Audit log on create/edit/delete
7. **Commit**: `feat: implement transaction engine with movement and balance calculation`

### Phase 6: Transaction UI & Ledger View
1. Smart transaction form: step 1 pick type, step 2 dynamic fields per type
2. Dynamic dropdown: filter accounts by kind (cash_holder / bank) as appropriate
3. Ledger list with movement-level rows: date, no, type, description, category, account, +/- amount, balance before, balance after, input by, proof
4. Filters: month/date range, account, transaction type, category
5. Transaction detail page showing header + all movement rows + proof
6. **Commit**: `feat: add transaction form and ledger view with movement display`

### Phase 7: Proof Upload
1. Supabase Storage bucket: `proof-images`
2. Upload component: `input[type=file]` with camera capture (`accept="image/*" capture="environment"`)
3. Upload path: `{org_id}/{yyyy}/{mm}/{tx_id}-{filename}`
4. Store `proof_storage_path` + generate `proof_public_url`
5. Display proof thumbnail in ledger rows and detail page
6. Client-side image compression (optional, `browser-image-compression`)
7. **Commit**: `feat: add proof photo upload with supabase storage`

### Phase 8: Dashboard & Reports
1. Summary cards: total cash, total bank, total all, income + expense this month
2. Recent 5 movements with quick view
3. Monthly breakdown: opening balance, total in/out, closing balance, by category
4. Printable report page (`@media print` styles)
5. **Commit**: `feat: add dashboard summary and monthly reports`

### Phase 9: PWA & Deployment
1. `public/manifest.json`: name, icons (192, 512), display standalone, theme colors
2. Service worker via Serwist for static asset caching
3. Icons: generate proper sized PNGs for mobile home screen
4. Deploy to Vercel: connect GitHub repo, set env vars
5. Manual test: install from Android/iPhone, test camera upload, test offline resilience
6. **Commit**: `feat: add pwa support and deploy to vercel`

---

## Folder Structure

```
masjid-journal/
├── app/
│   ├── (auth)/login/
│   ├── (auth)/register/
│   ├── (app)/
│   │   ├── layout.tsx          ← bottom nav + auth guard
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   │   ├── page.tsx        ← ledger
│   │   │   ├── new/page.tsx    ← form
│   │   │   └── [id]/page.tsx   ← detail
│   │   ├── accounts/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── categories/
│   │   ├── reports/
│   │   └── settings/
│   │       ├── members/
│   │       └── organization/
│   ├── layout.tsx              ← root layout
│   ├── manifest.ts
│   └── globals.css
├── components/
│   ├── ui/                     ← shadcn components
│   ├── layout/
│   │   └── bottom-nav.tsx
│   ├── transactions/
│   │   ├── transaction-form.tsx
│   │   ├── ledger-table.tsx
│   │   ├── ledger-row.tsx
│   │   └── proof-upload.tsx
│   ├── accounts/
│   │   └── account-form.tsx
│   └── dashboard/
│       ├── summary-cards.tsx
│       └── income-expense-chart.tsx
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── supabase.ts
│   ├── utils.ts
│   ├── formatters.ts
│   ├── validations/
│   │   └── transaction.ts      ← Zod schemas
│   └── server/
│       ├── transactions.ts     ← server actions
│       ├── accounts.ts
│       ├── categories.ts
│       ├── reports.ts
│       └── storage.ts
├── drizzle/
│   └── schema.ts
├── public/
│   ├── manifest.json
│   └── icons/
├── CLAUDE.md
├── PLAN.md
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Verification Plan

### Test Case Skenario Transaksi

1. **Setup**: Buat masjid → 2 holders (A: Rp1jt, B: Rp200rb) → 1 bank BSI: Rp2jt
2. **Income**: Rp500rb → Hold A → verify +500rb, before/after = 1jt/1,5jt
3. **Expense**: Rp50rb ← Hold A → verify -50rb, before/after = 1,5jt/1,45jt
4. **Deposit**: Rp300rb Hold A → Bank BSI → 2 movements:
   - Hold A: -300rb, before/after = 1,45jt/1,15jt
   - Bank: +300rb, before/after = 2jt/2,3jt
5. **Withdrawal**: Rp100rb Bank → Hold B → 2 movements:
   - Bank: -100rb, after = 2,2jt
   - Hold B: +100rb, after = 300rb
6. **Transfer**: Rp100rb Hold A → Hold B → 2 movements:
   - A: -100rb, after = 1,05jt
   - B: +100rb, after = 400rb
7. **Ledger**: filter by month → verify semua column sesuai format movement
8. **Role test**: login viewer → cannot create transaction; login treasurer → can create but cannot manage members
9. **Upload**: foto bukti dari HP → verify muncul di storage + link di ledger

### Technical Checks

```bash
npm run lint
npm run typecheck
npm run build
```

Manual: buka dari HP → add to home screen → test all flows.
