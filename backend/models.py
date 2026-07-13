"""Pydantic models for Developer Hub."""
from datetime import datetime, timezone
from typing import Optional, List, Literal, Annotated
from pydantic import BaseModel, Field, EmailStr, ConfigDict, BeforeValidator
from bson import ObjectId
import uuid


def _to_str(v) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_to_str)]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# -------------------- USER --------------------
Role = Literal["owner", "editor", "author"]


class UserBase(BaseModel):
    email: EmailStr
    name: str
    bio: Optional[str] = ""
    avatar_url: Optional[str] = ""
    twitter: Optional[str] = ""
    github: Optional[str] = ""
    website: Optional[str] = ""


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(UserBase):
    id: str
    role: Role
    slug: str
    created_at: str


class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    password_hash: str
    role: Role = "author"
    slug: str
    created_at: str = Field(default_factory=now_iso)


# -------------------- ARTICLE --------------------
Status = Literal["draft", "published", "review"]
Lang = Literal["id", "en"]

CATEGORIES = [
    {"slug": "tutorial-coding", "name_id": "Tutorial Coding", "name_en": "Coding Tutorial"},
    {"slug": "error-solutions", "name_id": "Cara Fix Error", "name_en": "Error Solutions"},
    {"slug": "tools-review", "name_id": "Review Tools", "name_en": "Tools Review"},
    {"slug": "developer-finance", "name_id": "Finansial Developer", "name_en": "Developer Finance"},
    {"slug": "ai-prompt", "name_id": "AI & Prompt Engineering", "name_en": "AI & Prompt Engineering"},
    {"slug": "ai-agents", "name_id": "AI Agents", "name_en": "AI Agents"},
    {"slug": "career-interview", "name_id": "Karir & Interview", "name_en": "Career & Interview"},
    {"slug": "nocode-lowcode", "name_id": "No-Code & Low-Code", "name_en": "No-Code / Low-Code"},
    {"slug": "saas-indie", "name_id": "SaaS & Indie Hacker", "name_en": "SaaS & Indie Hacker"},
    {"slug": "blockchain-crypto", "name_id": "Blockchain & Cryptocurrency", "name_en": "Blockchain & Cryptocurrency"},
    {"slug": "trading", "name_id": "Trading Stock/Crypto/Forex", "name_en": "Trading Stock/Crypto/Forex"},
]


class ArticleContent(BaseModel):
    """Localized article content."""
    title: str
    slug: str
    excerpt: str = ""
    body_md: str
    meta_description: str = ""


class ArticleBase(BaseModel):
    category_slug: str
    tags: List[str] = []
    cover_image: Optional[str] = ""
    ads_enabled: bool = True
    featured: bool = False
    content_id: Optional[ArticleContent] = None
    content_en: Optional[ArticleContent] = None


class ArticleCreate(ArticleBase):
    status: Status = "draft"


class ArticleUpdate(BaseModel):
    category_slug: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image: Optional[str] = None
    ads_enabled: Optional[bool] = None
    featured: Optional[bool] = None
    status: Optional[Status] = None
    content_id: Optional[ArticleContent] = None
    content_en: Optional[ArticleContent] = None


class ArticleOut(ArticleBase):
    id: str
    author_id: str
    author_name: str
    author_slug: str
    author_avatar: Optional[str] = ""
    status: Status
    views: int = 0
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    reading_time: int = 0


# -------------------- COMMENT --------------------
class CommentCreate(BaseModel):
    article_id: str
    body: str = Field(min_length=1, max_length=2000)
    parent_id: Optional[str] = None


class CommentOut(BaseModel):
    id: str
    article_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = ""
    body: str
    parent_id: Optional[str] = None
    upvotes: int = 0
    created_at: str


# -------------------- SUBSCRIBER --------------------
class SubscribeIn(BaseModel):
    email: EmailStr


class SubscriberOut(BaseModel):
    id: str
    email: str
    created_at: str
    active: bool = True


# -------------------- AFFILIATE --------------------
class AffiliateLinkBase(BaseModel):
    name: str = Field(min_length=1)
    url: str = Field(min_length=1)
    merchant: str = ""
    category_slug: Optional[str] = None
    description: str = ""
    image_url: Optional[str] = ""


class AffiliateLinkCreate(AffiliateLinkBase):
    pass


class AffiliateLinkUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    merchant: Optional[str] = None
    category_slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class AffiliateLinkOut(AffiliateLinkBase):
    id: str
    clicks: int = 0
    created_at: str
    updated_at: str


# -------------------- AI --------------------
class AIWriteRequest(BaseModel):
    prompt: str
    mode: Literal["draft", "translate", "improve", "meta"] = "draft"
    target_lang: Optional[Lang] = None
    source_text: Optional[str] = None
