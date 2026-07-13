# Deploy Guide — Developer Hub

Target arsitektur (semua di bawah 1 domain `msncode.dev`, browser hanya bicara ke frontend → tanpa CORS, cookie login jalan):

| Bagian | Subdomain | Host | Biaya |
|---|---|---|---|
| Frontend (Vite) | `blog.msncode.dev` | Vercel / Cloudflare Pages | Gratis |
| Backend (FastAPI) | `api.msncode.dev` | Railway / Render / Fly | Free tier |
| Database | — | MongoDB Atlas **M0** | Gratis |

Frontend mem-proxy `/api/*` ke backend via `frontend/vercel.json`, jadi dari sisi browser semuanya **sama-origin** (`blog.msncode.dev`).

---

## FASE 1 — Deploy Frontend ke `blog.msncode.dev`

> Situs sudah bisa tampil (halaman About/Contact/Privacy siap untuk AdSense). Data belum muncul sampai backend (Fase 2) hidup — itu normal.

1. **Import repo ke Vercel** → New Project → pilih repo ini.
2. **Root Directory: `frontend`** (WAJIB — repo ini monorepo backend+frontend).
3. Framework otomatis terdeteksi **Vite**. Build command `pnpm build`, Output `dist` (default, karena `pnpm-lock.yaml` sudah ada Vercel pakai pnpm).
4. Deploy. Anda dapat URL `*.vercel.app` → pastikan situs tampil.
5. **Tambah domain**: project → Settings → Domains → `blog.msncode.dev`.
6. **Di Porkbun** (DNS `msncode.dev`) tambah record — sama pola dengan `www` Anda:
   ```
   Type: CNAME   Host: blog   Answer: cname.vercel-dns.com   TTL: 600
   ```
7. Tunggu propagasi. Vercel provision **SSL gratis** otomatis (`.dev` = HTTPS wajib).

Routing sudah diatur `vercel.json`:
- `/api/*`, `/ads.txt`, `/sitemap.xml`, `/rss.xml` → di-proxy ke `https://api.msncode.dev`
- sisanya → `index.html` (SPA, biar `/id/blog/...` tidak 404)

> Env di production: **tidak perlu set apa-apa**. `VITE_BACKEND_URL` kosong → API jadi `/api` (di-proxy). `SITE_URL` untuk SEO otomatis pakai `window.location.origin`.

---

## FASE 2 — Deploy Backend ke `api.msncode.dev`

### 2a. MongoDB Atlas (M0 gratis)
1. Buat cluster M0 → Database Access: buat user+password.
2. Network Access: allow `0.0.0.0/0` (atau IP host backend).
3. Ambil connection string: `mongodb+srv://USER:PASS@cluster.mongodb.net`.

### 2b. Backend (Railway / Render)
1. New project dari repo → **Root Directory: `backend`**.
2. **Build/Install command**: `pip install -r requirements-prod.txt`
   ⚠️ JANGAN pakai `requirements.txt` — ada `emergentintegrations` (tidak di PyPI) & `jq` (butuh kompilasi) → build gagal. `requirements-prod.txt` = set ramping hanya dependensi runtime (AI writer & upload gambar nonaktif; artikel/komentar/auth/newsletter/affiliate jalan).
3. Start command (sudah ada juga di `backend/Procfile`):
   ```
   uvicorn server:app --host 0.0.0.0 --port $PORT
   ```
4. **Environment variables**:
   | Key | Value |
   |---|---|
   | `MONGO_URL` | connection string Atlas |
   | `DB_NAME` | `developer_hub` |
   | `JWT_SECRET` | string acak (`python -c "import secrets;print(secrets.token_urlsafe(48))"`) |
   | `FRONTEND_URL` | `https://blog.msncode.dev` |
   | `EMERGENT_LLM_KEY` | (opsional — kosongkan, lihat catatan) |
   | `RESEND_API_KEY` | (opsional — kosongkan → email jadi no-op) |
5. **Custom domain** backend → `api.msncode.dev`. Di Porkbun tambah CNAME `api` → target yang diberi Railway/Render. (SSL otomatis.)

### 2c. Cookie auth di production (disarankan)
Backend saat ini set cookie `secure=False` (`backend/auth.py > set_auth_cookies`). Lewat proxy sama-origin sebenarnya sudah jalan, tapi untuk produksi HTTPS sebaiknya `secure=True`. Ubah bila perlu.

---

## ⚠️ Fitur "Emergent-only" (tidak jalan di luar platform Emergent)
Backend ini dibuat di platform Emergent. Beberapa fitur bergantung layanan Emergent dan **tidak akan berfungsi di self-host** tanpa diganti:

| Fitur | Status self-host | Solusi nanti |
|---|---|---|
| AI writer (`ai_service.py`) | ❌ butuh `emergentintegrations` + Emergent gateway | Port ke Anthropic API langsung (`anthropic` SDK, model `claude-sonnet-4-x`) |
| Upload gambar (`storage.py`) | ❌ Emergent Object Storage | Ganti ke S3/Cloudflare R2; sementara pakai cover via URL |
| Login Google (`/auth/emergent/session`) | ❌ Emergent OAuth | Pakai Google OAuth langsung, atau cukup email/password |

**Yang JALAN normal di self-host:** login email/password (JWT), artikel (CRUD/baca), komentar, newsletter (Resend), **fitur affiliate**, RSS/sitemap/ads.txt. Cukup untuk blog + monetisasi afiliasi.

> Karena `ai_service.py` sudah lazy-import, backend tetap hidup walau `emergentintegrations` tidak terpasang (endpoint AI akan balas error 500 bila dipanggil — aman diabaikan). Jadi untuk Fase 2 pakai `requirements.txt` apa adanya; kalau `emergentintegrations` gagal di-install di host, hapus baris itu atau pakai `requirements-local.txt`.

---

## Catatan biaya / komersial
- Subdomain `blog.msncode.dev` & `api.msncode.dev`: **gratis** (Anda sudah bayar domain di Porkbun).
- **Vercel Hobby = non-komersial** per ToS. Begitu pasang iklan/afiliasi (komersial), pindahkan frontend ke **Cloudflare Pages** (free, boleh komersial) atau upgrade **Vercel Pro**. Untuk tahap tes sekarang, Hobby dulu aman.

---

## Ringkas: urutan eksekusi
1. Fase 1 (frontend) → situs live di `blog.msncode.dev`, cek About/Contact/Privacy.
2. Ganti email kontak placeholder (`hello@msncode.dev`) di `Contact.jsx` & `PrivacyPolicy.jsx`.
3. Fase 2 (backend + Atlas) → `api.msncode.dev`, data muncul, login jalan.
4. Isi konten (~15–20 artikel) → daftar AdSense.
