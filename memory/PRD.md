# Developer Hub — Product Requirements

## Original Problem Statement
Developer Hub — Blog Multi-Niche untuk Developer. A bilingual (ID + EN) developer blog platform with 11 content pillars, interactive code playground (Sandpack), multi-author system, SEO-first architecture, dark mode, and AdSense-ready monetization.

## User Personas
- **Reader**: Junior–senior developer (ID/global), indie hacker, tech worker.
- **Author**: Contributor writing tutorials/case studies (bilingual).
- **Owner/Editor**: Manages articles, authors, invites, comments, analytics.

## Core Requirements
- Bilingual content (ID + EN) with linked versions & language switcher
- 11 content pillars: tutorial-coding, error-solutions, tools-review, developer-finance, ai-prompt, ai-agents, career-interview, nocode-lowcode, saas-indie, blockchain-crypto, trading
- Markdown editor with syntax highlighting (Prism) + Sandpack playground
- Role-based auth via Supabase Auth (owner/editor/author/reader)
- SEO: sitemap.xml, ads.txt, RSS, hreflang, JSON-LD, Open Graph
- Newsletter subscription
- Comments with role-based moderation
- Analytics dashboard for owner/editor
- Dark mode default
- Image uploads via Supabase Storage
- AI writing assistant (Claude Sonnet via direct Anthropic API)
- Author invitation workflow (email-based)
- Affiliate link monetization with click tracking

## Tech Stack (Implemented)
- Frontend: Vite + React 19 + Tailwind CSS + shadcn/ui (Radix) + Sandpack + react-markdown + react-syntax-highlighter
- Backend: Supabase Edge Functions (Deno/TypeScript) — `api`, `redirect`, `seo`
- Database: Supabase PostgreSQL (Postgres + RLS)
- Auth: Supabase Auth (email/password + Google OAuth) + JWT via `Authorization: Bearer` header
- Storage: Supabase Storage (bucket `blog-images`)
- AI: Claude Sonnet via direct Anthropic API (`EMERGENT_LLM_KEY` env var)
- Email: Resend (structure ready, key optional)
- SEO: Imperative `<head>` injection via useEffect (React 19-safe, no react-helmet-async)

## What's Been Implemented

### Iteration 1 (2026-02) — Foundation + Content ✅
- Supabase Auth + role-based access (owner/editor/author/reader)
- Users with profiles + language context
- Bilingual seed articles
- Homepage, article detail (TOC, reading progress, syntax highlighting, Sandpack), editor with AI assist, dashboard
- Sitemap.xml, ads.txt, RSS feed

### Iteration 2 (2026-02) — SEO + Community + Admin ✅
- Header lang switcher slug sync via `/articles/{id}/siblings` endpoint
- JSON-LD + Open Graph: `Seo.jsx` component with `ArticleSeo`, `PageSeo`, `AuthorSeo`
- Author invitation workflow: `/invites` (create/list/revoke), `/invites/token/{token}/accept` (creates auth user + elevates role)
- Comment moderation: `/admin/comments` + PATCH endpoint; UI in AdminPanel
- RSS feed per language: `seo/index.ts` handles `/rss.xml?lang={id|en}`
- View counter with 30-min IP dedup via `article_views` table

### Iteration 3 (2026-02) — Auth, Monetization, Content Expansion ✅
- Google OAuth via Supabase Auth (`signInWithOAuth({ provider: "google" })`), callback at `/{lang}/auth/callback`
- Draft autosave in editor
- Related articles: `/articles/{id}/related` endpoint (shared-tag ranking + category fallback)
- New categories (11 total): added `ai-agents`, `blockchain-crypto`, `trading`
- Affiliate link system: `affiliate_links` + `affiliate_clicks` tables, CRUD (owner only), redirect via `/r/{id}` with click tracking
- Reader role: public signup defaults to `reader` (comment-only); author/editor via invite only
- Write lockdown: `REVOKE INSERT, UPDATE, DELETE ON articles, comments FROM anon, authenticated` — all writes via Edge Functions
- Role escalation guard: `REVOKE UPDATE (role) ON user_profiles FROM anon, authenticated`

### Migration to Supabase (2026-07) ✅
- Migrated from FastAPI + MongoDB to Supabase (Edge Functions + PostgreSQL + Auth + Storage)
- All API routes consolidated into single `api/index.ts` Edge Function (~1000 lines, regex-based router)
- Supabase Auth replaces custom JWT cookies + refresh token rotation
- Supabase Storage replaces Emergent Object Storage
- Direct Anthropic API replaces Emergent LLM gateway
- Vite replaces Create React App (CRACO)

## Test Credentials (local dev only — via `seed.sql`)
All passwords: `devpassword` (bcrypt-hashed in seed). Only exist after `supabase db reset` against local Supabase.
- Owner: `admin@devhub.io`
- Author: `author@devhub.io`
- Editor: `editor@devhub.io`

## API Coverage
Edge Function `api/index.ts` routes:
- `GET /articles`, `/articles/featured`, `/articles/popular`, `/articles/:slug`, `/articles/:id/related`, `/articles/:id/siblings`
- `POST/PUT/DELETE /articles` (auth required, author+)
- `GET /authors`, `/authors/:slug`
- `GET /comments/:articleId`, `POST/DELETE /comments` (auth required)
- `GET/PATCH /admin/comments` (auth required, editor+)
- `POST /subscribe`, `GET /subscribers` (auth required, editor+)
- `GET/POST/DELETE /invites`, `GET /invites/:id`, `POST /invites/token/:token/accept` (management requires editor+)
- `GET /affiliate-links` (public), `POST/PUT/DELETE /affiliate-links` (auth required, owner only)
- `GET /analytics/summary` (auth required, editor+)
- `POST /ai/generate` (auth required, Claude Sonnet via Anthropic API)
- `POST /upload` (auth required, Supabase Storage)
- `GET /files/:fileId`
- `GET /users/me`, `/users/me/profile` (auth required)
- `GET /categories`

Edge Function `redirect/index.ts`: `GET /r/:id` (affiliate redirect + click tracking)
Edge Function `seo/index.ts`: `GET /sitemap.xml`, `/rss.xml`, `/ads.txt`

## Prioritized Backlog

### P1 (Polish)
- Pagination di `/articles` (cursor/offset, ganti `?limit=50`)
- View counter → user session dedup (in addition to IP)
- Author avatar upload from profile page
- Disclosure otomatis untuk link afiliasi ("mengandung link afiliasi")

### P2 (Nice-to-have)
- AI-assisted image alt text
- Bulk publish/delete actions
- Reading history for logged-in users
- Comment reactions (heart, laugh)
- Two-factor auth for owner
- Email digest (weekly newsletter builder)
- Email automation: drip sequence untuk subscriber baru, newsletter mingguan otomatis

### P3 (Future)
- Server-side rendering (Next.js migration) for perfect SEO/AdSense signals
- Mobile app companion
- Community forum
- Sponsored post system
- Premium/paywall content

## Design Guidelines
- Fonts: Cabinet Grotesk (heading/UI), Spectral (body serif), JetBrains Mono (code)
- Colors: CSS variables with HSL. Accent: teal (`--accent: 170 60% 40%`). Dark mode via `class` strategy.
- Layout: max-w-7xl, generous spacing, card-based grids, sticky TOC on xl+
