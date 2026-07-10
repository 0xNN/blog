# Developer Hub — Product Requirements

## Original Problem Statement
Developer Hub — Blog Multi-Niche untuk Developer. A bilingual (ID + EN) developer blog platform with 8 content pillars, interactive code playground (Sandpack), multi-author system, SEO-first architecture, dark mode, and AdSense-ready monetization.

## User Personas
- **Reader**: Junior–senior developer (ID/global), indie hacker, tech worker.
- **Author**: Contributor writing tutorials/case studies (bilingual).
- **Owner/Editor**: Manages articles, authors, invites, comments, analytics.

## Core Requirements
- Bilingual content (ID + EN) with linked versions & language switcher
- 8 content pillars: tutorial-coding, error-solutions, tools-review, developer-finance, ai-prompt, career-interview, nocode-lowcode, saas-indie
- Markdown editor with syntax highlighting (Prism) + Sandpack playground
- Role-based JWT auth (owner/editor/author)
- SEO: sitemap.xml, ads.txt, RSS, hreflang, JSON-LD, Open Graph
- Newsletter subscription (Resend structure ready)
- Comments with role-based moderation
- Analytics dashboard for owner/editor
- Dark mode default
- Object storage for image uploads
- AI writing assistant (Claude Sonnet 4.5)
- Author invitation workflow (email-based)

## Tech Stack (Implemented)
- Frontend: React 19 + Tailwind + shadcn/ui + Sandpack + react-markdown + react-syntax-highlighter
- Backend: FastAPI + Motor (MongoDB) + PyJWT + bcrypt + emergentintegrations + resend + python-slugify
- Auth: JWT httpOnly cookies + Bearer fallback
- Storage: Emergent Object Storage
- AI: Claude Sonnet 4.5 via Emergent LLM key
- Email: Resend (structure ready, key optional — no-op if empty)
- SEO: Imperative <head> injection via useEffect (React 19-safe)

## What's Been Implemented

### Iteration 1 (2026-02) — Foundation + Content ✅
- JWT auth + role-based access
- Users with profiles + language context
- 6 bilingual seed articles
- Homepage, article detail (TOC, reading progress, syntax highlighting, Sandpack), editor with AI assist, dashboard
- Sitemap.xml, ads.txt

### Iteration 3 (2026-02) — Auth, Monetization, Content Expansion ✅
- **P1 Real Resend delivery**: `RESEND_API_KEY` set; newsletter welcome + author invites actually send when recipient is verified in Resend dashboard. Free-tier restriction (onboarding@resend.dev only delivers to account owner email) handled gracefully — endpoints still return success, `email.status` in response reveals send outcome
- **P1 `/api/auth/refresh` rotation**: JWT refresh-token cookie is single-use (SHA-256 hash stored in `revoked_tokens` with 30-day TTL). Reuse returns 401.
- **P1 View throttling → Mongo TTL**: `article_views` collection with `expireAfterSeconds=1800` TTL index + unique `key` for atomic dedup. Multi-worker safe.
- **P2 Google OAuth (Emergent)**: `/api/auth/emergent/session` verifies session_id from Emergent, upserts user (schema-compatible with JWT users), issues our JWT cookies. Frontend `GoogleLoginButton` + `AuthCallback` page — dynamic origin, no hardcoded URLs. Existing email/password JWT auth preserved.
- **P2 Draft autosave**: EditorPage autosaves 5s after typing stops; badge "Tersimpan/Saved HH:MM" appears in toolbar
- **P2 Related articles**: `/api/articles/{id}/related` endpoint — shared-tag ranking first (weighted by overlap count), fallback to same category. Rendered under article body via `RelatedArticles.jsx`
- **New categories** (11 total): added `ai-agents`, `blockchain-crypto`, `trading`

### Bugs fixed in Iter 3
- Editor `save()` was missing `opts` destructure → `silent` ReferenceError blocking all save flows. Fixed.

### Iteration 2 (2026-02) — SEO + Community + Admin ✅
- **P0 Header lang switcher slug sync**: uses `/api/articles/{id}/siblings` endpoint to navigate to the correct translated slug
- **P0 Resend email service**: `email_service.py` — graceful no-op when `RESEND_API_KEY` is empty; sends newsletter welcome + author invitation emails when configured
- **P1 JSON-LD + Open Graph**: `Seo.jsx` component with `ArticleSeo`, `PageSeo`, `AuthorSeo`. Injects Article schema, BreadcrumbList, Person schema; overwrites existing `<meta name="description">` in place
- **P1 Author invitation workflow**: `/api/invites` (create/list/revoke), `/api/invites/token/{token}` (validate + accept). Frontend `AcceptInvite.jsx` page + `AdminPanel.jsx` UI in dashboard
- **P2 Comment moderation UI**: `/api/admin/comments` + PATCH endpoint; UI tab in AdminPanel
- **P2 RSS feed**: `/api/rss.xml?lang={id|en}` — RSS 2.0 with 50 latest posts
- **P2 View counter throttling**: in-memory 30-min per-IP+article dedup
- **Fixes**: ObjectId serialization in accept_invite; single CORSMiddleware; test testid renaming for consistency

## Test Credentials
- Owner: admin@devhub.io / Admin123!
- Author: author@devhub.io / Author123!
- Editor: editor@devhub.io / Editor123!

## API Coverage (50/50 backend tests passing)
- `/api/auth/*` (register, login, logout, me)
- `/api/articles/*` (CRUD, featured, popular, siblings, by slug with lang fallback)
- `/api/comments/*` + `/api/admin/comments/*` (moderation)
- `/api/subscribe`, `/api/subscribers`
- `/api/invites/*` + `/api/invites/token/{token}/*`
- `/api/authors/*`
- `/api/analytics/summary`
- `/api/ai/generate` (Claude Sonnet 4.5)
- `/api/upload`, `/api/files/{id}` (object storage)
- `/api/sitemap.xml`, `/api/rss.xml`, `/api/ads.txt`

## Prioritized Backlog

### P1 (Polish)
- `/api/auth/refresh` implementation (currently 501)
- Multi-worker view throttling (Redis or Mongo TTL)
- View counter → user session dedup (in addition to IP)
- Author avatar upload from profile page
- Draft autosave in editor
- Related articles suggestion at bottom of article

### P2 (Nice-to-have)
- Google OAuth / Emergent social login
- AI-assisted image alt text
- Bulk publish/delete actions
- Reading history for logged-in users
- Comment reactions (heart, laugh)
- Two-factor auth for owner
- Email digest (weekly newsletter builder)

### P3 (Future)
- Server-side rendering (Next.js migration) for perfect SEO/AdSense signals
- Mobile app companion
- Community forum
- Sponsored post system
- Premium/paywall content

## Design Guidelines
- Fonts: Cabinet Grotesk (heading), Spectral (body), JetBrains Mono (code)
- Colors: `#050505` bg (dark), `#0055FF` accent, monochromatic base
- Layout: max-w-7xl, generous spacing, card-based grids, sticky TOC on xl+
