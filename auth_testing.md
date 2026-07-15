# Auth Testing — Developer Hub

## Arsitektur Auth (Supabase Auth)

Auth dikelola oleh **Supabase Auth** (bukan JWT custom / Emergent OAuth lagi). Dua metode login:

1. **Email/Password** — `supabase.auth.signInWithPassword()` / `supabase.auth.signUp()` langsung dari frontend.
2. **Google OAuth** — `supabase.auth.signInWithOAuth({ provider: "google" })`, callback di-handle Supabase Auth langsung.

### Flow Email/Password
1. User submit form di `Login.jsx` / `Register.jsx`
2. Frontend panggil `supabase.auth.signInWithPassword` atau `supabase.auth.signUp`
3. Supabase Auth return session (access_token + refresh_token)
4. `AuthContext.jsx` listen `onAuthStateChange` → update state `user`
5. Frontend panggil `GET /api/users/me/profile` (Edge Function) untuk ambil `user_profiles` row
6. JWT (access_token) dikirim ke Edge Functions via `Authorization: Bearer <token>` header (axios interceptor di `api.js`)

### Flow Google OAuth
1. User klik "Continue with Google" di `GoogleLoginButton.jsx`
2. Frontend panggil `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: /{lang}/auth/callback } })`
3. User redirect ke Google consent screen
4. Setelah consent, Google redirect ke Supabase Auth
5. Supabase Auth redirect ke `{frontend_url}/{lang}/auth/callback#access_token=...`
6. `AuthCallback.jsx` ambil session via `supabase.auth.getSession()`, bersihkan URL hash
7. User redirect ke dashboard atau halaman asal (disimpan di `localStorage.auth_return`)
8. Signup trigger `handle_new_user` auto-create `user_profiles` row dengan role `reader`

> Google OAuth butuh konfigurasi di Supabase Dashboard → Settings → Auth → Providers → Google (Client ID + Secret dari Google Cloud Console). Default `config.toml` sudah set `enabled = false` — aktifkan di Dashboard untuk hosted project.

### Email Confirmation
**Disabled** (`config.toml`: `enable_confirmations = false`). Signup langsung menghasilkan session tanpa verifikasi email. Untuk production, bisa diaktifkan di Dashboard.

## Roles & Permissions

| Role | Cara didapat | Hak akses |
|---|---|---|
| `reader` | Signup publik (default) | Komentar saja |
| `author` | Via undangan dari owner/editor | Tulis artikel sendiri + komentar |
| `editor` | Via undangan dari owner/editor | Moderasi komentar + manage semua artikel |
| `owner` | Via SQL/seed atau dibuat manual | Full access + affiliate links |

Eskalasi role hanya via Edge Function (`service_role`). Client tidak bisa set `role` sendiri (REVOKE UPDATE pada kolom role).

## Test Accounts (local dev only)

Dibuat oleh `backend_supabase/supabase/seed.sql` (jalankan `supabase db reset`):

| Email | Password | Role |
|---|---|---|
| `admin@devhub.io` | `devpassword` | owner |
| `editor@devhub.io` | `devpassword` | editor |
| `author@devhub.io` | `devpassword` | author |

> Password di-hash dengan bcrypt (`crypt('devpassword', gen_salt('bf'))`) di seed. Akun ini hanya ada di local Supabase, bukan production.

## Edge Function Auth Flow

Setiap request ke Edge Function membawa JWT di header:
```
Authorization: Bearer <supabase_access_token>
```

Edge Function `api/index.ts`:
1. `getUser(req)` — ambil token dari header, validasi via `supabase.auth.getUser(token)`
2. Jika valid → return user object (id, email, user_metadata)
3. Jika tidak valid → throw `Error("Not authenticated")` → 401
4. `requireRole(user, ...roles)` — cek role dari `user_profiles` table via `service_role` client
5. Jika role tidak match → throw `Error("Insufficient permissions")` → 403

Route publik (tanpa auth): `GET /articles`, `GET /categories`, `GET /authors`, `GET /comments/:articleId`, `POST /subscribe`, `POST /invites/token/:token/accept`, `GET /affiliate-links`, `GET /files/:fileId`.

Route butuh auth: semua POST/PUT/DELETE articles, comments, invites, upload, analytics, AI generate, affiliate link management (owner only), admin comment moderation (owner/editor).

## Frontend Auth State (`AuthContext.jsx`)

```
useAuth() → {
  user,       // null = loading, false = logged out, object = logged in
  profile,    // user_profiles row dari GET /api/users/me/profile
  loading,    // true saat cek session awal
  login(email, password),
  register(email, password, name),
  logout(),
  refresh()   // re-fetch profile
}
```

- `getSession()` dipanggil saat mount → cek session existing
- `onAuthStateChange` listen event `SIGNED_IN` / `SIGNED_OUT` → update state
- `fetchProfile(userId)` — panggil Edge Function `/users/me/profile`, dengan self-heal: jika profile belum ada (trigger gagal), auto-create dengan role `reader`
- `formatApiError(err)` — normalisasi error dari Supabase Auth maupun Edge Function

## Token Refresh

- Supabase SDK auto-refresh token di background (`autoRefreshToken: true`)
- Axios interceptor di `api.js` retry sekali pada 401 → ambil token baru → replay request
- Tidak ada manual refresh endpoint seperti JWT custom sebelumnya

## Security Notes

- `verify_jwt = false` di `config.toml` untuk semua Edge Functions — auth di-enforce in-code, bukan platform gate. Ini memungkinkan route publik (GET articles, sitemap, affiliate redirect) jalan anonim.
- `SERVICE_ROLE_KEY` hanya di Edge Functions (Deno env), **tidak pernah** di frontend bundle.
- RLS policies: public SELECT published articles/approved comments, authenticated CRUD own articles/comments, service_role untuk sisanya.
- `REVOKE INSERT, UPDATE, DELETE ON articles, comments FROM anon, authenticated` — semua tulis harus lewat Edge Function, tidak bisa bypass via Data API langsung.
