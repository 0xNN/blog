-- ==========================================================
-- Add 'reader' role, make public signups readers (comment-only),
-- add comment author columns, and lock down direct table writes.
-- ==========================================================

-- 1) New role: reader (public signups). Authors/editors come via invite only.
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('owner', 'editor', 'author', 'reader'));

-- 2) Signup trigger: default role = 'reader'. Also read Google metadata keys
--    (full_name / picture) so OAuth profiles get a proper name & avatar.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _slug TEXT;
  _name TEXT;
  _avatar TEXT;
BEGIN
  _name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  _avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );
  _slug := COALESCE(
    NEW.raw_user_meta_data->>'slug',
    slugify(_name),
    'user-' || substr(NEW.id::text, 1, 8)
  );
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE slug = _slug) LOOP
    _slug := _slug || '-' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  INSERT INTO public.user_profiles (id, email, name, slug, role, avatar_url)
  VALUES (NEW.id, NEW.email, _name, _slug, 'reader', _avatar);
  -- SECURITY: role is always 'reader' here; elevation happens only via service_role.
  RETURN NEW;
END;
$$;

-- 3) Comments need denormalized author fields (Edge Function writes these).
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS user_avatar TEXT DEFAULT '';

-- 4) Lock down direct writes: ALL writes go through Edge Functions (service_role).
--    Without this, a 'reader' could bypass the create-article role check by
--    inserting straight into the table via the Data API (RLS only checks author_id).
REVOKE INSERT, UPDATE, DELETE ON articles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON comments FROM anon, authenticated;
