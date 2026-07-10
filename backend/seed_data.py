"""Seed data for Developer Hub - creates users and 6 bilingual demo articles."""
import os
import uuid
from datetime import datetime, timezone, timedelta
from auth import hash_password


def _now_iso(offset_hours: int = 0) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=offset_hours)).isoformat()


def seed_users():
    return [
        {
            "id": str(uuid.uuid4()),
            "email": os.environ.get("ADMIN_EMAIL", "admin@devhub.io"),
            "password_hash": hash_password(os.environ.get("ADMIN_PASSWORD", "Admin123!")),
            "name": "Rafael Owner",
            "slug": "rafael-owner",
            "role": "owner",
            "bio": "Founder of Developer Hub. Building tools & writing about the developer journey.",
            "avatar_url": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop",
            "twitter": "rafael_devhub",
            "github": "rafael-devhub",
            "website": "https://devhub.io",
            "created_at": _now_iso(240),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "author@devhub.io",
            "password_hash": hash_password("Author123!"),
            "name": "Kirana Dewi",
            "slug": "kirana-dewi",
            "role": "author",
            "bio": "Indie hacker & full-stack dev. Writing tutorials from Jakarta.",
            "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
            "twitter": "kiranadev",
            "github": "kiranadev",
            "website": "",
            "created_at": _now_iso(120),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "editor@devhub.io",
            "password_hash": hash_password("Editor123!"),
            "name": "Marco Editor",
            "slug": "marco-editor",
            "role": "editor",
            "bio": "Senior editor curating the best dev content.",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
            "twitter": "",
            "github": "",
            "website": "",
            "created_at": _now_iso(72),
        },
    ]


def _article(author, category, cover, tags, featured, id_data, en_data, hours_ago):
    now = _now_iso(hours_ago)
    return {
        "id": str(uuid.uuid4()),
        "author_id": author["id"],
        "author_name": author["name"],
        "author_slug": author["slug"],
        "author_avatar": author["avatar_url"],
        "category_slug": category,
        "tags": tags,
        "cover_image": cover,
        "ads_enabled": True,
        "featured": featured,
        "status": "published",
        "views": 100 + hash(id_data["slug"]) % 5000,
        "created_at": now,
        "updated_at": now,
        "published_at": now,
        "reading_time": max(3, len(id_data["body_md"]) // 1000),
        "content_id": id_data,
        "content_en": en_data,
    }


def seed_articles(users):
    owner, author, _editor = users
    return [
        _article(
            owner, "tutorial-coding",
            "https://images.unsplash.com/photo-1542903660-eedba2cda473?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMHRlY2huaWNhbCUyMGNvZGUlMjBwYXR0ZXJufGVufDB8fHx8MTc4MzY2NTExMHww&ixlib=rb-4.1.0&q=85",
            ["react", "hooks", "javascript"], True,
            {
                "title": "Menguasai React Hooks: Panduan Lengkap 2026",
                "slug": "menguasai-react-hooks-2026",
                "excerpt": "Pelajari useState, useEffect, useMemo, dan custom hooks dengan contoh nyata yang bisa langsung dipakai.",
                "meta_description": "Panduan lengkap React Hooks 2026: useState, useEffect, useMemo, custom hooks dengan contoh kode interaktif.",
                "body_md": """## Pengenalan React Hooks

React Hooks mengubah cara kita menulis komponen React. Sebelumnya kita butuh class components untuk state, sekarang cukup fungsi.

## useState — State Dasar

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Klik saya: {count}
    </button>
  );
}
```

Yang penting diingat: `setCount` bersifat asynchronous. Jika Anda butuh nilai sebelumnya, gunakan updater function.

## useEffect — Side Effects

`useEffect` menangani side effects seperti data fetching, subscription, atau DOM manipulation.

```jsx
useEffect(() => {
  const id = setInterval(() => setTick(t => t + 1), 1000);
  return () => clearInterval(id);
}, []);
```

Cleanup function (return) sangat penting untuk mencegah memory leak.

## Custom Hooks

Custom hooks adalah cara terbaik untuk share logic antar komponen. Contohnya `useLocalStorage`:

```jsx
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
```

## Kesimpulan

React Hooks membuat kode lebih pendek, mudah di-test, dan reusable. Mulai dengan `useState` dan `useEffect`, lalu naik ke `useMemo`, `useCallback`, dan custom hooks.
""",
            },
            {
                "title": "Mastering React Hooks: The Complete 2026 Guide",
                "slug": "mastering-react-hooks-2026",
                "excerpt": "Learn useState, useEffect, useMemo, and custom hooks with real, copy-pasteable examples.",
                "meta_description": "Complete 2026 React Hooks guide: useState, useEffect, useMemo, custom hooks with interactive examples.",
                "body_md": """## Introduction to React Hooks

Hooks changed how we write React. Where you once needed class components for state, a plain function is enough now.

## useState — Basic State

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Click me: {count}
    </button>
  );
}
```

`setCount` is asynchronous. If you need the previous value, always use the updater form.

## useEffect — Side Effects

`useEffect` handles side effects such as data fetching, subscriptions, or DOM manipulation.

```jsx
useEffect(() => {
  const id = setInterval(() => setTick(t => t + 1), 1000);
  return () => clearInterval(id);
}, []);
```

The cleanup function (returned value) prevents memory leaks.

## Custom Hooks

Custom hooks are the cleanest way to share logic. Here's `useLocalStorage`:

```jsx
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
```

## Wrap Up

Hooks make React code shorter, easier to test, and reusable. Start with `useState` and `useEffect`, then level up to `useMemo`, `useCallback`, and your own custom hooks.
""",
            }, 2,
        ),
        _article(
            author, "error-solutions",
            "https://images.unsplash.com/photo-1562813733-b31f71025d54?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjBkYXJrJTIwd29ya3NwYWNlfGVufDB8fHx8MTc4MzY2NTExMHww&ixlib=rb-4.1.0&q=85",
            ["debugging", "javascript", "node"], False,
            {
                "title": "Cara Fix Error 'Cannot read properties of undefined' di JavaScript",
                "slug": "fix-cannot-read-properties-undefined",
                "excerpt": "Error paling sering di JS. Cari tahu akar masalahnya dan 4 pola untuk mencegahnya.",
                "meta_description": "Fix TypeError: Cannot read properties of undefined di JavaScript dengan optional chaining, guards, dan defaults.",
                "body_md": """## Kenapa Error Ini Muncul

`Cannot read properties of undefined (reading 'x')` terjadi saat kita mengakses property dari nilai yang `undefined`.

```js
const user = data.user; // data undefined -> boom
console.log(user.name); // TypeError
```

## Solusi 1 — Optional Chaining

```js
const name = data?.user?.name ?? "Anonymous";
```

## Solusi 2 — Guard Clause

```js
if (!data || !data.user) return null;
```

## Solusi 3 — Default Value

```js
const { user = {} } = data ?? {};
```

## Solusi 4 — TypeScript

Pakai TypeScript agar compiler yang menangkap kesalahan ini sebelum runtime.
""",
            },
            {
                "title": "How to Fix 'Cannot read properties of undefined' in JavaScript",
                "slug": "fix-cannot-read-properties-undefined-en",
                "excerpt": "JS's #1 error. Understand the root cause and four battle-tested patterns to prevent it.",
                "meta_description": "Fix TypeError: Cannot read properties of undefined in JavaScript with optional chaining, guards, and defaults.",
                "body_md": """## Why This Error Happens

`Cannot read properties of undefined (reading 'x')` fires when you access a property on an `undefined` value.

```js
const user = data.user; // data is undefined -> boom
console.log(user.name); // TypeError
```

## Fix 1 — Optional Chaining

```js
const name = data?.user?.name ?? "Anonymous";
```

## Fix 2 — Guard Clause

```js
if (!data || !data.user) return null;
```

## Fix 3 — Default Value

```js
const { user = {} } = data ?? {};
```

## Fix 4 — TypeScript

Adopt TypeScript so the compiler catches this class of bugs before runtime.
""",
            }, 12,
        ),
        _article(
            owner, "ai-prompt",
            "https://images.unsplash.com/photo-1646583288948-24548aedffd8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwY29uY2VwdCUyMGRhcmt8ZW58MHx8fHwxNzgzNjY1MTEwfDA&ixlib=rb-4.1.0&q=85",
            ["ai", "claude", "prompt"], True,
            {
                "title": "10 Prompt Claude Sonnet 4.5 yang Membuat Coding 3x Lebih Cepat",
                "slug": "10-prompt-claude-4-5-coding-3x",
                "excerpt": "Kumpulan prompt teruji untuk refactor, review, dan generate code dengan Claude Sonnet 4.5.",
                "meta_description": "10 prompt Claude Sonnet 4.5 terbukti mempercepat coding: refactor, review, testing, dokumentasi.",
                "body_md": """## Prompt yang Bagus = Output yang Bagus

Model sekuat apapun tetap butuh prompt yang jelas. Berikut 10 prompt yang saya pakai setiap hari.

### 1. Refactor Prompt
> "Refactor kode berikut. Pertahankan behavior. Ekstrak fungsi kecil, beri nama variabel yang jelas, dan return early. Balas hanya kode."

### 2. Code Review
> "Review kode ini. Fokus: bug, edge case, performance, dan readability. Tandai dengan tingkat prioritas."

### 3. Generate Unit Test
> "Tulis unit test untuk fungsi ini pakai Jest. Cover happy path, edge case, dan error case."

Lanjutkan pola ini — konteks yang spesifik, output format yang eksplisit.
""",
            },
            {
                "title": "10 Claude Sonnet 4.5 Prompts That Make You Code 3× Faster",
                "slug": "10-claude-4-5-prompts-code-3x-faster",
                "excerpt": "Battle-tested prompts for refactoring, code review, and generation with Claude Sonnet 4.5.",
                "meta_description": "10 proven Claude Sonnet 4.5 prompts to speed up coding: refactor, review, testing, documentation.",
                "body_md": """## Good Prompts = Good Output

The best model still needs a clear prompt. Here are 10 prompts I use daily.

### 1. Refactor Prompt
> "Refactor the following code. Preserve behavior. Extract small functions, give variables meaningful names, return early. Reply with code only."

### 2. Code Review
> "Review this code. Focus on bugs, edge cases, performance, readability. Tag each finding with a priority."

### 3. Generate Unit Test
> "Write Jest unit tests for this function. Cover the happy path, edge cases, and error cases."

Follow the same pattern: specific context, explicit output format.
""",
            }, 6,
        ),
        _article(
            author, "developer-finance",
            "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwyfHxtaW5pbWFsJTIwZGVzayUyMHNldHVwJTIwdGVjaHxlbnwwfHx8fDE3ODM2NjUxMTB8MA&ixlib=rb-4.1.0&q=85",
            ["career", "finance", "freelance"], False,
            {
                "title": "Panduan Keuangan untuk Developer Indonesia 2026",
                "slug": "panduan-keuangan-developer-2026",
                "excerpt": "Emergency fund, investasi, pajak freelance — checklist finansial untuk developer di Indonesia.",
                "meta_description": "Panduan keuangan lengkap developer Indonesia 2026: emergency fund, investasi, pajak freelance, dana pensiun.",
                "body_md": """## Kenapa Developer Perlu Melek Finansial

Gaji developer di atas rata-rata, tapi tanpa manajemen yang baik, uangnya menghilang begitu saja.

## 1. Emergency Fund — 6 Bulan Pengeluaran

Taruh di tabungan atau reksa dana pasar uang. Ini bukan investasi, ini asuransi.

## 2. Investasi — Rules of Thumb

- 50% reksa dana saham indeks (IDX30 / S&P 500 via ETF)
- 30% obligasi negara (SBN / ORI)
- 20% eksperimen (crypto, stock picking, dsb)

## 3. Pajak untuk Freelance

Kalau kamu freelance ke klien luar negeri, kamu tetap wajib lapor & bayar pajak Indonesia. NPWP wajib.

## 4. Dana Pensiun

Mulai sekarang, bukan nanti. Compounding butuh waktu.
""",
            },
            {
                "title": "Personal Finance Guide for Developers 2026",
                "slug": "personal-finance-guide-developers-2026",
                "excerpt": "Emergency fund, investing, freelance taxes — a financial checklist tailored for developers.",
                "meta_description": "Complete 2026 personal finance guide for developers: emergency fund, investing, freelance tax, retirement.",
                "body_md": """## Why Developers Should Care About Money

Developer salaries are above average, but without structure the money vanishes.

## 1. Emergency Fund — 6 Months of Expenses

Park it in a savings or money-market fund. It's insurance, not an investment.

## 2. Investing — Rules of Thumb

- 50% index funds (S&P 500 / broad-market ETFs)
- 30% government bonds
- 20% experiments (crypto, stock picking, etc.)

## 3. Freelance Taxes

If you invoice foreign clients, you still owe taxes in your home country. Register early.

## 4. Retirement

Start now, not later. Compounding needs time.
""",
            }, 24,
        ),
        _article(
            author, "career-interview",
            "https://images.unsplash.com/photo-1590212151175-e58edd96185b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwZGVzayUyMHNldHVwJTIwdGVjaHxlbnwwfHx8fDE3ODM2NjUxMTB8MA&ixlib=rb-4.1.0&q=85",
            ["career", "interview", "hiring"], False,
            {
                "title": "Cara Lolos Interview FAANG dari Indonesia (Tanpa Gelar CS)",
                "slug": "lolos-interview-faang-tanpa-cs",
                "excerpt": "Roadmap 6 bulan untuk system design, coding interview, dan behavioral round.",
                "meta_description": "Roadmap 6 bulan lolos interview FAANG dari Indonesia tanpa gelar CS: LeetCode, system design, behavioral.",
                "body_md": """## Realita Interview FAANG

Ini adalah maraton, bukan sprint. Rata-rata butuh 3–6 bulan persiapan intensif.

## Bulan 1–2: Fondasi

- Data structures: array, hash map, linked list, tree, graph
- Complexity analysis (Big-O)
- Kerjakan 50 LeetCode Easy

## Bulan 3–4: LeetCode Medium

Target 150 problem medium. Fokus pattern: two pointers, sliding window, BFS/DFS, dynamic programming.

## Bulan 5: System Design

Baca "Designing Data-Intensive Applications". Latihan dengan mock interview.

## Bulan 6: Behavioral

Siapkan 10 cerita STAR dari pengalaman sebelumnya.
""",
            },
            {
                "title": "How to Pass FAANG Interviews from Indonesia (No CS Degree)",
                "slug": "pass-faang-interviews-no-cs-degree",
                "excerpt": "A 6-month roadmap for system design, coding interviews, and behavioral rounds.",
                "meta_description": "6-month roadmap to pass FAANG interviews from Indonesia without a CS degree: LeetCode, system design, behavioral.",
                "body_md": """## The Reality of FAANG Interviews

It's a marathon, not a sprint. Expect 3–6 months of focused prep.

## Months 1–2: Foundations

- Data structures: array, hash map, linked list, tree, graph
- Big-O analysis
- Solve 50 LeetCode Easy

## Months 3–4: LeetCode Medium

Target 150 mediums. Focus patterns: two pointers, sliding window, BFS/DFS, dynamic programming.

## Month 5: System Design

Read Designing Data-Intensive Applications. Do mock interviews.

## Month 6: Behavioral

Prepare 10 STAR stories from your past.
""",
            }, 36,
        ),
        _article(
            owner, "saas-indie",
            "https://images.unsplash.com/photo-1590212151175-e58edd96185b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwZGVzayUyMHNldHVwJTIwdGVjaHxlbnwwfHx8fDE3ODM2NjUxMTB8MA&ixlib=rb-4.1.0&q=85",
            ["saas", "indie", "startup"], True,
            {
                "title": "Case Study: Dari $0 ke $10K MRR dalam 12 Bulan",
                "slug": "case-study-0-to-10k-mrr-12-bulan",
                "excerpt": "Bagaimana saya build & launch SaaS solo dari kamar tidur di Jakarta.",
                "meta_description": "Case study lengkap: build SaaS solo dari $0 ke $10K MRR dalam 12 bulan di Indonesia — stack, marketing, pricing.",
                "body_md": """## Timeline Cepat

- **Bulan 0**: Ide validasi lewat Twitter thread
- **Bulan 1–2**: Build MVP (Next.js + Supabase)
- **Bulan 3**: Launch di Product Hunt — $500 MRR
- **Bulan 6**: SEO mulai jalan — $3K MRR
- **Bulan 12**: $10K MRR

## Yang Berhasil

1. **Menulis konten SEO** dari hari pertama
2. **Pricing sederhana** — 2 tier saja
3. **Ngobrol dengan user setiap minggu**

## Yang Gagal

- Iklan berbayar (rugi)
- Menambah fitur tanpa validasi
- Redesign terlalu sering
""",
            },
            {
                "title": "Case Study: $0 to $10K MRR in 12 Months",
                "slug": "case-study-0-to-10k-mrr-12-months",
                "excerpt": "How I built and launched a SaaS solo from a bedroom in Jakarta.",
                "meta_description": "Full case study: bootstrapping a solo SaaS from $0 to $10K MRR in 12 months — stack, marketing, pricing.",
                "body_md": """## Quick Timeline

- **Month 0**: Idea validated via a Twitter thread
- **Months 1–2**: MVP built (Next.js + Supabase)
- **Month 3**: Product Hunt launch — $500 MRR
- **Month 6**: SEO kicked in — $3K MRR
- **Month 12**: $10K MRR

## What Worked

1. **SEO-first writing** from day one
2. **Simple pricing** — two tiers only
3. **Weekly customer calls**

## What Didn't

- Paid ads (lost money)
- Adding features without validation
- Redesigning too often
""",
            }, 48,
        ),
    ]


async def run_seed(db):
    """Idempotent seed - only inserts if collections are empty."""
    if await db.users.count_documents({}) == 0:
        users = seed_users()
        await db.users.insert_many([{**u} for u in users])
    else:
        # get existing users for article ownership
        users = await db.users.find({}, {"_id": 0}).to_list(10)
        users = sorted(users, key=lambda u: {"owner": 0, "author": 1, "editor": 2}.get(u["role"], 3))

    if await db.articles.count_documents({}) == 0 and len(users) >= 2:
        articles = seed_articles(users[:3])
        await db.articles.insert_many([{**a} for a in articles])
