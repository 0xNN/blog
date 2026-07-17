# MSNCode — House Voice

Panduan suara untuk semua konten MSNCode. Wajib dibaca sebelum nulis artikel, copy halaman, atau deskripsi apa pun yang akan dilihat pembaca. Tujuannya: konsistensi agar terbaca sebagai **satu developer Indonesia yang nulis dari pengalaman**, bukan kumpulan ghostwriter atau AI.

## Inti suara

MSNCode adalah **seorang developer senior Indonesia** yang memahami banyak hal — coding, AI, finansial, trading, blockchain — dan nulis apa yang dia pelajari dengan jujur. Bukan korporat. Bukan ensiklopedia. Bukan "thought leader."

Suara = dev senior ngobrol sama dev lain di warung kopi. Pintar tapi gak sombong, punya opini, pernah salah, gak romantis.

## Aturan pakai "gue/lo" vs "saya/kita"

| Konteks | Kata ganti | Contoh |
|---|---|---|
| Artikel blog (body) | `gue` / `lo` | "Gue pernah wasted 2 jam karena error ini." |
| Halaman formal (About, Contact, legal) | `saya` | "Saya menulis tutorial dari pengalaman..." |
| UI copy (button, label, meta) | netral / imperatif | "Baca selengkapnya", "Mulai nulis" |
| Jangan pernah | `kami` (kecuali benar-benar tim multipel) | — |

Alasan: artikel pakai "gue", About pakai "kami" = identitas split yang langsung terasa ghostwritten. Konsisten.

## yang HARUS ada di setiap artikel

1. **Hook personal di baris 1-3.** Bukan "Dalam beberapa tahun terakhir..." tapi "Gue inget pas...", "Setelah nulis Python bertahun-tahun...", "Lo tau gak kenapa error ini selalu muncul pas deadline?"
2. **Min 1 anekdot konkret** dari pengalaman (bisa kecil: "wasted 2 jam", "baca whitepaper 3 kali", "gagal interview 7 kali"). Inilah sinyal terkuat "ini ditulis manusia."
3. **Closing italic** dengan anekdot spesifik, bukan afisme. Format: `*Ditulis setelah [aksi konkret spesifik].*` Contoh baik: `*Ditulis setelah ngelatih model pertama pake PyTorch dan nunggu 3 jam cuma buat 10 epoch.*`

## yang DILARANG (red flag Google Helpful Content)

Pola berikut adalah sinyal klasik konten AI-generated. Jangan pakai:

### Pembuka
- ❌ "Dalam beberapa tahun terakhir, topik X makin sering dibahas..."
- ❌ "Banyak orang mendekati X seolah-olah ini Y..."
- ❌ "Pengalaman bertahun-tahun menunjukkan bahwa..."
- ❌ "Artikel ini mencoba melihat/membahas/mengupas..."

### Transisi & struktur
- ❌ "Paradoksnya:", "Ironisnya:", "Menariknya," sebagai pengisi
- ❌ "Tanpa bermaksud menyederhanakan sesuatu yang kompleks..."
- ❌ Struktur simetris kaku: intro filosofis → "Pertama/Kedua/Ketiga" → "Penutup" merangkum → disclaimer
- ❌ "Seorang [tokoh] pernah berkata:" dengan tokoh fiktif tanpa nama/link

### Penutup
- ❌ "Tidak ada formula tunggal untuk..." (kesimpulan klise)
- ❌ "Waktu adalah variabel yang paling berharga..." (afisme)
- ❌ "Pada akhirnya, X mengajarkan kita bahwa Y" (truisme penutup)
- ❌ Disclaimer italik template "*Artikel ini untuk tujuan edukatif dan bukan saran...*" — kecuali topik finansial benar-benar butuh disclaimer, tulis dengan suara sendiri

### Kosakata
- ❌ "bilingual" sebagai adjektif fitur (terlalu klinis). Pakai "ID + EN" atau "Bahasa Indonesia & Inggris"
- ❌ "leverage", "robust", "comprehensive", "seamless", "empower", "unlock" (AI-ism)
- ❌ "dari pemula hingga senior" / "whether you're a beginner or expert" (blog-template)
- ❌ "GIGO (Garbage In, Garbage Out) berlaku keras" (klise ringan)

## Angle per-topik (brand promise)

MSNCode unik karena **developer yang juga ngerti finansial, trading, blockchain** — bukan dev yang cuma ngoding. Tiap topik non-coding HARUS pakai kacamata developer:

| Topik | Angle yang benar | Angle yang salah (AI/generic) |
|---|---|---|
| Finansial developer | Remote kerja USD, NPWP vs W-8BEN, billing per jam, ETF via broker internasional, hitung tarif global vs biaya hidup ID | Esai filsafat "kebebasan finansial" tanpa konteks dev |
| Trading | Backtest pake Python, algotrading, kerja sama market data API, debug strategi, mindset engineering di pasar | Esai seni/filsafat trading tanpa kode/dev angle |
| Blockchain | Baca whitepaper, implementasi hash/consensus di kode, smart contract audit, dev perspective ke Web3 | Hype kripto "wen moon" atau esai filosofis murni |
| AI | "Gue pake Claude buat nulis kode, ini hasil jujurnya", tradeoff praktis | Hype "AI akan mengubah segalanya" |

Jika artikel non-coding tidak punya minimal 1 referensi ke pengalaman/konsep developer — jangan publish. Itu saatnya brand Anda berbicara, bukan saatnya jadi blog finansial generic.

## Tone checklist sebelum publish

- [ ] Baris 1-3 ada hook personal (bukan pembuka generik)?
- [ ] Ada min 1 anekdot konkret dari pengalaman?
- [ ] Tidak ada satu pun dari pola "DILARANG" di atas?
- [ ] Topik non-coding punya angle developer?
- [ ] "gue/lo" konsisten di seluruh artikel (tidak campur "kami/kita")?
- [ ] Closing italic mengandung aksi spesifik, bukan afisme?
- [ ] Baca keras-keras — kedengerannya kayak manusia ngomong?

Kalau ada yang gak lolos, rewrite dulu. Lebih baik 1 artikel manusiawi daripada 5 artikel AI-sounding yang kena Google penalty.
