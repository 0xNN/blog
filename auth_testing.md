See /app/backend/emergent_auth_playbook.md for the Emergent Auth flow.

## Auth-Gated App Testing Playbook (from integration_playbook_expert_v2)

Emergent Google Auth requires:
1. Frontend redirects to `https://auth.emergentagent.com/?redirect={window.location.origin}/{lang}/auth/callback`
2. User completes Google auth on Emergent
3. Emergent redirects to `{redirect_url}#session_id=<session_id>`
4. Frontend processes session_id (during render, not useEffect) and calls backend `/api/auth/emergent/session` with `{session_id}`
5. Backend calls `GET https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` with `X-Session-ID: {session_id}` to fetch user data
6. Backend upserts user in `users` collection (same schema as JWT users), issues our own JWT httpOnly cookies
7. Frontend refreshes AuthContext, redirects to `/id/dashboard`

## Test identities
- No password-based test credentials for Google flow (OAuth session-based).
- Any real Google account can be used for testing at https://auth.emergentagent.com.
- After login, user is upserted into `users` with role='author'.

## Existing JWT auth (email/password) unchanged
- Owner: admin@devhub.io / Admin123!
- Author: author@devhub.io / Author123!
- Editor: editor@devhub.io / Editor123!
