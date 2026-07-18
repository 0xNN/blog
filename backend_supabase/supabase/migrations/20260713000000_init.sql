-- ==========================================================
-- MSNCode — Supabase Migration: Schema Init
-- ==========================================================

-- -------------------- EXTENSIONS --------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------- USER PROFILES --------------------
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('owner', 'editor', 'author')),
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  twitter TEXT DEFAULT '',
  github TEXT DEFAULT '',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_slug ON user_profiles(slug);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _slug TEXT;
BEGIN
  _slug := COALESCE(
    NEW.raw_user_meta_data->>'slug',
    slugify(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)),
    'user-' || substr(NEW.id::text, 1, 8)
  );
  -- Ensure unique slug
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE slug = _slug) LOOP
    _slug := _slug || '-' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  INSERT INTO public.user_profiles (id, email, name, slug, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    _slug,
    'author',  -- SECURITY: never trust user_metadata for role; elevate via service_role only
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------- ARTICLES --------------------
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES user_profiles(id),
  author_name TEXT DEFAULT '',
  author_slug TEXT DEFAULT '',
  author_avatar TEXT DEFAULT '',
  category_slug TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  cover_image TEXT DEFAULT '',
  ads_enabled BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'review')),
  views INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 3,
  content_id JSONB,
  content_en JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category_slug);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_featured ON articles(featured) WHERE featured = true;
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);

-- Slug search via JSONB
CREATE INDEX idx_articles_content_id_slug ON articles ((content_id->>'slug'));
CREATE INDEX idx_articles_content_en_slug ON articles ((content_en->>'slug'));
CREATE INDEX idx_articles_author_slug ON articles(author_slug);
-- NOTE: removed to_tsvector('indonesian', ...) GIN indexes — the 'indonesian' text-search
-- config does not exist in stock Postgres (it would abort this migration), and article
-- search currently uses ILIKE. Re-add with 'simple' config if full-text search is needed.

-- -------------------- COMMENTS --------------------
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  parent_id UUID REFERENCES comments(id),
  upvotes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'spam', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_comments_status ON comments(status);

-- -------------------- SUBSCRIBERS --------------------
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  lang TEXT DEFAULT 'id' CHECK (lang IN ('id', 'en')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------- INVITES --------------------
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'editor')),
  invited_by TEXT NOT NULL,
  invited_by_id UUID NOT NULL REFERENCES user_profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_email ON invites(email);

-- -------------------- AFFILIATE LINKS --------------------
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  merchant TEXT DEFAULT '',
  category_slug TEXT,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  clicks INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_links_category ON affiliate_links(category_slug);
CREATE INDEX idx_affiliate_links_active ON affiliate_links(active);

-- -------------------- AFFILIATE CLICKS --------------------
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_clicks_link ON affiliate_clicks(link_id);
CREATE INDEX idx_affiliate_clicks_article ON affiliate_clicks(article_id);

-- -------------------- ARTICLE VIEWS (dedup, TTL) --------------------
CREATE TABLE article_views (
  key TEXT UNIQUE NOT NULL,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_views_key ON article_views(key);
CREATE INDEX idx_article_views_created ON article_views(created_at);

-- Auto-expire after 30 minutes — OPTIONAL, requires pg_cron.
-- pg_cron is NOT enabled by default, so calling cron.schedule() here would abort the
-- migration. Enable it first (Dashboard > Database > Extensions > pg_cron), then run:
--   SELECT cron.schedule('delete-expired-views', '*/5 * * * *',
--     $$DELETE FROM article_views WHERE created_at < now() - interval '30 minutes'$$);
-- Until then, the dedup existence-check still works; rows just aren't auto-purged.

-- -------------------- ROW LEVEL SECURITY --------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);
CREATE POLICY "Published articles are viewable by everyone" ON articles
  FOR SELECT USING (status = 'published');
CREATE POLICY "Approved comments are viewable by everyone" ON comments
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Active affiliate links are viewable by everyone" ON affiliate_links
  FOR SELECT USING (active = true);

-- Authenticated user policies (cross-user/role actions are enforced in Edge Functions via service_role)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Authors can CRUD own articles" ON articles
  FOR ALL TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Logged-in users can comment" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can subscribe" ON subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- SECURITY (privilege-escalation guard): forbid clients from changing their own role.
-- Column-level REVOKE so anon/authenticated cannot UPDATE user_profiles.role via the
-- Data API. Edge Functions use the service_role key, which bypasses this and remains
-- the only path that can set/elevate roles (e.g. accepting an editor invite).
REVOKE UPDATE (role) ON user_profiles FROM anon, authenticated;

-- -------------------- HELPER: SLUGIFY --------------------
CREATE OR REPLACE FUNCTION slugify(text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT lower(regexp_replace(regexp_replace($1, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
$$;
