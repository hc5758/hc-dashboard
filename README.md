# HC Dashboard 5758 — Setup & Deploy Guide

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Cookie-based password auth
- **Deploy**: Vercel
- **Excel import**: XLSX library (client-side parsing)
- **Sheets sync**: Google Apps Script webhook

---

## 1. Setup Supabase

1. Buka [supabase.com](https://supabase.com) → New project
2. Catat: Project URL, anon key, service role key
3. Buka **SQL Editor** → paste dan run `supabase/migrations/001_schema.sql`
4. Paste dan run `supabase/migrations/002_seed.sql` (dummy data)

---

## 2. Setup Local

```bash
# Clone / extract project
cd hc-web

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DASHBOARD_PASSWORD=hc5758
GOOGLE_SHEETS_WEBHOOK_SECRET=buat-random-string-panjang
```

```bash
# Run development
npm run dev
```

Buka http://localhost:3000 → login dengan password dari `.env.local`

---

## 3. Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Atau via GitHub:
1. Push ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import project
3. Set environment variables (sama seperti `.env.local`)
4. Deploy!

---

## 4. Import Excel

Format kolom yang dikenali:

| Kolom wajib | Kolom opsional |
|---|---|
| Employee ID | Email, No HP |
| Nama (atau Nama Lengkap) | Level, Lokasi Kerja |
| Posisi | Gender, Tgl Lahir |
| Divisi | Status Nikah |
| Entitas (SSR / Nyambee (PAT) / PAT-5758) | End Date |
| Tipe (PKWTT / PKWT) | |
| Join Date (format: YYYY-MM-DD) | |

→ Workforce page → tombol **Import Excel** → pilih file .xlsx

---

## 5. Google Sheets Sync

1. Buka Google Sheets berisi data karyawan
2. Extensions → Apps Script
3. Paste isi file `scripts/google-apps-script.js`
4. Ganti `DASHBOARD_URL` dengan URL Vercel kamu
5. Ganti `WEBHOOK_SECRET` dengan nilai yang sama di `.env.local`
6. Save → Run `onOpen` → Authorize
7. Reload Sheets → akan ada menu **🔄 HC Dashboard 5758** di toolbar

### Sync endpoint:
- **Push** (Sheets → Dashboard): `POST /api/sync` dengan header `x-webhook-secret`
- **Pull** (Dashboard → Sheets): `GET /api/sync?table=employees&secret=...`

### Tables yang bisa di-sync:
- `employees`
- `recruitment`
- `onboarding`
- `offboarding`
- `tna_records`

---

## 6. Ganti Password

Edit environment variable `DASHBOARD_PASSWORD` di Vercel dashboard → Redeploy.

---

## Struktur file penting

```
src/
├── app/
│   ├── login/page.tsx              ← halaman login
│   ├── api/
│   │   ├── auth/login/route.ts     ← cookie auth
│   │   ├── employees/route.ts      ← CRUD karyawan
│   │   ├── recruitment/route.ts    ← CRUD rekrutmen
│   │   ├── tna/route.ts            ← CRUD TNA
│   │   ├── upload/employees/       ← import Excel
│   │   └── sync/route.ts           ← Google Sheets webhook
│   └── (auth)/                     ← semua halaman (protected)
│       ├── dashboard/              ← overview + checklist
│       ├── workforce/              ← data karyawan + import
│       ├── recruitment/            ← pipeline + funnel
│       ├── turnover/               ← resign + offboarding
│       ├── attendance/             ← cuti + absensi
│       ├── performance/            ← PIP/SP monitoring
│       ├── learning/               ← TNA tracker
│       ├── engagement/             ← survey data
│       └── payroll/                ← salary overview
├── components/
│   ├── layout/Sidebar.tsx
│   ├── layout/Topbar.tsx
│   └── ui/index.tsx                ← shared components
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   └── utils.ts
└── middleware.ts                   ← auth guard
```
