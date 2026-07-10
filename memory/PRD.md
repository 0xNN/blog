# Developer Hub — Product Requirements

## Original Problem Statement
Developer Hub — Blog Multi-Niche untuk Developer. A bilingual (ID + EN) developer blog platform with 8 content pillars, interactive code playground (Sandpack), multi-author system, SEO-first architecture, dark mode, and AdSense-ready monetization. Target: Indonesian & global developers, indie hackers.

## User Personas
- **Reader**: Junior–senior developer (ID/global), indie hacker, tech worker. Reads tutorials, error fixes, career content.
- **Author**: Contributor writing tutorials/case studies (bilingual).
- **Owner/Editor**: Manages articles, authors, comments, analytics.

## Core Requirements
- Bilingual content (ID + EN) with linked versions & language switcher
- 8 content pillars: tutorial-coding, error-solutions, tools-review, developer-finance, ai-prompt, career-interview, nocode-lowcode, saas-indie
- Markdown editor with syntax highlighting (Prism) + Sandpack playground
- Role-based JWT auth (owner/editor/author)
- SEO: sitemap.xml, ads.txt, hreflang, meta tags, Open Graph
- Newsletter subscription
- Comments with moderation
- Analytics dashboard for owner/editor
- Dark mode default
- Object storage for image uploads
- AI writing assistant (Claude Sonnet 4.5)

## Tech Stack (Implemented)
- Frontend: React 19 + Tailwind + shadcn/ui + Sandpack + react-markdown + react-syntax-highlighter
- Backend: FastAPI + Motor (MongoDB) + PyJWT + bcrypt + emergentintegrations
- Auth: JWT httpOnly cookies + Bearer fallback
- Storage: Emergent Object Storage
- AI: Claude Sonnet 4.5 via Emergent LLM key
- Design: Cabinet Grotesk (headings) + Spectral (body) + JetBrains Mono (code), #0055FF accent, dark-first

## What's Been Implemented (2026-02)
### Phase 1 — Foundation ✅
- JWT auth (register/login/logout/me) + role-based access (owner/editor/author)
- User profiles with slug, bio, avatar, socials
- Dark/Light theme with localStorage persistence
- Language context (ID/EN) with URL prefix routing (/id, /en)
- 6 bilingual seed articles across 5 pillars
- 3 seed users (admin, author, editor)

### Phase 2 — Content System ✅
- Articles CRUD with bilingual content (`content_id`, `content_en`)
- Category & tag system (8 pillars)
- Author profile pages with article listings
- Homepage: hero, featured, 8 pillar cards, latest, popular, newsletter
- Article detail: cover, TOC (IntersectionObserver), reading progress, syntax-highlighted code blocks, Sandpack playground, in-article ad slot, share buttons, related tags
- Editor page: bilingual tabs (ID/EN), Markdown body, cover image upload, meta config, preview mode
- AI assistant (draft/improve/translate/meta description) via Claude Sonnet 4.5

### Phase 3 — SEO & AdSense (partial) ✅
- `/api/sitemap.xml` with ID + EN URLs
- `/api/ads.txt`
- Meta description support per article
- Ad slot component (in-article) with per-article toggle

### Phase 4 — Community (partial) ✅
- Comments (create/list/delete) with role-aware permissions
- Newsletter subscription (idempotent)
- Full-text search across title/excerpt/tags
- Category filter

### Phase 5 — Admin & Analytics (partial) ✅
- Dashboard: user articles list with edit/view/delete
- Analytics summary (articles, views, subscribers, top articles) for owner/editor
- Object storage-backed image upload

## Prioritized Backlog

### P0 (Missing Core)
- Header language switcher: translate slug when on article page (currently keeps same slug)
- Resend integration for newsletter delivery (API key not yet provided by user)
- Author invitation flow (invite via email → set password)

### P1 (Polish)
- `/api/auth/refresh` implementation (currently 501 placeholder)
- Consolidate duplicate CORSMiddleware in server.py
- View counter throttling (per session/IP)
- Comment moderation UI (approve/spam)
- Structured data JSON-LD (Article, BreadcrumbList, Author)
- Open Graph & Twitter Card meta tags via react-helmet
- Google Analytics integration

### P2 (Nice-to-have)
- AI-assisted image alt text
- Bulk actions (publish, delete)
- RSS feed
- Related articles suggestion
- Reading history for logged-in users
- Social login (Google OAuth)

## Test Credentials
- Owner: admin@devhub.io / Admin123!
- Author: author@devhub.io / Author123!
- Editor: editor@devhub.io / Editor123!

## Design Guidelines
- Fonts: Cabinet Grotesk (heading), Spectral (body), JetBrains Mono (code)
- Colors: `#050505` bg (dark), `#0055FF` accent, monochromatic base
- Layout: max-w-7xl container, generous spacing (py-16+), card-based grids
- Interactions: hover lift (translate-y-1), accent border on hover, subtle transitions
