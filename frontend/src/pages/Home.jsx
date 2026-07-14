import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Code2, Bug, Wrench, DollarSign, Sparkles, Bot, GraduationCap, Zap, Rocket, Network } from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import ArticleCard from "@/components/ArticleCard";
import NewsletterForm from "@/components/NewsletterForm";
import { PageSeo } from "@/components/Seo";
import Reveal from "@/components/Reveal";
import FeaturedCarousel from "@/components/FeaturedCarousel";

// How many editor's-pick articles the featured carousel shows. Change freely.
const FEATURED_COUNT = 3;

const PILLARS = [
    { slug: "tutorial-coding",   icon: Code2,        id: "Tutorial Coding",     en: "Coding Tutorials",    desc_id: "Panduan langkah demi langkah", desc_en: "Step-by-step guides" },
    { slug: "error-solutions",   icon: Bug,          id: "Fix Error",           en: "Error Solutions",     desc_id: "Solusi cepat untuk bug",       desc_en: "Fast fixes for bugs" },
    { slug: "tools-review",      icon: Wrench,       id: "Review Tools",        en: "Tools Review",        desc_id: "Ulasan tools developer",        desc_en: "Dev tool reviews" },
    { slug: "developer-finance", icon: DollarSign,   id: "Finansial Dev",       en: "Dev Finance",         desc_id: "Kelola keuangan dev",           desc_en: "Manage dev money" },
    { slug: "ai-prompt",         icon: Sparkles,     id: "AI & Prompt",         en: "AI & Prompts",        desc_id: "AI untuk developer",            desc_en: "AI for developers" },
    { slug: "ai-agents",         icon: Bot,          id: "AI Agents",           en: "AI Agents",           desc_id: "Bangun agent otonom",           desc_en: "Build autonomous agents" },
    { slug: "career-interview",  icon: GraduationCap,id: "Karir & Interview",   en: "Career",              desc_id: "Naik level karir",              desc_en: "Level up your career" },
    { slug: "nocode-lowcode",    icon: Zap,          id: "No-Code",             en: "No-Code",             desc_id: "Bangun tanpa koding",           desc_en: "Build without code" },
    { slug: "saas-indie",        icon: Rocket,       id: "SaaS & Indie",        en: "SaaS & Indie",        desc_id: "Journey indie hacker",          desc_en: "Indie hacker journey" },
    { slug: "blockchain-crypto", icon: Network,      id: "Blockchain & Crypto", en: "Blockchain & Crypto", desc_id: "Web3, smart contracts, DeFi",  desc_en: "Web3, smart contracts, DeFi" },
    { slug: "trading",           icon: TrendingUp,   id: "Trading",             en: "Trading",             desc_id: "Stock, Crypto, Forex",          desc_en: "Stock, Crypto, Forex" },
];

export default function Home() {
    const { lang, t } = useLang();
    const [featured, setFeatured] = useState([]);
    const [latest, setLatest] = useState([]);
    const [popular, setPopular] = useState([]);

    useEffect(() => {
        api.get(`/articles/featured?lang=${lang}&limit=${FEATURED_COUNT}`).then((r) => setFeatured(r.data)).catch(() => {});
        api.get(`/articles?lang=${lang}&limit=9`).then((r) => setLatest(r.data)).catch(() => {});
        api.get(`/articles/popular?lang=${lang}&limit=4`).then((r) => setPopular(r.data)).catch(() => {});
    }, [lang]);

    const featuredIds = new Set(featured.map((a) => a.id));

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PageSeo
                lang={lang}
                path={`/${lang}`}
                title={lang === "id" ? "Blog Developer Bilingual (ID + EN)" : "The Bilingual Developer Blog"}
                description={lang === "id"
                    ? "Tutorial mendalam, solusi error real-world, dan cerita indie hacker untuk developer Indonesia & global."
                    : "In-depth tutorials, real-world error fixes, and indie hacker stories for developers worldwide."}
            />
            {/* Hero */}
            <section className="pt-16 pb-14 lg:pt-24 lg:pb-20 border-b border-border">
                <div className="grid lg:grid-cols-12 gap-10 items-end">
                    <div className="lg:col-span-7 space-y-6 animate-fade-in">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-mono">
                            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse"></span>
                            {t("Blog developer • Bilingual ID + EN", "Developer blog • Bilingual ID + EN")}
                        </div>
                        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95]">
                            {t(
                                <>Tulis kode. <br /><span className="text-[hsl(var(--accent))]">Baca cerita.</span><br />Naik level.</>,
                                <>Ship code. <br /><span className="text-[hsl(var(--accent))]">Read stories.</span><br />Level up.</>
                            )}
                        </h1>
                        <p className="font-body text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                            {t(
                                "Tutorial mendalam, solusi error real-world, dan cerita indie hacker — semua di satu tempat yang dibangun untuk developer.",
                                "Deep tutorials, real-world error fixes, and indie hacker stories — all in one place built for developers."
                            )}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to={`/${lang}/blog`}
                                data-testid="hero-cta-explore"
                                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--accent))] text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
                            >
                                {t("Jelajahi artikel", "Explore articles")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to={`/${lang}/register`}
                                data-testid="hero-cta-write"
                                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:border-[hsl(var(--accent))] transition"
                            >
                                {t("Jadi kontributor", "Become a contributor")}
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="rounded-3xl border border-border overflow-hidden bg-card">
                            <img
                                src="https://images.unsplash.com/photo-1542903660-eedba2cda473?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMHRlY2huaWNhbCUyMGNvZGUlMjBwYXR0ZXJufGVufDB8fHx8MTc4MzY2NTExMHww&ixlib=rb-4.1.0&q=85"
                                alt="Abstract code pattern"
                                className="w-full aspect-square object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured hero article */}
            {featured.length > 0 && (
                <Reveal as="section" className="py-16">
                    <div className="eyebrow mb-6">{t("Pilihan Editor", "Editor's Picks")}</div>
                    <FeaturedCarousel articles={featured} />
                </Reveal>
            )}

            {/* Category pillars */}
            <Reveal as="section" className="py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="eyebrow">{t("11 Pilar Konten", "11 Content Pillars")}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {PILLARS.map((p) => {
                        const Icon = p.icon;
                        return (
                            <Link
                                key={p.slug}
                                to={`/${lang}/category/${p.slug}`}
                                data-testid={`pillar-${p.slug}`}
                                className="group relative card-lift rounded-2xl border border-border bg-card overflow-hidden"
                            >
                                {/* Hover gradient wash */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent))]/[0.06] via-[hsl(var(--accent))]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Oversized decorative icon — clipped at corner for depth */}
                                <Icon
                                    aria-hidden="true"
                                    strokeWidth={1}
                                    className="absolute -bottom-4 -right-4 h-24 w-24 text-[hsl(var(--accent))]/[0.07] group-hover:text-[hsl(var(--accent))]/[0.15] transition-colors duration-500 pointer-events-none"
                                />

                                <div className="relative p-5">
                                    {/* Icon badge */}
                                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 group-hover:bg-[hsl(var(--accent))]/20 transition-colors duration-300">
                                        <Icon className="h-[18px] w-[18px] text-[hsl(var(--accent))]" strokeWidth={2} />
                                    </div>
                                    <div className="font-heading font-bold leading-snug text-sm group-hover:text-[hsl(var(--accent))] transition-colors duration-200">
                                        {lang === "id" ? p.id : p.en}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 font-body leading-relaxed">
                                        {lang === "id" ? p.desc_id : p.desc_en}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </Reveal>

            {/* Latest + Popular */}
            <Reveal as="section" className="py-16 grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-heading text-2xl font-bold tracking-tight">
                            {t("Artikel Terbaru", "Latest Articles")}
                        </h2>
                        <Link to={`/${lang}/blog`} data-testid="see-all-articles" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                            {t("Lihat semua", "See all")} <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {latest
                            .filter((a) => !featuredIds.has(a.id))
                            .slice(0, 6)
                            .map((a) => (
                                <ArticleCard key={`latest-${a.id}`} article={a} />
                            ))}
                    </div>
                </div>

                <aside className="space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4 w-4 text-[hsl(var(--accent))]" />
                            <h2 className="font-heading text-sm font-bold uppercase tracking-widest">{t("Populer", "Popular")}</h2>
                        </div>
                        <ol className="space-y-4">
                            {popular.map((a, i) => {
                                const c = a[`content_${lang}`] || a.content_id;
                                if (!c) return null;
                                return (
                                    <li key={`pop-${a.id}`}>
                                        <Link
                                            to={`/${lang}/blog/${c.slug}`}
                                            data-testid={`popular-${c.slug}`}
                                            className="group flex gap-4"
                                        >
                                            <span className="font-heading text-3xl font-black text-muted-foreground/40 leading-none">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <div>
                                                <div className="font-heading font-bold leading-snug group-hover:text-[hsl(var(--accent))] transition-colors">
                                                    {c.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 font-body">
                                                    {a.author_name} · {a.views} views
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    <div className="rounded-2xl border border-border p-6 bg-card">
                        <h3 className="font-heading text-lg font-bold mb-2 tracking-tight">
                            {t("Newsletter mingguan", "Weekly newsletter")}
                        </h3>
                        <p className="text-sm text-muted-foreground font-body mb-4 leading-relaxed">
                            {t(
                                "Tips dev, tools baru, dan cerita indie hacker langsung ke inbox kamu.",
                                "Dev tips, new tools, and indie hacker stories delivered to your inbox."
                            )}
                        </p>
                        <NewsletterForm compact />
                    </div>
                </aside>
            </Reveal>
        </div>
    );
}
