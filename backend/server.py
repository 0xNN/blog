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

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, UploadFile, File, Query, Header
from fastapi.responses import Response as FastResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
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
from seed_data import run_seed


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
async def refresh_token(request_response: Response, request=Depends()):
    # simple: read cookie via header dependency
    from fastapi import Request as _Req  # noqa
    raise HTTPException(status_code=501, detail="Not implemented")


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
async def get_article(slug: str, lang: str = Query("id")):
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
    # increment views
    await db.articles.update_one({"id": article["id"]}, {"$inc": {"views": 1}})
    article["views"] = article.get("views", 0) + 1
    return article


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
    return {"success": True, "message": "Subscribed"}


@api.get("/subscribers")
async def list_subscribers(user: dict = Depends(require_role("owner", "editor"))):
    subs = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return subs


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


# ================== ROOT ==================
@api.get("/")
async def root():
    return {"name": "Developer Hub API", "version": "1.0"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # cannot combine * with credentials; frontend also sends via bearer
    allow_methods=["*"],
    allow_headers=["*"],
)

# Also allow credentials for explicit frontend origin
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[frontend_url],
        allow_credentials=True,
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
    # object storage init (non-fatal)
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init failed: {e}")
    # seed data
    try:
        await run_seed(db)
        logger.info("Seed complete")
    except Exception as e:
        logger.warning(f"Seed skipped: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
