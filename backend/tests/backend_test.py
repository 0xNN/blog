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

    def test_get_article_view_increments(self, api_client):
        slug = "menguasai-react-hooks-2026"
        r1 = api_client.get(f"{API}/articles/{slug}?lang=id", timeout=10)
        v1 = r1.json()["views"]
        r2 = api_client.get(f"{API}/articles/{slug}?lang=id", timeout=10)
        v2 = r2.json()["views"]
        assert v2 > v1


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
