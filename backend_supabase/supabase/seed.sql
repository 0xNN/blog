-- ==========================================================
-- MSNCode — Seed Data  (LOCAL DEV ONLY)
-- Runs automatically on `supabase db reset`.
-- DO NOT run against production: it creates demo login accounts
-- with a known password. In production you sign up your own owner.
-- ==========================================================

-- 1) Create demo auth users. The on_auth_user_created trigger auto-inserts
--    matching user_profiles rows (role defaults to 'author').
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'admin@msncode.dev',
   crypt('devpassword', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Rafael Owner","slug":"rafael-owner"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'author@msncode.dev',
   crypt('devpassword', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Kirana Dewi","slug":"kirana-dewi"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'editor@msncode.dev',
   crypt('devpassword', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Marco Editor","slug":"marco-editor"}')
ON CONFLICT (id) DO NOTHING;

-- 2) Elevate roles + fill profile details (trigger created them as 'author').
UPDATE user_profiles SET role = 'owner',
  bio = 'Founder of MSNCode. Building tools & writing about the developer journey.',
  avatar_url = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
  twitter = 'rafael_msncode', github = 'rafael-msncode', website = 'https://msncode.dev'
  WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE user_profiles SET
  bio = 'Indie hacker & full-stack dev. Writing tutorials from Jakarta.',
  avatar_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  twitter = 'kiranadev', github = 'kiranadev'
  WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE user_profiles SET role = 'editor',
  bio = 'Senior editor curating the best dev content.',
  avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop'
  WHERE id = '00000000-0000-0000-0000-000000000003';

-- 3) Demo articles (author_* denormalized to match Edge Function reads).
INSERT INTO articles
  (id, author_id, author_name, author_slug, author_avatar, category_slug, tags,
   cover_image, ads_enabled, featured, status, views, reading_time,
   content_id, content_en, published_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Rafael Owner', 'rafael-owner',
   'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
   'tutorial-coding', ARRAY['react','hooks','javascript'],
   'https://images.unsplash.com/photo-1542903660-eedba2cda473?crop=entropy&cs=srgb&fm=jpg&q=85',
   true, true, 'published', 1200, 4,
   '{"title":"Menguasai React Hooks: Panduan Lengkap 2026","slug":"menguasai-react-hooks-2026","excerpt":"Pelajari useState, useEffect, useMemo, dan custom hooks dengan contoh nyata.","meta_description":"Panduan lengkap React Hooks 2026.","body_md":"## Pengenalan React Hooks\n\nReact Hooks mengubah cara kita menulis komponen React.\n\n## useState\n\n```jsx\nconst [count, setCount] = useState(0);\n```"}',
   '{"title":"Mastering React Hooks: The Complete 2026 Guide","slug":"mastering-react-hooks-2026","excerpt":"Learn useState, useEffect, useMemo, and custom hooks with real examples.","meta_description":"Complete 2026 React Hooks guide.","body_md":"## Introduction to React Hooks\n\nHooks changed how we write React."}',
   now() - interval '2 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Kirana Dewi', 'kirana-dewi',
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
   'error-solutions', ARRAY['debugging','javascript','node'],
   'https://images.unsplash.com/photo-1562813733-b31f71025d54?crop=entropy&cs=srgb&fm=jpg&q=85',
   true, false, 'published', 3400, 3,
   '{"title":"Cara Fix Error Cannot read properties of undefined di JavaScript","slug":"fix-cannot-read-properties-undefined","excerpt":"Error paling sering di JS.","meta_description":"Fix undefined error.","body_md":"## Kenapa Error Ini Muncul\n\nTerjadi saat mengakses property dari undefined."}',
   '{"title":"How to Fix Cannot read properties of undefined in JavaScript","slug":"fix-cannot-read-properties-undefined-en","excerpt":"JS #1 error.","meta_description":"Fix undefined error.","body_md":"## Why This Error Happens\n\nFires when you access a property on undefined."}',
   now() - interval '12 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Rafael Owner', 'rafael-owner',
   'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
   'ai-prompt', ARRAY['ai','claude','prompt'],
   'https://images.unsplash.com/photo-1646583288948-24548aedffd8?crop=entropy&cs=srgb&fm=jpg&q=85',
   true, true, 'published', 2800, 5,
   '{"title":"10 Prompt Claude Sonnet 4.5 yang Membuat Coding 3x Lebih Cepat","slug":"10-prompt-claude-4-5-coding-3x","excerpt":"Prompt teruji untuk refactor & review.","meta_description":"10 prompt Claude Sonnet 4.5.","body_md":"## Prompt Bagus = Output Bagus\n\n10 prompt yang saya pakai tiap hari."}',
   '{"title":"10 Claude Sonnet 4.5 Prompts That Make You Code 3x Faster","slug":"10-claude-4-5-prompts-code-3x-faster","excerpt":"Battle-tested prompts.","meta_description":"10 proven Claude prompts.","body_md":"## Good Prompts = Good Output\n\n10 prompts I use daily."}',
   now() - interval '6 hours');

-- 4) Sample affiliate link + subscriber.
INSERT INTO affiliate_links (name, url, merchant, category_slug, description, clicks, active)
VALUES ('Hostinger', 'https://www.hostinger.com/?REFERRAL=msncode', 'Hostinger',
  'tools-review', 'Web hosting murah untuk deploy blog developer', 0, true)
ON CONFLICT DO NOTHING;

INSERT INTO subscribers (email, active)
VALUES ('test@msncode.dev', true)
ON CONFLICT (email) DO NOTHING;
