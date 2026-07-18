# MSNCode — Roadmap Monetisasi & Growth (Versi Agent)

> Turunan dari MONETIZATION_ROADMAP.md, disesuaikan dengan kondisi app saat ini:
> Vite SPA (client-side), backend Supabase Edge Functions + PostgreSQL sudah matang, auth/SEO/AI sudah ada,
> AdSense masih placeholder, affiliate system sudah diimplementasikan (tapi disclosure belum).
>
> Prinsip: **passive income = traffic × RPM × compounding − biaya maintenance.**
> Constraint nyata: AdSense butuh approval (bisa berbulan-bulan / ditolak), Next.js = XL.

Legenda effort: **S** <1 hari · **M** 1–3 hari · **L** 4–10 hari · **XL** >2 minggu

---

## FILOSOFI URUTAN

1. **Cari uang paling cepat tanpa bergantung pihak ketiga** → affiliate (1.2).
2. **Buka keran traffic secepat mungkin dengan effort kecil** → SSR meta shim (0a) + daftar AdSense dari hari ke-1 biar approval jalan di background.
3. **Bangun aset yang kita miliki** → email list (2.1), sebelum Google bisa hilang.
4. **Baru investasi besar (Next.js, paywall, produk digital)** kalau traffic & audiens sudah ada.

---

## FASE 1 — Revenue Paling Cepat (minggu 1–2)

### 1.2 Affiliate Link System **(M–L)** ⭐ START DI SINI ✅ SUDAH DIIMPLEMENTASIKAN
- [x] Backend: tabel `affiliate_links` (`id`, `name`, `url`, `merchant`, `category_slug`, `description`, `image_url`, `clicks`, `active`).
- [x] Endpoint: CRUD (owner only via `service_role`) + `GET /r/{link_id}` redirect + increment klik. Handler di `redirect/index.ts`.
- [x] Frontend: `AffiliateBox.jsx` menampilkan link per kategori di halaman artikel. `affiliateHref()` di `api.js` bangun URL same-origin `/r/`.
- [x] Tracking klik per artikel (`affiliate_clicks` table dengan `link_id`, `article_id`, `ip`).
- [ ] Disclosure otomatis ("mengandung link afiliasi") — belum ada, perlu ditambahkan.
- **Kenapa dulu:** tak perlu approval, ROI sering > AdSense, langsung measurable.

### 0a SSR Meta Shim **(M)** — KERJAKAN PARalel
- Middleware deteksi bot → serve HTML ber-meta (title, description, canonical, og:*, hreflang, JSON-LD) dari data backend.
- Opsi: prerender endpoint `GET /articles/{slug}` khusus bot.
- **Acceptance:** share ke WA/Twitter dapat judul + cover; cek via opengraph.xyz.
- **Kenapa paralel:** tanpa ini traffic susah naik, dan afiliasi butuh traffic.

### 1.1 AdSense — DAFTAR SEKARANG, KERJA BELAKANGAN **(M)**
- Daftar AdSense hari ke-1 (approval berjalan sambil kita kerja).
- `AdSlot.jsx` render unit asli + lazy-load (IntersectionObserver).
- Isi `ads.txt` publisher ID asli; hormati `article.ads_enabled` (sudah ada di model).
- **Acceptance:** iklan tampil + ads.txt valid saat approval keluar.

---

## FASE 2 — Bangun Aset & Compounding (minggu 3–6)

### 2.1 Email Automation **(L)**
- Drip sequence 3–5 email untuk subscriber baru.
- Newsletter mingguan otomatis (kompilasi + slot afiliasi/sponsor).
- Segmentasi id/en (data sudah ada).
- **Kenapa penting:** email = aset kita; traffic Google bisa hilang, list tidak.

### 1.3 Analytics → Revenue **(M)**
- Metrik: klik afiliasi per artikel, estimasi RPM, top-earning articles.
- Dashboard urutkan by "revenue potential", bukan cuma views.
- **Acceptance:** owner lihat 10 artikel penghasil klik afiliasi terbanyak.

### 2.2 Internal Linking & Topic Clusters **(M)**
- Auto-suggest internal link saat nulis + halaman pillar per kategori.
- `RelatedArticles` dikuatkan dengan bobot topik.
- **Acceptance:** tiap artikel ≥3 internal link relevan otomatis.

### 2.3 Pagination + Caching **(M)**
- Cursor/offset pagination di `/articles` (ganti `?limit=50`, max 100).
- CDN cache halaman publik (otomatis kalau sudah SSR/ISR).
- **Acceptance:** list tak lag saat artikel >100; biaya DB stabil.

---

## FASE 3 — Investasi Jangka Panjang (kalau traffic serius)

### 0b Migrasi Next.js (App Router) **(XL)**
- `generateMetadata()` + ISR (`revalidate`).
- Lighthouse SEO ≥95, LCP <2.5s, "View Source" bukan cuma `<div id=root>`.
- Backend Supabase Edge Functions tetap sebagai API.

### 3.1 Sponsorship **(L)**
- Model `sponsored_slots` + masa aktif + badge "Sponsored".

### 3.2 Premium / Paywall **(L–XL)**
- Flag `is_premium` + gate + integrasi pembayaran (Stripe/Midtrans/Lemon Squeezy).

### 3.3 Produk Digital **(L)**
- Ebook/template/course dari konten yang ada + checkout.

---

## URUTAN EKSEKUSI (REKOMENDASI)

| # | Item | Alasan |
|---|------|--------|
| 1 | **1.2 Affiliate** | Revenue tercepat, no approval |
| 2 | **0a SSR shim** | Perbaiki share + SEO dasar, effort kecil |
| 3 | **1.1 AdSense (daftar)** | Approval jalan di background |
| 4 | **2.1 Email automation** | Bangun aset sendiri |
| 5 | **1.3 + 2.2 + 2.3** | Optimalisasi revenue & biaya |
| 6 | **0b Next.js** | Investasi saat traffic serius |
| 7 | **Tier 3** | Margin tinggi setelah audiens ada |

---

## REALITY CHECK (jangan dilewati)
1. "Passive" baru nyata setelah ~50–100 artikel berkualitas ranking. Awal = kerja aktif.
2. Google Helpful Content Update menghukum konten AI tipis → wajib tambah E-E-A-T (pengalaman/opini/data nyata).
3. Keunggulan = bilingual ID+EN; konten dev Bahasa Indonesia sepi → fokus di sana dulu.
4. Disclosure afiliasi/sponsor wajib (hukum + trust) → sudah dimasukkan tiap task terkait.
