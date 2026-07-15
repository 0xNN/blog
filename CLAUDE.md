# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Developer Hub" (brand: **MSNCode**) — a bilingual (Indonesian `id` / English `en`) developer blog. **Supabase** backend (PostgreSQL + Edge Functions in Deno/TypeScript), **Vite + React 19** frontend. Hosted at `blog.msncode.dev`.

> **Migration note:** The project originally used FastAPI + MongoDB (the old `backend/` folder is now an empty `.venv` shell; ignore it). The active backend lives in `backend_supabase/`. `DEPLOY.md` and `auth_testing.md` have been updated for the current Supabase architecture.

## Commands

### Backend — Supabase (local dev)
```bash
# From backend_supabase/ — requires Supabase CLI
supabase start                    # starts local Supabase (Postgres, Auth, Storage, Edge Functions)
supabase db reset                 # resets DB + runs all migrations + seed.sql
supabase functions serve          # serve Edge Functions locally (api, redirect, seo)
supabase functions deploy api     # deploy a single function to hosted project
supabase functions deploy redirect
supabase functions deploy seo
supabase db push                  # push pending migrations to remote
```
Local Supabase URLs: Studio `http://localhost:54323`, API `http://localhost:54321`, Auth `http://localhost:54322`.

Edge Functions are Deno TypeScript. To run/test a function locally:
```bash
supabase functions serve api --env-file ./supabase/.env
```

### Frontend (`frontend/`)
```bash
npm install --legacy-peer-deps   # legacy-peer-deps required (React 19 peer conflicts)
npm run dev                       # Vite dev server on port 3000 (expects frontend/.env)
npm run build                     # production build → dist/
npm run preview                   # preview production build on port 3000
npm run test                      # placeholder (vitest not configured yet)
```

## Architecture

### Backend — Supabase Edge Functions

Active backend directory: `backend_supabase/supabase/functions/`. Three Edge Functions, each a Deno `serve()` handler:

**`api/index.ts`** — the main API (single file, ~1000 lines). A regex-based router matches request path+method to handler functions. Shared helpers: `getUser(req)` validates the Supabase JWT from the `Authorization: Bearer` header, `requireRole(user, ...roles)` checks `user_profiles.role`, `getSupabaseAdmin()` returns a `service_role` client that bypasses RLS. Routes cover: articles CRUD, comments, invites, subscribers, analytics, AI generate, image upload, affiliate links, admin comment moderation, user profile.

**`redirect/index.ts`** — affiliate redirect: `/r/<id>` → looks up `affiliate_links`, records a click in `affiliate_clicks` (with IP + optional article_id), 302-redirects to the merchant URL.

**`seo/index.ts`** — dynamic `sitemap.xml`, `rss.xml` (per-language), and `ads.txt` generation.

**`_shared/cors.ts`** — shared CORS headers + `jsonResponse`/`errorResponse` helpers (CORS is `*` open).
**`_shared/constants.ts`** — the hardcoded `CATEGORIES` array (11 categories), `Role`/`Status`/`CommentStatus`/`Lang` type exports.

**`verify_jwt = false`** for all functions (`config.toml`). Auth is enforced **in-code** via `getUser()`/`requireRole()`, not by the Supabase platform gate. This allows public routes (GET articles, sitemap, affiliate redirect) to work anonymously while protected routes still require a valid JWT.

### Database — PostgreSQL (Supabase)

Migrations in `backend_supabase/supabase/migrations/`. Seed data in `backend_supabase/supabase/seed.sql` (demo users + articles + affiliate link; runs automatically on `supabase db reset`; **never run against production**).

Tables (all have RLS enabled):
| Table | Purpose |
|---|---|
| `user_profiles` | Extends `auth.users` via trigger. Fields: `id` (FK→auth.users), `email`, `name`, `slug` (unique), `role`, `bio`, `avatar_url`, `twitter`, `github`, `website`. |
| `articles` | Bilingual content (`content_id`, `content_en` JSONB), `author_id`, denormalized `author_name/slug/avatar`, `category_slug`, `tags[]`, `cover_image`, `ads_enabled`, `featured`, `status` (draft/published/review), `views`, `reading_time`, `published_at`. |
| `comments` | Threaded (`parent_id`), `user_id`, denormalized `user_name`/`user_avatar`, `upvotes`, `status` (approved/spam/pending). Body length 1-2000 chars. |
| `subscribers` | Newsletter: `email` (unique), `lang` (id/en), `active`. |
| `invites` | Role invitations: `token`, `email`, `name`, `role`, `invited_by`, `invited_by_id`, `status` (pending/accepted/revoked), `expires_at` (7-day TTL). |
| `affiliate_links` | Monetization: `name`, `url`, `merchant`, `category_slug`, `description`, `image_url`, `clicks`, `active`. |
| `affiliate_clicks` | Click tracking: `link_id`, `article_id`, `ip`. |
| `article_views` | View dedup: `key` (ip:article_id), `article_id`, `ip`, `created_at`. 30-min dedup window (auto-expire requires `pg_cron`, not enabled by default). |

**Security model:**
- **RLS policies:** public can SELECT published articles, approved comments, active affiliate links, all profiles. Authenticated users can CRUD their own articles and comments. All other writes go through Edge Functions using `service_role`.
- **Role escalation guard:** `REVOKE UPDATE (role) ON user_profiles FROM anon, authenticated` — the `role` column can only be set via `service_role` (Edge Functions). Clients cannot self-elevate.
- **Write lockdown:** `REVOKE INSERT, UPDATE, DELETE ON articles, comments FROM anon, authenticated` — all writes must go through Edge Functions (which enforce role checks), preventing readers from bypassing the API.
- **Signup trigger** (`handle_new_user`): auto-creates a `user_profiles` row with role `reader` on every new auth user. Reads `name`/`full_name`/`slug`/`avatar_url`/`picture` from `raw_user_meta_data` (covers both email signup and Google OAuth).

### Bilingual content model (central concept)
An article stores **both languages side by side**: `content_id` and `content_en`, each a JSONB object (`title`, `slug`, `excerpt`, `body_md`, `meta_description`). Either may be null. Consequences:
- Article lookup is by localized slug: `content_{lang}->>slug`. `GET /articles/{slug}` tries the requested lang, then falls back to the other. `/articles/{id}/siblings` returns both slugs so the frontend can switch language on the same article.
- Search/query builds field paths dynamically, e.g. `content_{lang}->>title` (uses PostgREST `.or()` with `ilike` on JSONB fields; special chars are stripped to prevent PostgREST filter injection).
- Categories are a **hardcoded list** (`CATEGORIES` in `functions/_shared/constants.ts`) with `slug`/`name_id`/`name_en`, not a database table. Adding a category = editing that file. There is also a shorter hardcoded subset in `Header.jsx` for the nav bar.
- Slug lookup uses JSONB path indexes: `idx_articles_content_id_slug` on `(content_id->>'slug')`, `idx_articles_content_en_slug` on `(content_en->>'slug')`.

### Auth (Supabase Auth + JWT)
- **Supabase Auth** manages sessions. Frontend uses `@supabase/supabase-js` with `autoRefreshToken`, `persistSession`, `detectSessionInUrl`.
- Login/register use `supabase.auth.signInWithPassword` / `signUp` directly from the frontend (`AuthContext.jsx`). Google OAuth via `supabase.auth.signInWithOAuth({ provider: "google" })` — callback handled at `/{lang}/auth/callback`.
- Email confirmation is **disabled** (`config.toml`: `enable_confirmations = false`), so signup produces an immediate session.
- The JWT is sent to Edge Functions via `Authorization: Bearer <token>` header. The `api.js` axios interceptor attaches the token to every request and retries once on 401 (since Supabase auto-refreshes tokens in the background, the retry picks up the fresh token).
- Roles: `owner` > `editor` > `author` > `reader`. Public signup = `reader` (comment-only). `author`/`editor` created via invite system only. Role elevation happens exclusively in Edge Functions via `service_role`.
- `formatApiError()` in `AuthContext.jsx` normalizes both Supabase Auth errors and Edge Function error responses for display.

### Frontend routing & state
- **Language lives in the URL.** `App.jsx` redirects `/` → `/id` and mounts everything under `/id/*` and `/en/*`; `LangGate` syncs the URL segment into `LanguageContext`. Use `useLang()` → `{ lang, setLang, t }` where `t(id, en)` picks the string.
- Providers wrap the app in this order: `ThemeProvider` → `LanguageProvider` → `AuthProvider` → `BrowserRouter`. `useAuth()` exposes `{ user, profile, loading, login, register, logout, refresh }` (`user` is `null` while checking, `false` when logged out, a user object when logged in; `profile` is the `user_profiles` row fetched from `/users/me/profile`).
- `@/` aliases `frontend/src/` (configured in `vite.config.js` and `jsconfig.json`).
- UI is **shadcn/ui** (style: "new-york", Radix + Tailwind, `components.json`) under `src/components/ui/` — generated primitives, generally don't hand-edit. App components live in `src/components/`, routed pages in `src/pages/`.
- All HTTP goes through the shared axios instance in `src/lib/api.js` (base URL `${VITE_EDGE_FUNCTIONS_URL}/api`, token attached via interceptor).
- **SEO** is managed imperatively in `src/components/Seo.jsx` (not react-helmet-async, which has React 19 issues). `ArticleSeo`, `PageSeo`, `AuthorSeo` inject meta tags, OG tags, JSON-LD, canonical links, and hreflang alternates directly into `<head>`.
- **Markdown rendering** (`MarkdownRenderer.jsx`) uses react-markdown + remark-gfm + Prism syntax highlighting. JSX/JS code blocks get a "Playground" button that opens a Sandpack live editor (`@codesandbox/sandpack-react`).
- **Design system:** Cabinet Grotesk (heading/UI), Spectral (body serif), JetBrains Mono (code). CSS variables for theming in `index.css`. Tailwind config in `tailwind.config.cjs`. Dark mode via `class` strategy (`darkMode: ["class"]`). Accent color: teal (`--accent: 170 60% 40%`).

### Production proxy (Vercel)
`frontend/vercel.json` rewrites same-origin paths to Supabase Edge Functions:
- `/api/*` → `https://<project>.functions.supabase.co/api/*`
- `/r/*` → `https://<project>.functions.supabase.co/redirect/*`
- `/ads.txt`, `/sitemap.xml`, `/rss.xml` → `https://<project>.functions.supabase.co/seo/*`
- Everything else → `/index.html` (SPA fallback so `/id/blog/...` doesn't 404)

This means in production `VITE_EDGE_FUNCTIONS_URL` can be empty (axios base becomes `/api`, proxied by Vercel). In local dev, set it to `http://localhost:54321`.

## Environment

### Frontend (`frontend/.env`, gitignored)
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_EDGE_FUNCTIONS_URL=https://YOUR_PROJECT_REF.functions.supabase.co   # or empty in prod (Vercel proxy)
VITE_SITE_URL=https://blog.msncode.dev   # optional; defaults to window.location.origin
```
See `frontend/.env.example`. **Never** put `SERVICE_ROLE_KEY` in frontend env — it would be bundled to the browser.

### Backend — Edge Functions (Supabase secrets, auto-injected in hosted)
Required Deno env vars (set in Supabase Dashboard → Edge Functions → Secrets, or in `supabase/.env` for local):
- `SUPABASE_URL` — project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (bypasses RLS; used by Edge Functions only)
- `SUPABASE_ANON_KEY` — anon key (used by `getUser()` to validate JWTs)
- `FRONTEND_URL` — e.g. `https://blog.msncode.dev` (used for invite links, sitemap/RSS base URLs)
- `EMERGENT_LLM_KEY` — Anthropic API key (for `POST /api/ai/generate`; Claude Sonnet via direct Anthropic API)
- `RESEND_API_KEY` — optional (email service)

### Supabase config (`backend_supabase/supabase/config.toml`)
- Auth: email confirmation off, Google OAuth ready (fill creds in Dashboard to enable)
- Storage: bucket `blog-images` (public, 5MB limit, images only)
- Edge Functions: `verify_jwt = false` for all (auth enforced in-code)
- Redirect URLs include `https://blog.msncode.dev` and OAuth callback paths

## Seeded test accounts (local dev only — via `seed.sql`)
All passwords: `devpassword` (bcrypt-hashed in seed). These only exist after `supabase db reset` against local Supabase.
- Owner: `admin@devhub.io`
- Author: `author@devhub.io`
- Editor: `editor@devhub.io`

## Monetization
- **Affiliate links** — `affiliate_links` table, managed by owner only. Redirect via `/r/<id>` (tracked). Frontend `AffiliateBox.jsx` shows links per category on article pages. `affiliateHref()` in `api.js` builds same-origin `/r/` URLs (proxied by Vercel).
- **Ads** — `AdSlot.jsx` component + `ads.txt` served from the `seo` function. Per-article `ads_enabled` flag controls display. AdSense publisher ID: `pub-1997030082284033`.

## Legacy / migration artifacts
- `backend/` — empty `.venv` shell from the old FastAPI stack. Ignore.
- `backend_supabase/scripts/migrate_mongo_to_supabase.py` — one-time migration script from MongoDB to Supabase.
- `backend_supabase/seed_articles_new.sql` — additional seed articles, run manually via SQL Editor.
- `.emergent/` — old Emergent platform config. The `EMERGENT_LLM_KEY` env var is still used by the AI endpoint but now points to the Anthropic API directly.
- `tests/` — empty (`__init__.py` only). The old pytest integration suite was removed with the FastAPI backend.
- `memory/MIGRASI_SUPABASE.md` — migration planning doc (migration is complete).
- `memory/PRD.md` — product requirements doc (updated for Supabase architecture).
- `memory/ROADMAP_V2.md` — monetization roadmap, references current Supabase stack.
