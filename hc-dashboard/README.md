# HC Dashboard — 5758 Creative Lab
Portal Internal Human Capital · Next.js + Supabase + Google Apps Script

---

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Sync**: Google Apps Script (2-arah, realtime)
- **Deploy**: Vercel (free tier)

---

## Setup: Langkah demi Langkah

### 1. Clone & install dependencies
```bash
npm install
cp .env.local.example .env.local
```

### 2. Setup Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Pergi ke **SQL Editor**
3. Jalankan berurutan:
   - `supabase/migrations/001_schema.sql` — buat semua tabel
   - `supabase/migrations/002_seed.sql` — isi dummy data
   - `supabase/migrations/003_admin_auth.sql` — setup admin auth trigger

4. Salin credentials dari **Settings → API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Buat admin users di Supabase Auth

Pergi ke **Authentication → Users → Add user** dan buat akun berikut:

| Email | Password | Role |
|-------|----------|------|
| admin@5758.co | Admin5758! | super_admin |
| ian@5758.co | Admin5758! | hr_manager |
| vania@5758.co | Admin5758! | hr_staff |
| arin@5758.co | Admin5758! | hr_staff |

> ⚠️ Penting: Trigger `on_auth_user_created` akan otomatis menghubungkan
> UUID auth dengan tabel `admin_users` berdasarkan email.
>
> Jika tidak berjalan otomatis, jalankan SQL ini di SQL Editor:
> ```sql
> UPDATE admin_users SET id = 'UUID-DARI-AUTH' WHERE email = 'admin@5758.co';
> ```

### 4. Jalankan aplikasi

```bash
npm run dev
# Buka http://localhost:3000
# Login: admin@5758.co / Admin5758!
```

---

## Setup Google Sheets Sync

### Cara pasang:
1. Buka Google Sheet kamu
2. **Extensions → Apps Script**
3. Copy-paste seluruh isi `scripts/google-apps-script.js`
4. Edit baris konfigurasi di atas:
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'
   const SUPABASE_KEY = 'YOUR-ANON-KEY'
   ```
5. Klik **Save** (Ctrl+S)
6. Klik **Run → onOpen** (izinkan akses saat diminta)
7. Kembali ke Google Sheet → akan ada menu baru **🔄 HC Sync**
8. Klik **🔄 HC Sync → Setup auto-trigger**

### Cara kerja:
- **Auto push**: Setiap kali kamu edit sel di Sheet, data otomatis push ke Supabase
- **Auto pull**: Setiap 10 menit, data terbaru dari Supabase ditarik ke Sheet
- **Manual push**: Menu → Push semua ke database
- **Manual pull**: Menu → Pull semua dari database

### Nama sheet yang dikenali:
| Nama Sheet | Tabel Database |
|------------|---------------|
| Karyawan | employees |
| Onboarding | onboarding |
| Offboarding | offboarding |
| TNA | tna_records |
| Recruitment | recruitment |

---

## Akses & Role

Hanya user yang terdaftar di tabel `admin_users` dengan `is_active = true` yang bisa login.
User Supabase Auth biasa tanpa entry di `admin_users` akan ditolak secara otomatis.

| Role | Akses |
|------|-------|
| super_admin | Full access + manajemen user |
| hr_manager | Semua fitur HR |
| hr_staff | Input data, lihat dashboard |

---

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables di Vercel Dashboard:
# Settings → Environment Variables
```

---

## Struktur Folder

```
src/
├── app/
│   ├── (auth)/           ← halaman yang butuh login
│   │   ├── dashboard/    ← halaman utama
│   │   ├── karyawan/     ← data karyawan
│   │   ├── onboarding/   ← checklist onboarding
│   │   ├── offboarding/  ← data resign/end contract
│   │   ├── tna/          ← training tracker
│   │   ├── recruitment/  ← pipeline rekrutmen
│   │   └── salary/       ← data salary
│   ├── api/sync/         ← webhook dari Google Sheets
│   └── login/            ← halaman login
├── components/
│   ├── dashboard/        ← semua card dashboard
│   ├── forms/            ← tabel + form input
│   └── layout/           ← sidebar + topbar
├── lib/
│   ├── supabase/         ← client & server
│   └── utils.ts          ← helper functions
├── types/index.ts        ← TypeScript types
└── middleware.ts         ← auth guard + admin check
```
