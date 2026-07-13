# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Developer Hub" — a bilingual (Indonesian `id` / English `en`) developer blog. FastAPI + MongoDB backend, Create React App (via CRACO) + React 19 frontend. Built on the **Emergent** platform, which supplies several external integrations (LLM key, object storage, Google OAuth) — see "Emergent integrations" below.

## Commands

### Backend (`backend/`)
```bash
pip install -r requirements.txt
# emergentintegrations is on a custom index:
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

uvicorn server:app --reload --port 8001    # dev server (expects backend/.env)

pytest                                     # runs tests/ per pytest.ini
pytest backend/tests/backend_test.py::TestHealth::test_root_api_ok   # single test
black . && isort . && flake8 && mypy .     # format / lint / typecheck
```
**pytest.ini is locked:** `addopts = -n 2 --dist loadscope` (xdist, 2 workers). Do NOT change `addopts`. Run serial with `-n 0` (never `-p no:xdist`). `backend_test.py` hits a **live** server at `REACT_APP_BACKEND_URL` (default `http://localhost:8001`) using the seeded accounts below — it is an integration suite, not unit tests.

### Frontend (`frontend/`)
```bash
yarn install          # yarn 1.x is the pinned packageManager
yarn start            # CRACO dev server (expects frontend/.env with REACT_APP_BACKEND_URL)
yarn build
yarn test
```

## Architecture

### Backend — single-file API
`server.py` holds **every** route under an `APIRouter(prefix="/api")`. Supporting modules: `models.py` (Pydantic), `auth.py` (JWT), `storage.py`, `ai_service.py`, `email_service.py`, `seed_data.py` + `seed_new_categories.py`. There is no ORM — Motor (async PyMongo) talks to MongoDB directly with plain dicts. Collections: `users`, `articles`, `comments`, `subscribers`, `invites`, `files`, `article_views`, `revoked_tokens`.

- **Indexes & seeding run on FastAPI startup** (`@app.on_event("startup")` in `server.py`), including two TTL indexes (`article_views` = 30 min view-dedup, `revoked_tokens` = 30 days). Editing seed data or indexes means editing that startup hook.
- **Documents use an app-level `id` (uuid4 string), not Mongo `_id`.** `_id` is stripped from every response (`_strip_id`, and `{"_id": 0}` projections). Always query/join on `id`, `slug`, etc. — never `_id`.

### Bilingual content model (central concept)
An article stores **both languages side by side**: `content_id` and `content_en`, each an `ArticleContent` (`title`, `slug`, `excerpt`, `body_md`, `meta_description`). Either may be null. Consequences:
- Article lookup is by localized slug: `content_{lang}.slug`. `GET /articles/{slug}` tries the requested lang, then falls back to the other. `/articles/{id}/siblings` returns both slugs so the frontend can switch language on the same article.
- Search/query builds field paths dynamically, e.g. `content_{lang}.title`.
- Categories are a **hardcoded list** (`CATEGORIES` in `models.py`) with `name_id`/`name_en`, not a collection. Adding a category = editing that list.

### Auth (JWT in httpOnly cookies)
`auth.py`. Login/register/refresh set `access_token` + `refresh_token` httpOnly cookies (`create_access_token` etc.); tokens are also accepted as `Authorization: Bearer`. Roles: `owner` > `editor` > `author`; guard routes with `Depends(current_user)` or `Depends(require_role(...))`.
- **Refresh tokens are single-use / rotated.** `/auth/refresh` blacklists the used token's SHA-256 in `revoked_tokens` and issues a new pair.
- **Frontend auto-refresh:** `frontend/src/lib/api.js` axios interceptor retries once through `/auth/refresh` on any 401 (concurrent 401s share one in-flight refresh), then replays the request. `AUTH_SKIP_PATHS` are exempt.

### Frontend routing & state
- **Language lives in the URL.** `App.js` redirects `/` → `/id` and mounts everything under `/id/*` and `/en/*`; `LangGate` syncs the URL segment into `LanguageContext`. Use `useLang()` → `{ lang, setLang, t }` where `t(id, en)` picks the string.
- Providers wrap the app in this order: `ThemeProvider` → `LanguageProvider` → `AuthProvider` → `BrowserRouter`. `useAuth()` exposes `{ user, loading, login, register, logout, refresh }` (`user` is `null` while checking, `false` when logged out). `formatApiError()` (in `AuthContext.jsx`) normalizes FastAPI error `detail` (string | validation array) for display.
- `@/` aliases `frontend/src/` (configured in `craco.config.js` and `jsconfig.json`).
- UI is **shadcn/ui** (Radix + Tailwind, `components.json`) under `src/components/ui/` — generated primitives, generally don't hand-edit. App components live in `src/components/`, routed pages in `src/pages/`.
- All HTTP goes through the shared axios instance in `src/lib/api.js` (`withCredentials: true`, base `${REACT_APP_BACKEND_URL}/api`).

### Emergent integrations (external, key-gated)
Configured via `.emergent/emergent.yml`; all require `EMERGENT_LLM_KEY`.
- **AI writing** (`ai_service.py`) — Claude via `emergentintegrations`; modes `draft | translate | improve | meta` at `POST /api/ai/generate`.
- **Object storage** (`storage.py`) — uploads go to Emergent objstore; served back through `GET /api/files/{id}` (never a direct bucket URL). Storage key auto-re-inits on 403.
- **Google OAuth** (`/auth/emergent/session`) — exchanges an Emergent `session_id` for our own JWT cookies and upserts the user. See `auth_testing.md`. Note the in-code warning: do NOT hardcode/add fallback redirect URLs — it breaks the flow.

## Environment

Neither `.env` is committed (both gitignored). Backend requires: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `EMERGENT_LLM_KEY`, `FRONTEND_URL` (used for CORS credentials, invite links, sitemap/RSS), optional `APP_NAME`, `RESEND_*`. Frontend requires `REACT_APP_BACKEND_URL`.

CORS: if `FRONTEND_URL` is set, that origin is allowed *with* credentials; otherwise it falls back to `*` without credentials (cookie auth won't work).

## Seeded test accounts (dev/test only)
- Owner: `admin@devhub.io` / `Admin123!`
- Editor: `editor@devhub.io` / `Editor123!`
- Author: `author@devhub.io` / `Author123!`
