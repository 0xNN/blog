# Deploy Guide — MSNCode

Target arsitektur (semua di bawah 1 domain `msncode.dev`, browser hanya bicara ke frontend → tanpa CORS):

| Bagian | Subdomain | Host | Biaya |
|---|---|---|---|
| Frontend (Vite + React 19) | `blog.msncode.dev` | Vercel | Gratis (Hobby) / Pro |
| Backend (Edge Functions) | — | Supabase (hosted) | Free tier |
| Database (PostgreSQL) | — | Supabase (hosted) | Free tier |
| Storage (blog-images) | — | Supabase Storage | Free tier |

Frontend mem-proxy `/api/*`, `/r/*`, `/ads.txt`, `/sitemap.xml`, `/rss.xml` ke Supabase Edge Functions via `frontend/vercel.json`, jadi dari sisi browser semuanya **sama-origin** (`blog.msncode.dev`).

---

## FASE 1 — Setup Supabase Project

1. Buat project baru di [supabase.com](https://supabase.com) → pilih Free tier.
2. Catat **Project URL** dan **anon/publishable key** (Settings → API).
3. Catat **service_role key** (Settings → API) — JANGAN pernah taruh di frontend.
4. Set site URL ke `https://blog.msncode.dev` (Settings → Auth → URL Configuration).
5. Tambah redirect URLs (Settings → Auth → URL Configuration):
   - `https://blog.msncode.dev`
   - `https://blog.msncode.dev/id/auth/callback`
   - `https://blog.msncode.dev/en/auth/callback`
6. (Opsional) Aktifkan Google OAuth: Settings → Auth → Providers → Google → isi Client ID + Secret dari Google Cloud Console.

---

## FASE 2 — Deploy Database Schema & Seed

1. **Jalankan migrations** — push semua file di `backend_supabase/supabase/migrations/` ke Supabase:
   ```bash
   cd backend_supabase
   supabase db push
   ```
   Atau copy-paste isi file SQL ke Supabase Dashboard → SQL Editor:
   - `20260713000000_init.sql` — skema lengkap (tabel, index, RLS, trigger)
   - `20260713120000_reader_role_comments_lockdown.sql` — role reader + lockdown

2. **Seed data (opsional, untuk testing)** — copy-paste isi `supabase/seed.sql` ke SQL Editor. Ini membuat 3 user demo + 3 artikel + 1 affiliate link + 1 subscriber.
   > JANGAN jalankan `seed.sql` di production dengan data asli. Gunakan signup normal di app.

3. **Seed articles tambahan (opsional)** — `backend_supabase/seed_articles_new.sql`, jalankan manual via SQL Editor.

---

## FASE 3 — Deploy Edge Functions

Setiap Edge Function deploy terpisah ke Supabase:

```bash
cd backend_supabase

# Login ke Supabase CLI (sekali saja)
supabase login

# Link ke project (sekali saja)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy ketiga function
supabase functions deploy api
supabase functions deploy redirect
supabase functions deploy seo
```

Atau bisa juga via Supabase Dashboard → Edge Functions → Deploy (copy-paste kode dari `backend_supabase/supabase/functions/`).

---

## FASE 4 — Set Edge Function Secrets

Di Supabase Dashboard → Edge Functions → Secrets (atau via `supabase secrets set`):

```bash
supabase secrets set \
  SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  SUPABASE_ANON_KEY=your-anon-key \
  FRONTEND_URL=https://blog.msncode.dev \
  EMERGENT_LLM_KEY=your-anthropic-api-key \
  RESEND_API_KEY=your-resend-key-optional
```

| Key | Wajib? | Kegunaan |
|---|---|---|
| `SUPABASE_URL` | Ya | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Bypass RLS untuk operasi admin/role elevation |
| `SUPABASE_ANON_KEY` | Ya | Validasi JWT user di `getUser()` |
| `FRONTEND_URL` | Ya | URL frontend untuk invite links, sitemap, RSS |
| `EMERGENT_LLM_KEY` | Opsional | Anthropic API key untuk AI generate (`POST /api/ai/generate`) |
| `RESEND_API_KEY` | Opsional | Email service (newsletter, invites) |

> Catatan: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `SUPABASE_ANON_KEY` biasanya sudah auto-injected oleh Supabase platform. Hanya perlu set manual untuk local dev atau jika override diperlukan.

---

## FASE 5 — Deploy Frontend ke Vercel

1. **Import repo ke Vercel** → New Project → pilih repo ini.
2. **Root Directory: `frontend`** (WAJIB — repo ini monorepo backend+frontend).
3. Framework otomatis terdeteksi **Vite**. Build command `npm run build`, Output `dist`.
   - Install command sudah di-set di `vercel.json`: `npm install --legacy-peer-deps` (wajib karena React 19 peer conflicts).
4. **Environment variables** (Vercel → Settings → Environment Variables):
   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | anon/publishable key dari Supabase |
   | `VITE_EDGE_FUNCTIONS_URL` | **kosong** (Vercel proxy menangani) atau `https://YOUR_PROJECT_REF.functions.supabase.co` |
   | `VITE_SITE_URL` | `https://blog.msncode.dev` (opsional, default `window.location.origin`) |
5. Deploy. Anda dapat URL `*.vercel.app` → pastikan situs tampil.
6. **Tambah domain**: project → Settings → Domains → `blog.msncode.dev`.
7. **Di Porkbun** (DNS `msncode.dev`) tambah record:
   ```
   Type: CNAME   Host: blog   Answer: cname.vercel-dns.com   TTL: 600
   ```
8. Tunggu propagasi. Vercel provision **SSL gratis** otomatis (`.dev` = HTTPS wajib).

### Vercel rewrite rules (`frontend/vercel.json`)

Sudah dikonfigurasi di repo:
- `/api/*` → `https://YOUR_PROJECT.functions.supabase.co/api/*`
- `/r/*` → `https://YOUR_PROJECT.functions.supabase.co/redirect/*`
- `/ads.txt` → `https://YOUR_PROJECT.functions.supabase.co/seo/ads.txt`
- `/sitemap.xml` → `https://YOUR_PROJECT.functions.supabase.co/seo/sitemap.xml`
- `/rss.xml` → `https://YOUR_PROJECT.functions.supabase.co/seo/rss.xml`
- `/(.*)` → `/index.html` (SPA fallback biar `/id/blog/...` tidak 404)

> Ganti `YOUR_PROJECT` di `vercel.json` dengan project ref Supabase Anda sebelum deploy, atau set via env var jika menggunakan Vercel's environment variable substitution.

---

## Local Development

### Backend (local Supabase)
```bash
cd backend_supabase
supabase start                    # start local Supabase (Postgres, Auth, Storage, Edge Functions)
supabase db reset                 # reset DB + run migrations + seed.sql
supabase functions serve api --env-file ./supabase/.env
```
Local URLs: Studio `http://localhost:54323`, API `http://localhost:54321`, Auth `http://localhost:54322`.

### Frontend (local Vite)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev                       # Vite dev server on port 3000
```

Frontend `.env` untuk local dev:
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_EDGE_FUNCTIONS_URL=http://localhost:54321
```

---

## Catatan biaya / komersial
- Subdomain `blog.msncode.dev`: **gratis** (domain sudah dibayar di Porkbun).
- **Supabase Free tier**: 500MB database, 1GB storage, 50k monthly active users — cukup untuk blog awal.
- **Vercel Hobby = non-komersial** per ToS. Begitu pasang iklan/afiliasi (komersial), pindahkan frontend ke **Cloudflare Pages** (free, boleh komersial) atau upgrade **Vercel Pro**.

---

## Checklist deploy production
1. [ ] Supabase project dibuat, URL + keys dicatat
2. [ ] Migrations di-push (`supabase db push` atau SQL Editor)
3. [ ] Seed data dijalankan (hanya untuk testing, skip untuk production bersih)
4. [ ] Edge Functions di-deploy (`api`, `redirect`, `seo`)
5. [ ] Secrets di-set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `FRONTEND_URL`, `EMERGENT_LLM_KEY`)
6. [ ] Storage bucket `blog-images` ada dan public
7. [ ] Google OAuth dikonfigurasi (opsional)
8. [ ] Frontend `.env` / Vercel env vars di-set
9. [ ] `vercel.json` di-update dengan project ref Supabase yang benar
10. [ ] Domain `blog.msncode.dev` ditambahkan di Vercel + DNS Porkbun
11. [ ] Test: signup, login, baca artikel, tulis artikel, komentar, affiliate redirect, sitemap.xml, rss.xml
12. [ ] Ganti email kontak placeholder di `Contact.jsx` & `PrivacyPolicy.jsx`
13. [ ] Buat owner account pertama via signup normal (atau via SQL untuk pastikan role owner)
14. [ ] Isi konten (~15-20 artikel) → daftar AdSense
