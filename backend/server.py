"""Developer Hub - FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, UploadFile, File, Query, Header, Request
from fastapi.responses import Response as FastResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
import slugify as _slug_mod

from models import (
    UserRegister, UserLogin, UserPublic, ArticleCreate, ArticleUpdate,
    CommentCreate, SubscribeIn, AIWriteRequest, CATEGORIES,
)
from auth import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    set_auth_cookies, clear_auth_cookies, decode_token, current_user,
    current_user_optional, require_role, get_token_from_request,
)
from storage import init_storage, put_object, get_object, APP_NAME
from ai_service import ai_generate
from email_service import send_newsletter_welcome, send_author_invite
from seed_data import run_seed
from seed_new_categories import seed_new_categories


# --- DB ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# --- App ---
app = FastAPI(title="Developer Hub API")
api = APIRouter(prefix="/api")


def slugify(text: str) -> str:
    return _slug_mod.slugify(text)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_id(doc):
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


def public_user(u: dict) -> dict:
    return {k: v for k, v in u.items() if k not in ("password_hash", "_id")}


# ================== AUTH ==================
@api.post("/auth/register")
async def register(body: UserRegister, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    slug = slugify(body.name) or f"user-{uuid.uuid4().hex[:6]}"
    # ensure unique slug
    if await db.users.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "slug": slug,
        "role": "author",
        "bio": "",
        "avatar_url": "",
        "twitter": "",
        "github": "",
        "website": "",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return public_user(user)


@api.post("/auth/login")
async def login(body: UserLogin, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return public_user(user)


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"success": True}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return public_user(user)


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    """Rotate refresh + access tokens. Reads refresh_token cookie or JSON body."""
    token = request.cookies.get("refresh_token")
    if not token:
        try:
            data = await request.json()
            token = data.get("refresh_token")
        except Exception:
            token = None
    if not token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Not a refresh token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Enforce single-use rotation: check jti-like blacklist by hashing token
    import hashlib
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    if await db.revoked_tokens.find_one({"hash": token_hash}):
        raise HTTPException(status_code=401, detail="Refresh token already used")
    await db.revoked_tokens.insert_one({
        "hash": token_hash,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc),
    })

    new_access = create_access_token(user["id"], user["email"], user["role"])
    new_refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, new_access, new_refresh)
    return {"success": True, "user": {k: v for k, v in user.items() if k != "password_hash"}}


# ================== EMERGENT GOOGLE AUTH ==================
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
class EmergentSessionRequest(BaseModel):
    session_id: str


@api.post("/auth/emergent/session")
async def emergent_session(body: EmergentSessionRequest, response: Response):
    """Exchange an Emergent session_id for our JWT cookies.
    Upserts the user in our `users` collection so both Google and JWT paths share the same schema.
    """
    import requests as _rq
    try:
        emergent_resp = _rq.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
            timeout=10,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Emergent auth unreachable: {e}")
    if emergent_resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session_id")
    data = emergent_resp.json()
    email = (data.get("email") or "").lower()
    name = data.get("name") or (email.split("@")[0] if email else "Google User")
    picture = data.get("picture") or ""
    if not email:
        raise HTTPException(status_code=400, detail="Emergent session missing email")

    # Upsert user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        # update picture if not set
        updates = {}
        if picture and not user.get("avatar_url"):
            updates["avatar_url"] = picture
        if updates:
            await db.users.update_one({"id": user["id"]}, {"$set": updates})
            user.update(updates)
    else:
        base_slug = slugify(name) or f"user-{uuid.uuid4().hex[:6]}"
        slug = base_slug
        if await db.users.find_one({"slug": slug}):
            slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": "",  # OAuth users have no password
            "name": name,
            "slug": slug,
            "role": "author",
            "bio": "",
            "avatar_url": picture,
            "twitter": "",
            "github": "",
            "website": "",
            "created_at": now_iso(),
            "provider": "google",
        }
        await db.users.insert_one({**user})

    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}


# ================== CATEGORIES ==================
@api.get("/categories")
async def list_categories():
    # add counts
    result = []
    for c in CATEGORIES:
        count = await db.articles.count_documents({
            "category_slug": c["slug"], "status": "published"
        })
        result.append({**c, "count": count})
    return result


# ================== ARTICLES ==================
def _article_dto(a: dict, lang: str = "id") -> dict:
    a = _strip_id(a.copy())
    return a


@api.get("/articles")
async def list_articles(
    lang: str = Query("id"),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    author: Optional[str] = None,
    q: Optional[str] = None,
    status: str = Query("published"),
    featured: Optional[bool] = None,
    limit: int = Query(50, le=100),
    skip: int = 0,
):
    query: dict = {"status": status}
    if category:
        query["category_slug"] = category
    if tag:
        query["tags"] = tag
    if author:
        query["author_slug"] = author
    if featured is not None:
        query["featured"] = featured
    if q:
        content_field = f"content_{lang}"
        query["$or"] = [
            {f"{content_field}.title": {"$regex": q, "$options": "i"}},
            {f"{content_field}.excerpt": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.articles.find(query, {"_id": 0}).sort("published_at", -1).skip(skip).limit(limit)
    articles = await cursor.to_list(limit)
    return articles


@api.get("/articles/featured")
async def featured_articles(lang: str = "id", limit: int = 3):
    articles = await db.articles.find(
        {"status": "published", "featured": True}, {"_id": 0}
    ).sort("published_at", -1).limit(limit).to_list(limit)
    return articles


@api.get("/articles/popular")
async def popular_articles(lang: str = "id", limit: int = 6):
    articles = await db.articles.find(
        {"status": "published"}, {"_id": 0}
    ).sort("views", -1).limit(limit).to_list(limit)
    return articles


@api.get("/articles/{slug}")
async def get_article(slug: str, request: Request, lang: str = Query("id")):
    content_field = f"content_{lang}"
    article = await db.articles.find_one(
        {f"{content_field}.slug": slug}, {"_id": 0}
    )
    if not article:
        # try opposite lang
        other = "en" if lang == "id" else "id"
        article = await db.articles.find_one({f"content_{other}.slug": slug}, {"_id": 0})
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
    # increment views with Mongo-backed per-ip throttling (30 min TTL)
    client_ip = request.client.host if request.client else "unknown"
    view_key = f"{client_ip}:{article['id']}"
    try:
        # Try to insert a unique record; success means "new view" — TTL index will expire it in 30 min
        await db.article_views.insert_one({
            "key": view_key,
            "article_id": article["id"],
            "ip": client_ip,
            "created_at": datetime.now(timezone.utc),
        })
        await db.articles.update_one({"id": article["id"]}, {"$inc": {"views": 1}})
        article["views"] = article.get("views", 0) + 1
    except Exception:
        # duplicate within TTL window — do not increment
        pass
    return article


@api.get("/articles/{article_id}/related")
async def get_related_articles(article_id: str, lang: str = "id", limit: int = 3):
    """Related articles — shared tags first, fallback same category."""
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    tags = article.get("tags", []) or []
    category = article.get("category_slug")
    result: list = []
    seen = {article_id}
    if tags:
        cursor = db.articles.find(
            {
                "status": "published",
                "id": {"$ne": article_id},
                "tags": {"$in": tags},
            },
            {"_id": 0},
        ).sort("published_at", -1).limit(limit * 2)
        candidates = await cursor.to_list(limit * 2)
        # Rank by number of shared tags
        candidates.sort(key=lambda a: len(set(a.get("tags", [])) & set(tags)), reverse=True)
        for a in candidates:
            if a["id"] not in seen:
                result.append(a)
                seen.add(a["id"])
                if len(result) >= limit:
                    break
    if len(result) < limit and category:
        need = limit - len(result)
        cursor = db.articles.find(
            {
                "status": "published",
                "category_slug": category,
                "id": {"$nin": list(seen)},
            },
            {"_id": 0},
        ).sort("published_at", -1).limit(need)
        result.extend(await cursor.to_list(need))
    return result[:limit]


@api.get("/articles/{article_id}/siblings")
async def get_article_siblings(article_id: str):
    """Return slugs for both languages for lang-switching."""
    article = await db.articles.find_one({"id": article_id}, {"_id": 0, "content_id.slug": 1, "content_en.slug": 1})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id_slug": article.get("content_id", {}).get("slug") if article.get("content_id") else None,
        "en_slug": article.get("content_en", {}).get("slug") if article.get("content_en") else None,
    }


@api.post("/articles", status_code=201)
async def create_article(body: ArticleCreate, user: dict = Depends(current_user)):
    aid = str(uuid.uuid4())
    now = now_iso()
    # ensure slugs
    for lang in ("id", "en"):
        content = getattr(body, f"content_{lang}")
        if content and not content.slug:
            content.slug = slugify(content.title)
    doc = {
        "id": aid,
        "author_id": user["id"],
        "author_name": user["name"],
        "author_slug": user["slug"],
        "author_avatar": user.get("avatar_url", ""),
        "category_slug": body.category_slug,
        "tags": body.tags,
        "cover_image": body.cover_image or "",
        "ads_enabled": body.ads_enabled,
        "featured": body.featured,
        "status": body.status,
        "views": 0,
        "created_at": now,
        "updated_at": now,
        "published_at": now if body.status == "published" else None,
        "reading_time": 3,
        "content_id": body.content_id.model_dump() if body.content_id else None,
        "content_en": body.content_en.model_dump() if body.content_en else None,
    }
    await db.articles.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/articles/{article_id}")
async def update_article(article_id: str, body: ArticleUpdate, user: dict = Depends(current_user)):
    existing = await db.articles.find_one({"id": article_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    if user["role"] not in ("owner", "editor") and existing["author_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "content_id" in update and update["content_id"]:
        update["content_id"] = update["content_id"] if isinstance(update["content_id"], dict) else update["content_id"].model_dump()
    if "content_en" in update and update["content_en"]:
        update["content_en"] = update["content_en"] if isinstance(update["content_en"], dict) else update["content_en"].model_dump()
    update["updated_at"] = now_iso()
    if update.get("status") == "published" and not existing.get("published_at"):
        update["published_at"] = now_iso()
    await db.articles.update_one({"id": article_id}, {"$set": update})
    doc = await db.articles.find_one({"id": article_id}, {"_id": 0})
    return doc


@api.delete("/articles/{article_id}")
async def delete_article(article_id: str, user: dict = Depends(current_user)):
    existing = await db.articles.find_one({"id": article_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    if user["role"] not in ("owner", "editor") and existing["author_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.articles.delete_one({"id": article_id})
    return {"success": True}


@api.get("/authors/{slug}")
async def get_author(slug: str):
    user = await db.users.find_one({"slug": slug}, {"_id": 0, "password_hash": 0, "email": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Author not found")
    articles = await db.articles.find(
        {"author_slug": slug, "status": "published"}, {"_id": 0}
    ).sort("published_at", -1).to_list(100)
    return {"author": user, "articles": articles}


@api.get("/authors")
async def list_authors():
    users = await db.users.find({}, {"_id": 0, "password_hash": 0, "email": 0}).to_list(100)
    return users


# ================== COMMENTS ==================
@api.get("/comments/{article_id}")
async def list_comments(article_id: str):
    comments = await db.comments.find(
        {"article_id": article_id, "status": {"$ne": "spam"}}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return comments


@api.post("/comments", status_code=201)
async def create_comment(body: CommentCreate, user: dict = Depends(current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "article_id": body.article_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_avatar": user.get("avatar_url", ""),
        "body": body.body,
        "parent_id": body.parent_id,
        "upvotes": 0,
        "status": "approved",
        "created_at": now_iso(),
    }
    await db.comments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user: dict = Depends(current_user)):
    c = await db.comments.find_one({"id": comment_id})
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    if user["role"] not in ("owner", "editor") and c["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.comments.delete_one({"id": comment_id})
    return {"success": True}


@api.get("/admin/comments")
async def admin_list_comments(
    status: Optional[str] = None,
    limit: int = Query(200, le=500),
    user: dict = Depends(require_role("owner", "editor")),
):
    q = {}
    if status:
        q["status"] = status
    comments = await db.comments.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return comments


class CommentStatusUpdate(BaseModel):
    status: str  # approved | spam | pending


@api.patch("/admin/comments/{comment_id}")
async def moderate_comment(comment_id: str, body: CommentStatusUpdate, user: dict = Depends(require_role("owner", "editor"))):
    if body.status not in ("approved", "spam", "pending"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.comments.update_one({"id": comment_id}, {"$set": {"status": body.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"success": True}


# ================== SUBSCRIBERS ==================
@api.post("/subscribe", status_code=201)
async def subscribe(body: SubscribeIn):
    email = body.email.lower()
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        return {"success": True, "message": "Already subscribed"}
    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "active": True,
        "created_at": now_iso(),
    }
    await db.subscribers.insert_one(doc)
    # Fire-and-forget welcome email (no-op if Resend not configured)
    try:
        await send_newsletter_welcome(email)
    except Exception as e:
        logger.warning(f"Newsletter welcome email failed: {e}")
    return {"success": True, "message": "Subscribed"}


@api.get("/subscribers")
async def list_subscribers_admin(user: dict = Depends(require_role("owner", "editor"))):
    subs = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return subs


# ================== INVITES ==================
class InviteCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "author"  # author | editor


class InviteAccept(BaseModel):
    password: str


@api.post("/invites", status_code=201)
async def create_invite(body: InviteCreate, request: Request, user: dict = Depends(require_role("owner", "editor"))):
    if body.role not in ("author", "editor"):
        raise HTTPException(status_code=400, detail="Invalid role")
    email = body.email.lower()
    # Check if already a user
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="A user with this email already exists")
    token = uuid.uuid4().hex + uuid.uuid4().hex  # 64 chars
    from datetime import timedelta
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "token": token,
        "email": email,
        "name": body.name,
        "role": body.role,
        "invited_by": user["name"],
        "invited_by_id": user["id"],
        "status": "pending",
        "expires_at": expires_at,
        "created_at": now_iso(),
    }
    await db.invites.insert_one(doc)
    frontend = os.environ.get("FRONTEND_URL", "").rstrip("/")
    accept_url = f"{frontend}/id/invite/{token}"
    email_result = await send_author_invite(email, user["name"], accept_url)
    return {"success": True, "invite_id": doc["id"], "accept_url": accept_url, "email": email_result}


@api.get("/invites")
async def list_invites(user: dict = Depends(require_role("owner", "editor"))):
    invites = await db.invites.find({}, {"_id": 0, "token": 0}).sort("created_at", -1).to_list(200)
    return invites


@api.delete("/invites/{invite_id}")
async def revoke_invite(invite_id: str, user: dict = Depends(require_role("owner", "editor"))):
    result = await db.invites.delete_one({"id": invite_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invite not found")
    return {"success": True}


@api.get("/invites/token/{token}")
async def get_invite_by_token(token: str):
    invite = await db.invites.find_one({"token": token}, {"_id": 0, "token": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invite already used or revoked")
    if datetime.fromisoformat(invite["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite expired")
    return {"email": invite["email"], "name": invite["name"], "role": invite["role"], "invited_by": invite["invited_by"]}


@api.post("/invites/token/{token}/accept")
async def accept_invite(token: str, body: InviteAccept, response: Response):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    invite = await db.invites.find_one({"token": token})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invite already used")
    if datetime.fromisoformat(invite["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite expired")
    if await db.users.find_one({"email": invite["email"]}):
        raise HTTPException(status_code=400, detail="A user with this email already exists")
    slug = slugify(invite["name"]) or f"user-{uuid.uuid4().hex[:6]}"
    if await db.users.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    user = {
        "id": str(uuid.uuid4()),
        "email": invite["email"],
        "password_hash": hash_password(body.password),
        "name": invite["name"],
        "slug": slug,
        "role": invite["role"],
        "bio": "",
        "avatar_url": "",
        "twitter": "",
        "github": "",
        "website": "",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    await db.invites.update_one({"token": token}, {"$set": {"status": "accepted", "accepted_at": now_iso()}})
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}


# ================== ANALYTICS ==================
@api.get("/analytics/summary")
async def analytics_summary(user: dict = Depends(require_role("owner", "editor"))):
    total_articles = await db.articles.count_documents({})
    published = await db.articles.count_documents({"status": "published"})
    total_views_agg = await db.articles.aggregate([
        {"$group": {"_id": None, "sum": {"$sum": "$views"}}}
    ]).to_list(1)
    total_views = total_views_agg[0]["sum"] if total_views_agg else 0
    total_subs = await db.subscribers.count_documents({"active": True})
    total_comments = await db.comments.count_documents({})
    total_authors = await db.users.count_documents({})
    top = await db.articles.find(
        {"status": "published"}, {"_id": 0, "content_id.title": 1, "content_en.title": 1, "views": 1, "id": 1}
    ).sort("views", -1).limit(5).to_list(5)
    return {
        "total_articles": total_articles,
        "published": published,
        "total_views": total_views,
        "total_subscribers": total_subs,
        "total_comments": total_comments,
        "total_authors": total_authors,
        "top_articles": top,
    }


# ================== AI ==================
@api.post("/ai/generate")
async def ai_route(body: AIWriteRequest, user: dict = Depends(current_user)):
    try:
        text = await ai_generate(body.mode, body.prompt, body.source_text, body.target_lang)
        return {"result": text}
    except Exception as e:
        logging.exception("AI generation failed")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


# ================== UPLOAD ==================
@api.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(current_user)):
    ext = "bin"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "gif", "webp"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    content_type = file.content_type or f"image/{'jpeg' if ext == 'jpg' else ext}"
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {e}")
    file_id = str(uuid.uuid4())
    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "user_id": user["id"],
        "is_deleted": False,
        "created_at": now_iso(),
    })
    # public URL served through our /api/files endpoint
    return {
        "id": file_id,
        "path": result["path"],
        "url": f"/api/files/{file_id}",
    }


@api.get("/files/{file_id}")
async def download_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ct = get_object(record["storage_path"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage read error: {e}")
    return FastResponse(content=data, media_type=record.get("content_type") or ct)


# ================== SEO ==================
@api.get("/sitemap.xml")
async def sitemap():
    base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    articles = await db.articles.find({"status": "published"}, {"_id": 0}).to_list(1000)
    urls: List[str] = []
    for lang in ("id", "en"):
        urls.append(f"{base}/{lang}")
        for c in CATEGORIES:
            urls.append(f"{base}/{lang}/category/{c['slug']}")
        for a in articles:
            content = a.get(f"content_{lang}")
            if content and content.get("slug"):
                urls.append(f"{base}/{lang}/blog/{content['slug']}")
    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        body.append(f"  <url><loc>{u}</loc></url>")
    body.append("</urlset>")
    return FastResponse(content="\n".join(body), media_type="application/xml")


@api.get("/ads.txt")
async def ads_txt():
    return FastResponse(content="# google.com, pub-XXXXXXX, DIRECT, f08c47fec0942fa0\n",
                        media_type="text/plain")


@api.get("/rss.xml")
async def rss_feed(lang: str = "id"):
    base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    articles = await db.articles.find(
        {"status": "published"}, {"_id": 0}
    ).sort("published_at", -1).limit(50).to_list(50)
    site_title = "Developer Hub" + (" (Bahasa Indonesia)" if lang == "id" else "")
    items: List[str] = []
    for a in articles:
        c = a.get(f"content_{lang}") or a.get("content_id") or a.get("content_en")
        if not c or not c.get("slug"):
            continue
        title = (c["title"] or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        excerpt = (c.get("excerpt", "") or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        url = f"{base}/{lang}/blog/{c['slug']}"
        pub = a.get("published_at", "")
        items.append(
            f"    <item>\n"
            f"      <title>{title}</title>\n"
            f"      <link>{url}</link>\n"
            f"      <guid isPermaLink='true'>{url}</guid>\n"
            f"      <pubDate>{pub}</pubDate>\n"
            f"      <description>{excerpt}</description>\n"
            f"      <author>{a.get('author_name', '')}</author>\n"
            f"    </item>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0"><channel>\n'
        f"  <title>{site_title}</title>\n"
        f"  <link>{base}/{lang}</link>\n"
        f"  <description>Bilingual blog for developers</description>\n"
        f"  <language>{'id-ID' if lang == 'id' else 'en-US'}</language>\n"
        + "\n".join(items)
        + "\n</channel></rss>"
    )
    return FastResponse(content=xml, media_type="application/rss+xml")


# ================== ROOT ==================
@api.get("/")
async def root():
    return {"name": "Developer Hub API", "version": "1.0"}


app.include_router(api)

# CORS: allow both wildcard (no credentials) for public API access and explicit
# frontend origin (with credentials for cookie-based auth). Starlette picks the
# first matching CORSMiddleware, so we install the credentialed one first.
frontend_url = os.environ.get("FRONTEND_URL")
allowed_origins = [frontend_url] if frontend_url else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=bool(frontend_url),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    # indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("slug", unique=True)
    await db.articles.create_index("id", unique=True)
    await db.articles.create_index("content_id.slug")
    await db.articles.create_index("content_en.slug")
    await db.articles.create_index("category_slug")
    await db.articles.create_index("author_slug")
    await db.articles.create_index("published_at")
    await db.comments.create_index("article_id")
    await db.subscribers.create_index("email", unique=True)
    await db.invites.create_index("token", unique=True)
    await db.invites.create_index("email")
    # TTL for article view dedup: expires 30 min after created_at
    await db.article_views.create_index("key", unique=True)
    await db.article_views.create_index("created_at", expireAfterSeconds=1800)
    # TTL for refresh-token revocation list: 30 days
    await db.revoked_tokens.create_index("hash", unique=True)
    await db.revoked_tokens.create_index(
        "created_at",
        expireAfterSeconds=30 * 24 * 3600,
    )
    # object storage init (non-fatal)
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init failed: {e}")
    # seed data
    try:
        await run_seed(db)
        inserted = await seed_new_categories(db)
        if inserted:
            logger.info(f"Seeded {inserted} articles for new categories")
        logger.info("Seed complete")
    except Exception as e:
        logger.warning(f"Seed skipped: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
