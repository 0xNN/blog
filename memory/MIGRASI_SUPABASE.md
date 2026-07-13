# Migrasi FastAPI + MongoDB → Supabase Edge Functions + Postgres

**Tujuan:** Biaya $0 total tanpa kartu kredit.
- Backend: Supabase Edge Functions (Deno/TypeScript)
- Database: Supabase Postgres 500MB
- Auth: Supabase Auth (built-in, 50K users)
- Storage: Supabase Storage 1GB
- Frontend: Vercel free tier

**Prinsip:** Minimal rewrite. Semua logika bisnis tetap, hanya platform berubah.

---

## Arsitektur Baru

```
Frontend (React/Vite) ──→ Supabase Edge Functions (Deno)
                              ├── Supabase Auth
                              ├── Supabase Postgres
                              └── Supabase Storage
```

- **Supabase Client SDK** (`supabase-js`) langsung dari frontend untuk:
  - Login/register (Supabase Auth)
  - Mutasi sederhana (subscribe, comment) via RLS
  - Upload gambar ke Storage
- **Edge Functions** untuk endpoint kompleks yang butuh:
  - Artikel CRUD (search, pagination, related articles)
  - Affiliate link CRUD + redirect
  - Analytics aggregation
  - SEO (sitemap, rss)
  - AI (Claude via fetch)

---

## Fase 1 — Setup Supabase + Schema (1 hari)

### 1.1 Setup Project
- Buat Supabase project (free tier)
- Ambil `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- Install Supabase CLI: `npm install -g supabase`
- Init: `supabase init` di `backend_supabase/`

### 1.2 Database Schema (PostgreSQL)
Ganti 9 MongoDB collections → 7 SQL tables:

```sql
CREATE TABLE articles (id UUID PK, author_id UUID FK, category_slug TEXT,
  tags TEXT[], cover_image TEXT, ads_enabled BOOL, featured BOOL,
  status TEXT, views INT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ, reading_time INT,
  content_id JSONB, content_en JSONB);
CREATE INDEX ON articles(content_id->>'slug');
CREATE INDEX ON articles(content_en->>'slug');

CREATE TABLE comments (id UUID PK, article_id UUID FK, user_id UUID FK,
  body TEXT, parent_id UUID, upvotes INT, status TEXT, created_at TIMESTAMPTZ);

CREATE TABLE subscribers (id UUID PK, email TEXT UNIQUE, active BOOL, created_at TIMESTAMPTZ);

CREATE TABLE invites (id UUID PK, token TEXT UNIQUE, email TEXT, name TEXT,
  role TEXT, invited_by TEXT, invited_by_id UUID, status TEXT,
  expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ);

CREATE TABLE affiliate_links (id UUID PK, name TEXT, url TEXT, merchant TEXT,
  category_slug TEXT, description TEXT, image_url TEXT,
  clicks INT, active BOOL, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ);

CREATE TABLE affiliate_clicks (id UUID PK, link_id UUID FK, article_id UUID,
  ip TEXT, created_at TIMESTAMPTZ);

CREATE TABLE article_views (key TEXT UNIQUE, article_id UUID, ip TEXT, created_at TIMESTAMPTZ);
```

**Yang dihapus** (diganti Supabase built-in):
- `users` → Supabase `auth.users` + metadata custom
- `revoked_tokens` → tidak perlu (Supabase Auth handle lifecycle)
- `files` → Supabase Storage

### 1.3 Auth Setup
- Supabase Auth: email/password + Google OAuth (gratis, tanpa card)
- Role & profile: `user_profiles` table dengan sync trigger dari `auth.users`

---

## Fase 2 — Edge Functions (2-3 hari)

Ganti ~30 endpoint FastAPI dengan Edge Functions Deno:

### 2.1 Auth — DIHAPUS (pakai Supabase Auth langsung)
Frontend pakai `supabase.auth.signInWithPassword()` / `signUp()` / `signOut()`. 
Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google' })`.

### 2.2 Public Edge Functions (10 functions)
| Function | Endpoint | Info |
|----------|----------|------|
| categories | GET /categories | list + count per category |
| articles-list | GET /articles | filter, search, pagination |
| articles-get | GET /articles/:slug | detail + view counter |
| articles-related | GET /articles/:id/related | by tags/category |
| articles-siblings | GET /articles/:id/siblings | id/en slug |
| authors | GET /authors, /authors/:slug | list & detail |
| sitemap | GET /sitemap.xml | XML sitemap |
| rss | GET /rss.xml | RSS feed |
| ads-txt | GET /ads.txt | ads.txt |
| affiliate-redirect | GET /r/:id | 302 + track click |

### 2.3 Protected Edge Functions (auth required)
| Function | Role | Info |
|----------|------|------|
| articles create/update/delete | author+ | CRUD artikel |
| comments create/delete | any user | komentar |
| comments moderate | editor+ | admin komentar |
| subscribe/subscribers | public/list | newsletter |
| invites CRUD | editor+ | undangan author |
| analytics | editor+ | dashboard |
| ai-generate | any user | Claude AI |
| affiliate links CRUD | editor+ | link afiliasi |
| upload | any user | upload ke Supabase Storage |

### 2.4 CORS Handler
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

---

## Fase 3 — Frontend Update (1 hari)

### 3.1 Install Supabase Client
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 3.2 Ganti Autentikasi
- Buat `src/lib/supabase.js` — Supabase client
- Hapus refresh-on-401 interceptor di `api.js` (tidak perlu lagi)
- Login: `supabase.auth.signInWithPassword()`
- Register: `supabase.auth.signUp()`
- Logout: `supabase.auth.signOut()`
- Google OAuth: `supabase.auth.signInWithOAuth()`

### 3.3 Ganti API Calls
- API call dari `import api from '@/lib/api'` → panggil Edge Functions URL
- Atau via Supabase client langsung untuk query sederhana

### 3.4 Env Vars
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_EDGE_FUNCTIONS_URL=https://xxxxx.functions.supabase.co
```
Hapus `VITE_BACKEND_URL`.

### 3.5 Deploy Frontend ke Vercel
```bash
npm install -g vercel
cd frontend && vercel --prod
```
Vercel hobby = gratis, tanpa kartu kredit.

---

## Ringkasan File

| File | Aksi |
|------|------|
| `backend/` | **Hapus** — diganti Edge Functions |
| `backend_supabase/supabase/functions/*.ts` | **Baru** — ~20 Edge Functions |
| `backend_supabase/supabase/migrations/` | **Baru** — schema + RLS |
| `frontend/src/lib/supabase.js` | **Baru** |
| `frontend/src/lib/api.js` | **Ubah** — tambah Supabase client |
| `frontend/src/pages/Login.jsx` | **Ubah** — Supabase Auth |
| `frontend/src/pages/Register.jsx` | **Ubah** — Supabase Auth |
| `frontend/src/pages/AuthCallback.jsx` | **Ubah** — OAuth callback |
| `frontend/.env` | **Ubah** — SUPABASE vars |
| `memory/ROADMAP_V2.md` | **Tidak berubah** |

---

## Estimasi Effort

| Fase | Isi | Waktu |
|------|-----|-------|
| Fase 1 | Schema + Auth setup | ½ hari |
| Fase 2 | 20 Edge Functions (Deno) | 1-2 hari |
| Fase 3 | Frontend update + deploy | ½-1 hari |
| **Total** | | **~3 hari** |

Setelah migrasi: **biaya $0** (Supabase free + Vercel hobby), **tanpa kartu kredit**.
