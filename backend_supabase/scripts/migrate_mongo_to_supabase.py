"""
Migrate data from MongoDB (Atlas/current) to Supabase Postgres.

Usage:
  cd backend_supabase
  python scripts/migrate_mongo_to_supabase.py

Requires:
  pip install pymongo motor supabase-py requests
  (.venv from backend/ has most of these)

Env vars needed (copy from ../backend/.env):
  MONGO_URL=
  DB_NAME=
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
"""
import os
import sys
import json
import uuid as uuid_mod
from datetime import datetime, timezone

import requests


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def main():
    MONGO_URL = os.environ.get("MONGO_URL")
    DB_NAME = os.environ.get("DB_NAME", "developer_hub")
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not all([MONGO_URL, SUPABASE_URL, SUPABASE_KEY]):
        print("ERROR: Set MONGO_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    # Supabase headers
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    supabase_api = f"{SUPABASE_URL}/rest/v1"

    # ---------- MongoDB ----------
    from pymongo import MongoClient
    client = MongoClient(MONGO_URL)
    mongo = client[DB_NAME]

    collections_to_migrate = [
        "articles", "comments", "subscribers", "invites",
        "affiliate_links", "article_views",
    ]

    for coll_name in collections_to_migrate:
        print(f"\n--- Migrating {coll_name} ---")
        docs = list(mongo[coll_name].find({}))
        if not docs:
            print(f"  No documents to migrate")
            continue

        # Remove MongoDB-specific fields
        cleaned = []
        for doc in docs:
            doc.pop("_id", None)
            # Convert ObjectId to string
            for k, v in doc.items():
                if isinstance(v, (uuid_mod.UUID)):
                    doc[k] = str(v)
            # Handle dates
            for k in ["created_at", "updated_at", "published_at", "expires_at", "accepted_at"]:
                if k in doc and isinstance(doc[k], datetime):
                    doc[k] = doc[k].isoformat()
            cleaned.append(doc)

        # Insert in batches of 50
        batch_size = 50
        for i in range(0, len(cleaned), batch_size):
            batch = cleaned[i:i + batch_size]
            try:
                resp = requests.post(
                    f"{supabase_api}/{coll_name}",
                    headers=headers,
                    json=batch,
                )
                if resp.status_code in (200, 201):
                    print(f"  Inserted {len(batch)} records ({i + len(batch)}/{len(cleaned)})")
                elif resp.status_code == 409:
                    # Conflict — skip (data may already exist)
                    print(f"  Skipped {len(batch)} (already exists)")
                else:
                    print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                print(f"  ERROR: {e}")

    # ---------- Users (special handling) ----------
    print("\n--- Migrating users to auth.users ---")
    users = list(mongo["users"].find({}))
    for user in users:
        user.pop("_id", None)
        uid = user["id"]
        email = user.get("email", "")
        name = user.get("name", "")
        slug = user.get("slug", "")
        role = user.get("role", "author")
        avatar = user.get("avatar_url", "")
        bio = user.get("bio", "")
        twitter = user.get("twitter", "")
        github = user.get("github", "")
        website = user.get("website", "")
        password_hash = user.get("password_hash", "")

        # Check if user already exists in Supabase auth
        resp = requests.get(
            f"{supabase_api}/user_profiles?id=eq.{uid}",
            headers=headers,
        )
        if resp.status_code == 200 and resp.json():
            print(f"  User {email} already migrated")
            continue

        # We can't directly create auth.users via REST API.
        # Instead, create user profile directly (for dev)
        profile_resp = requests.post(
            f"{supabase_api}/user_profiles",
            headers=headers,
            json={
                "id": uid,
                "email": email,
                "name": name,
                "slug": slug,
                "role": role,
                "bio": bio,
                "avatar_url": avatar,
                "twitter": twitter,
                "github": github,
                "website": website,
            },
        )
        if profile_resp.status_code in (200, 201):
            print(f"  Migrated profile: {email} ({role})")
        elif profile_resp.status_code == 409:
            print(f"  Profile already exists: {email}")
        else:
            print(f"  ERROR migrating {email}: {profile_resp.text[:200]}")

    print("\nDone! Note: Users won't be able to log in until auth.users entries are created.")
    print("Run: supabase auth sign-up or create them in Supabase Dashboard > Authentication > Users")


if __name__ == "__main__":
    main()
