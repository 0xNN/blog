"""
Backend API tests for Developer Hub.
Covers auth, articles, categories, authors, comments, subscribe, analytics, AI.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@devhub.io"
ADMIN_PASSWORD = "Admin123!"
AUTHOR_EMAIL = "author@devhub.io"
AUTHOR_PASSWORD = "Author123!"
EDITOR_EMAIL = "editor@devhub.io"
EDITOR_PASSWORD = "Editor123!"


# ----------------------- Fixtures -----------------------

@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(email: str, password: str) -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Login failed for {email}: {r.status_code} {r.text[:200]}")
    # Also set bearer token as fallback in case cookies not forwarded
    # Cookie should already be set on session
    return s


@pytest.fixture(scope="session")
def owner_session():
    return _login(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope="session")
def author_session():
    return _login(AUTHOR_EMAIL, AUTHOR_PASSWORD)


@pytest.fixture(scope="session")
def editor_session():
    return _login(EDITOR_EMAIL, EDITOR_PASSWORD)


# ----------------------- Health -----------------------

class TestHealth:
    def test_root_api_ok(self, api_client):
        r = api_client.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert "name" in r.json()


# ----------------------- Categories -----------------------

class TestCategories:
    def test_list_categories(self, api_client):
        r = api_client.get(f"{API}/categories", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 8, f"expected 8 categories, got {len(data)}"
        slugs = {c["slug"] for c in data}
        expected = {
            "tutorial-coding", "error-solutions", "tools-review", "developer-finance",
            "ai-prompt", "career-interview", "nocode-lowcode", "saas-indie",
        }
        assert slugs == expected
        for c in data:
            assert "count" in c and isinstance(c["count"], int)


# ----------------------- Articles -----------------------

class TestArticles:
    def test_list_published_id(self, api_client):
        r = api_client.get(f"{API}/articles?lang=id", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        for a in data:
            assert a["status"] == "published"
            assert "_id" not in a

    def test_featured_articles(self, api_client):
        r = api_client.get(f"{API}/articles/featured", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # from seed we have 3 featured articles
        assert len(data) >= 1
        for a in data:
            assert a["featured"] is True

    def test_popular_articles(self, api_client):
        r = api_client.get(f"{API}/articles/popular", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Sorted by views desc
        views = [a.get("views", 0) for a in data]
        assert views == sorted(views, reverse=True), "popular articles must be sorted by views desc"

    def test_get_article_id_slug(self, api_client):
        slug = "menguasai-react-hooks-2026"
        r = api_client.get(f"{API}/articles/{slug}?lang=id", timeout=10)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data["content_id"]["slug"] == slug
        assert "React" in data["content_id"]["title"]

    def test_get_article_en_slug(self, api_client):
        slug = "mastering-react-hooks-2026"
        r = api_client.get(f"{API}/articles/{slug}?lang=en", timeout=10)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data["content_en"]["slug"] == slug
        assert "React" in data["content_en"]["title"]

    def test_get_article_view_throttled(self, api_client):
        """With per-IP throttling (30 min), 5 rapid hits should increment views by at most 1."""
        slug = "menguasai-react-hooks-2026"
        r1 = api_client.get(f"{API}/articles/{slug}?lang=id", timeout=10)
        v1 = r1.json()["views"]
        for _ in range(4):
            api_client.get(f"{API}/articles/{slug}?lang=id", timeout=10)
        r_final = api_client.get(f"{API}/articles/{slug}?lang=id", timeout=10)
        v_final = r_final.json()["views"]
        # Should NOT go up by 5 — throttle allows only 1 within 30 min per IP+article
        assert v_final - v1 <= 1, f"Throttling failed: views went from {v1} -> {v_final}"

    def test_article_siblings(self, api_client):
        # Fetch one seeded article, then hit /siblings
        r = api_client.get(f"{API}/articles?lang=id", timeout=10)
        assert r.status_code == 200
        article = r.json()[0]
        art_id = article["id"]
        s = api_client.get(f"{API}/articles/{art_id}/siblings", timeout=10)
        assert s.status_code == 200
        data = s.json()
        assert "id_slug" in data
        assert "en_slug" in data
        # For seed articles, both should be present
        assert data["id_slug"] and data["en_slug"]

    def test_article_siblings_404(self, api_client):
        r = api_client.get(f"{API}/articles/nonexistent-id-xxx/siblings", timeout=10)
        assert r.status_code == 404


# ----------------------- Authors -----------------------

class TestAuthors:
    def test_list_authors(self, api_client):
        r = api_client.get(f"{API}/authors", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        for u in data:
            assert "password_hash" not in u
            assert "email" not in u
            assert "_id" not in u

    def test_get_author_kirana(self, api_client):
        r = api_client.get(f"{API}/authors/kirana-dewi", timeout=10)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data["author"]["slug"] == "kirana-dewi"
        assert isinstance(data["articles"], list)


# ----------------------- Auth -----------------------

class TestAuth:
    def test_login_admin_sets_cookies(self, api_client):
        s = requests.Session()
        r = s.post(f"{API}/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "owner"
        assert "password_hash" not in data
        # cookies
        assert "access_token" in s.cookies, "access_token cookie should be set"
        assert "refresh_token" in s.cookies, "refresh_token cookie should be set"

    def test_login_invalid(self, api_client):
        r = api_client.post(f"{API}/auth/login",
                            json={"email": "wrong@devhub.io", "password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_me_endpoint(self, owner_session):
        r = owner_session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "owner"

    def test_me_unauthenticated(self, api_client):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_logout_clears_cookies(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout", timeout=10)
        assert r2.status_code == 200
        # cookies should now be cleared server-side (empty string) or absent
        r3 = s.get(f"{API}/auth/me", timeout=10)
        assert r3.status_code == 401

    def test_register_creates_author(self):
        s = requests.Session()
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@devhub.io"
        r = s.post(f"{API}/auth/register",
                   json={"email": email, "password": "Passw0rd!", "name": f"TEST User {uuid.uuid4().hex[:4]}"},
                   timeout=15)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data["email"] == email.lower()
        assert data["role"] == "author"
        assert "password_hash" not in data
        # cookies set
        assert "access_token" in s.cookies

    def test_register_duplicate(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/register",
                   json={"email": ADMIN_EMAIL, "password": "whatever", "name": "Dup"}, timeout=10)
        assert r.status_code == 400


# ----------------------- Subscribe -----------------------

class TestSubscribe:
    def test_subscribe_new(self, api_client):
        email = f"TEST_sub_{uuid.uuid4().hex[:8]}@x.com"
        r = api_client.post(f"{API}/subscribe", json={"email": email}, timeout=10)
        assert r.status_code == 201
        assert r.json()["success"] is True

    def test_subscribe_duplicate_idempotent(self, api_client):
        email = f"TEST_sub_dup_{uuid.uuid4().hex[:8]}@x.com"
        r1 = api_client.post(f"{API}/subscribe", json={"email": email}, timeout=10)
        assert r1.status_code == 201
        r2 = api_client.post(f"{API}/subscribe", json={"email": email}, timeout=10)
        # Should be idempotent — success but says already
        assert r2.status_code in (200, 201)
        assert r2.json()["success"] is True


# ----------------------- Articles CRUD (Auth) -----------------------

class TestArticleCRUD:
    def _payload(self, title="TEST_Article"):
        uniq = uuid.uuid4().hex[:6]
        return {
            "category_slug": "tutorial-coding",
            "tags": ["test", "auto"],
            "cover_image": "",
            "ads_enabled": False,
            "featured": False,
            "status": "draft",
            "content_id": {
                "title": f"{title} ID {uniq}",
                "slug": f"test-article-id-{uniq}",
                "excerpt": "test excerpt",
                "body_md": "## Halo\n\nContent test",
                "meta_description": "meta",
            },
            "content_en": {
                "title": f"{title} EN {uniq}",
                "slug": f"test-article-en-{uniq}",
                "excerpt": "test excerpt",
                "body_md": "## Hello\n\nTest content",
                "meta_description": "meta",
            },
        }

    def test_create_and_delete_by_author(self, author_session):
        payload = self._payload("TEST_AuthorArticle")
        r = author_session.post(f"{API}/articles", json=payload, timeout=15)
        assert r.status_code == 201, r.text[:200]
        art = r.json()
        assert art["status"] == "draft"
        assert art["content_id"]["title"].startswith("TEST_AuthorArticle")
        # Delete own
        d = author_session.delete(f"{API}/articles/{art['id']}", timeout=10)
        assert d.status_code == 200

    def test_update_by_author(self, author_session):
        payload = self._payload("TEST_UpdateFlow")
        r = author_session.post(f"{API}/articles", json=payload, timeout=10)
        assert r.status_code == 201
        art = r.json()
        upd = {"status": "published"}
        r2 = author_session.put(f"{API}/articles/{art['id']}", json=upd, timeout=10)
        assert r2.status_code == 200
        data = r2.json()
        assert data["status"] == "published"
        assert data.get("published_at")
        # cleanup
        author_session.delete(f"{API}/articles/{art['id']}", timeout=10)

    def test_author_cannot_delete_others(self, owner_session, author_session):
        payload = self._payload("TEST_OwnerOnly")
        r = owner_session.post(f"{API}/articles", json=payload, timeout=10)
        assert r.status_code == 201
        art = r.json()
        # Author tries to delete owner's article
        d = author_session.delete(f"{API}/articles/{art['id']}", timeout=10)
        assert d.status_code == 403
        # Owner can delete
        owner_session.delete(f"{API}/articles/{art['id']}", timeout=10)

    def test_create_unauthenticated(self, api_client):
        r = requests.post(f"{API}/articles", json=self._payload("nope"), timeout=10)
        assert r.status_code == 401


# ----------------------- Comments -----------------------

class TestComments:
    def test_comment_flow(self, author_session, api_client):
        # get one article id
        r = api_client.get(f"{API}/articles?lang=id", timeout=10)
        articles = r.json()
        assert articles, "no articles seeded"
        article_id = articles[0]["id"]
        # create comment
        body = {"article_id": article_id, "body": "TEST_ comment auto"}
        c = author_session.post(f"{API}/comments", json=body, timeout=10)
        assert c.status_code == 201, c.text[:200]
        comment = c.json()
        # list
        lst = api_client.get(f"{API}/comments/{article_id}", timeout=10)
        assert lst.status_code == 200
        ids = [x["id"] for x in lst.json()]
        assert comment["id"] in ids
        # delete own
        d = author_session.delete(f"{API}/comments/{comment['id']}", timeout=10)
        assert d.status_code == 200

    def test_comment_requires_auth(self, api_client):
        r = requests.post(f"{API}/comments",
                          json={"article_id": "any", "body": "no auth"}, timeout=10)
        assert r.status_code == 401


# ----------------------- Analytics -----------------------

class TestAnalytics:
    def test_analytics_owner(self, owner_session):
        r = owner_session.get(f"{API}/analytics/summary", timeout=10)
        assert r.status_code == 200
        data = r.json()
        for key in ("total_articles", "published", "total_views",
                    "total_subscribers", "total_comments", "total_authors", "top_articles"):
            assert key in data

    def test_analytics_editor(self, editor_session):
        r = editor_session.get(f"{API}/analytics/summary", timeout=10)
        assert r.status_code == 200

    def test_analytics_author_forbidden(self, author_session):
        r = author_session.get(f"{API}/analytics/summary", timeout=10)
        assert r.status_code == 403

    def test_analytics_unauth(self, api_client):
        r = requests.get(f"{API}/analytics/summary", timeout=10)
        assert r.status_code == 401


# ----------------------- AI -----------------------

class TestAI:
    def test_ai_draft(self, owner_session):
        r = owner_session.post(
            f"{API}/ai/generate",
            json={"mode": "draft", "prompt": "Write one short paragraph about React useState."},
            timeout=90,
        )
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert "result" in data
        assert isinstance(data["result"], str)
        assert len(data["result"]) > 20

    def test_ai_requires_auth(self, api_client):
        r = requests.post(f"{API}/ai/generate",
                          json={"mode": "draft", "prompt": "hi"}, timeout=10)
        assert r.status_code == 401


# ----------------------- Invites (Iteration 2) -----------------------

class TestInvites:
    def test_create_invite_owner(self, owner_session):
        email = f"TEST_invite_{uuid.uuid4().hex[:8]}@devhub.io"
        payload = {"email": email, "name": f"TEST Invitee {uuid.uuid4().hex[:4]}", "role": "author"}
        r = owner_session.post(f"{API}/invites", json=payload, timeout=15)
        assert r.status_code == 201, r.text[:300]
        data = r.json()
        assert data["success"] is True
        assert "invite_id" in data
        assert "accept_url" in data and "/invite/" in data["accept_url"]
        # Because RESEND_API_KEY empty, email must be skipped (no-op)
        assert "email" in data
        assert data["email"]["status"] == "skipped", f"expected skipped, got {data['email']}"
        # cleanup
        owner_session.delete(f"{API}/invites/{data['invite_id']}", timeout=10)

    def test_list_invites_owner(self, owner_session):
        # create one to guarantee non-empty
        email = f"TEST_invlist_{uuid.uuid4().hex[:8]}@devhub.io"
        c = owner_session.post(f"{API}/invites",
                               json={"email": email, "name": "TEST InviteList", "role": "author"},
                               timeout=15)
        assert c.status_code == 201
        inv_id = c.json()["invite_id"]
        r = owner_session.get(f"{API}/invites", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = [x["id"] for x in data]
        assert inv_id in ids
        # token should NOT be exposed in list
        for x in data:
            assert "token" not in x
        owner_session.delete(f"{API}/invites/{inv_id}", timeout=10)

    def test_list_invites_author_forbidden(self, author_session):
        r = author_session.get(f"{API}/invites", timeout=10)
        assert r.status_code == 403

    def test_create_invite_author_forbidden(self, author_session):
        r = author_session.post(f"{API}/invites",
                                json={"email": "TEST_bad@x.io", "name": "n", "role": "author"},
                                timeout=10)
        assert r.status_code == 403

    def test_invalid_token_returns_404(self, api_client):
        r = api_client.get(f"{API}/invites/token/not-a-real-token-xxx", timeout=10)
        assert r.status_code == 404

    def test_get_invite_by_token_success(self, owner_session):
        # Create invite, then retrieve raw token from DB via a full accept flow.
        # We don't have direct DB access here, but the create response returns accept_url
        # containing the token — extract it.
        email = f"TEST_inv_get_{uuid.uuid4().hex[:8]}@devhub.io"
        name = f"TEST Get {uuid.uuid4().hex[:4]}"
        c = owner_session.post(f"{API}/invites",
                               json={"email": email, "name": name, "role": "author"},
                               timeout=15)
        assert c.status_code == 201
        accept_url = c.json()["accept_url"]
        token = accept_url.rstrip("/").split("/")[-1]
        # Now GET the invite by token
        r = requests.get(f"{API}/invites/token/{token}", timeout=10)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["email"] == email.lower()  # backend normalizes to lowercase
        assert data["name"] == name
        assert data["role"] == "author"
        assert "invited_by" in data
        # cleanup
        owner_session.delete(f"{API}/invites/{c.json()['invite_id']}", timeout=10)

    def test_accept_invite_flow(self, owner_session):
        email = f"TEST_inv_accept_{uuid.uuid4().hex[:8]}@devhub.io"
        name = f"TEST Accept {uuid.uuid4().hex[:4]}"
        c = owner_session.post(f"{API}/invites",
                               json={"email": email, "name": name, "role": "author"},
                               timeout=15)
        assert c.status_code == 201
        token = c.json()["accept_url"].rstrip("/").split("/")[-1]
        s = requests.Session()
        r = s.post(f"{API}/invites/token/{token}/accept",
                   json={"password": "Passw0rd!"}, timeout=15)
        assert r.status_code == 200, r.text[:300]
        user = r.json()
        assert user["email"] == email.lower()
        assert user["role"] == "author"
        assert "password_hash" not in user
        assert "_id" not in user
        # Auth cookies should be set on the session
        assert "access_token" in s.cookies
        # Second attempt should now fail (invite consumed)
        r2 = s.post(f"{API}/invites/token/{token}/accept",
                    json={"password": "Passw0rd!"}, timeout=10)
        assert r2.status_code == 400
        # Login as the new user should work
        login = requests.post(f"{API}/auth/login",
                              json={"email": email.lower(), "password": "Passw0rd!"}, timeout=10)
        assert login.status_code == 200

    def test_accept_invite_bad_token(self, api_client):
        r = api_client.post(f"{API}/invites/token/does-not-exist/accept",
                            json={"password": "Passw0rd!"}, timeout=10)
        assert r.status_code == 404

    def test_delete_invite_author_forbidden(self, owner_session, author_session):
        email = f"TEST_inv_del_{uuid.uuid4().hex[:8]}@devhub.io"
        c = owner_session.post(f"{API}/invites",
                               json={"email": email, "name": "TEST Del", "role": "author"},
                               timeout=15)
        assert c.status_code == 201
        inv_id = c.json()["invite_id"]
        r = author_session.delete(f"{API}/invites/{inv_id}", timeout=10)
        assert r.status_code == 403
        # Owner deletes
        d = owner_session.delete(f"{API}/invites/{inv_id}", timeout=10)
        assert d.status_code == 200


# ----------------------- Admin Comments moderation -----------------------

class TestAdminComments:
    def _get_article_id(self, api_client):
        r = api_client.get(f"{API}/articles?lang=id", timeout=10)
        assert r.status_code == 200
        return r.json()[0]["id"]

    def test_admin_list_comments_owner(self, owner_session):
        r = owner_session.get(f"{API}/admin/comments", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_list_comments_author_forbidden(self, author_session):
        r = author_session.get(f"{API}/admin/comments", timeout=10)
        assert r.status_code == 403

    def test_moderate_comment_spam_hides_from_public(self, owner_session, author_session, api_client):
        article_id = self._get_article_id(api_client)
        c = author_session.post(f"{API}/comments",
                                json={"article_id": article_id, "body": "TEST_ moderation candidate"},
                                timeout=10)
        assert c.status_code == 201
        cid = c.json()["id"]
        # Public list should include it initially
        lst_before = api_client.get(f"{API}/comments/{article_id}", timeout=10).json()
        assert any(x["id"] == cid for x in lst_before)
        # Mark as spam
        r = owner_session.patch(f"{API}/admin/comments/{cid}",
                                json={"status": "spam"}, timeout=10)
        assert r.status_code == 200
        # Now public list should exclude it
        lst_after = api_client.get(f"{API}/comments/{article_id}", timeout=10).json()
        assert not any(x["id"] == cid for x in lst_after), \
            "Spam-marked comment must not appear in public listing"
        # Approve it back
        r2 = owner_session.patch(f"{API}/admin/comments/{cid}",
                                 json={"status": "approved"}, timeout=10)
        assert r2.status_code == 200
        lst_final = api_client.get(f"{API}/comments/{article_id}", timeout=10).json()
        assert any(x["id"] == cid for x in lst_final)
        # cleanup
        author_session.delete(f"{API}/comments/{cid}", timeout=10)

    def test_moderate_invalid_status(self, owner_session, author_session, api_client):
        article_id = self._get_article_id(api_client)
        c = author_session.post(f"{API}/comments",
                                json={"article_id": article_id, "body": "TEST_ bad status"},
                                timeout=10)
        cid = c.json()["id"]
        r = owner_session.patch(f"{API}/admin/comments/{cid}",
                                json={"status": "bogus"}, timeout=10)
        assert r.status_code == 400
        author_session.delete(f"{API}/comments/{cid}", timeout=10)

    def test_moderate_not_found(self, owner_session):
        r = owner_session.patch(f"{API}/admin/comments/nonexistent-id",
                                json={"status": "approved"}, timeout=10)
        assert r.status_code == 404


# ----------------------- RSS Feed -----------------------

class TestRSS:
    def test_rss_id(self, api_client):
        r = api_client.get(f"{API}/rss.xml?lang=id", timeout=10)
        assert r.status_code == 200
        assert "application/rss+xml" in r.headers.get("content-type", "")
        body = r.text
        assert "<rss" in body and "</rss>" in body
        assert "<channel>" in body
        assert "<language>id-ID</language>" in body
        # Should include at least one seeded article
        assert "<item>" in body

    def test_rss_en(self, api_client):
        r = api_client.get(f"{API}/rss.xml?lang=en", timeout=10)
        assert r.status_code == 200
        assert "<language>en-US</language>" in r.text
        assert "<item>" in r.text


# ----------------------- Subscribe (email no-op) -----------------------

class TestSubscribeNoop:
    def test_subscribe_still_succeeds_with_empty_resend_key(self, api_client):
        # Even with RESEND_API_KEY="" the subscribe endpoint should return 201
        email = f"TEST_noopsub_{uuid.uuid4().hex[:8]}@x.io"
        r = api_client.post(f"{API}/subscribe", json={"email": email}, timeout=10)
        assert r.status_code == 201
        assert r.json()["success"] is True
