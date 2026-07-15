import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, FileText, Eye, Users, PenSquare, Globe2, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import { PageSeo } from "@/components/Seo";

function AuthorSkeleton() {
    return (
        <div className="rounded-2xl border border-border p-6 bg-card">
            <div className="flex items-center gap-3 mb-3">
                <div className="skeleton h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <div className="skeleton h-4 w-28" />
                    <div className="skeleton h-3 w-16" />
                </div>
            </div>
            <div className="skeleton h-3 w-full mb-2" />
            <div className="skeleton h-3 w-2/3" />
        </div>
    );
}

function StatCard({ icon: Icon, value, label }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))]">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="font-heading text-2xl font-black tracking-tight">{value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
            </div>
        </div>
    );
}

const BENEFITS = [
    {
        icon: Globe2,
        title_id: "Jangkauan Bilingual",
        title_en: "Bilingual Reach",
        desc_id: "Setiap artikel dipublikasikan dalam Bahasa Indonesia dan Inggris, menjangkau pembaca lokal maupun global.",
        desc_en: "Every article is published in both Indonesian and English, reaching both local and global readers.",
    },
    {
        icon: TrendingUp,
        title_id: "SEO yang Sudah Dibangun",
        title_en: "Built-in SEO",
        desc_id: "Sitemap, RSS, JSON-LD, dan Open Graph sudah terintegrasi. Fokus saja menulis, biarkan traffic mengalir.",
        desc_en: "Sitemap, RSS, JSON-LD, and Open Graph are integrated. Just focus on writing, let the traffic flow.",
    },
    {
        icon: PenSquare,
        title_id: "Editor dengan AI Assist",
        title_en: "AI-Assisted Editor",
        desc_id: "Markdown editor dengan syntax highlighting, live preview, Sandpack playground, dan AI writing assistant (Claude).",
        desc_en: "Markdown editor with syntax highlighting, live preview, Sandpack playground, and AI writing assistant (Claude).",
    },
];

export default function AuthorsPage() {
    const { lang, t } = useLang();
    const [authors, setAuthors] = useState([]);
    const [stats, setStats] = useState({ articles: 0, views: 0, contributors: 0 });
    const [topContributors, setTopContributors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/authors").then((r) => r.data).catch(() => []),
            api.get("/articles?limit=100").then((r) => r.data).catch(() => []),
        ]).then(([authorList, articles]) => {
            setAuthors(authorList);

            const countMap = {};
            let totalViews = 0;
            for (const a of articles) {
                const slug = a.author_slug;
                if (!slug) continue;
                if (!countMap[slug]) {
                    countMap[slug] = { count: 0, views: 0, author: null };
                    const found = authorList.find((au) => au.slug === slug);
                    if (found) countMap[slug].author = found;
                }
                countMap[slug].count++;
                countMap[slug].views += a.views || 0;
                totalViews += a.views || 0;
            }

            const ranked = Object.entries(countMap)
                .map(([slug, data]) => ({ slug, ...data }))
                .sort((a, b) => b.count - a.count)
                .filter((c) => c.author);

            setTopContributors(ranked.slice(0, 3));
            setStats({
                articles: articles.length,
                views: totalViews,
                contributors: authorList.length,
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
            <PageSeo
                lang={lang}
                path={`/${lang}/authors`}
                title={t("Kontributor", "Contributors")}
                description={t(
                    "Kenali para kontributor MSNCode — developer yang menulis tutorial, solusi error, dan cerita karir dalam dua bahasa.",
                    "Meet the MSNCode contributors — developers writing tutorials, error fixes, and career stories in two languages."
                )}
            />

            {/* Header */}
            <div className="mb-10">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">{t("Tim", "Team")}</div>
                <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight">
                    {t("Kontributor", "Contributors")}
                </h1>
                <p className="font-body text-muted-foreground mt-3 max-w-2xl">
                    {t(
                        "Developer yang berbagi pengetahuan melalui MSNCode. Setiap kontributor diundang melalui email untuk memastikan kualitas konten.",
                        "Developers sharing their knowledge through MSNCode. Each contributor is invited via email to ensure content quality."
                    )}
                </p>
            </div>

            {/* Stats */}
            {!loading && stats.contributors > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-12">
                    <StatCard icon={Users} value={stats.contributors} label={t("Kontributor", "Contributors")} />
                    <StatCard icon={FileText} value={stats.articles} label={t("Artikel", "Articles")} />
                    <StatCard icon={Eye} value={stats.views.toLocaleString()} label={t("Total Views", "Total Views")} />
                </div>
            )}

            {/* Top Contributors */}
            {!loading && topContributors.length > 0 && (
                <div className="mb-12">
                    <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                        {t("Paling Produktif", "Top Contributors")}
                    </h2>
                    <div className="space-y-3">
                        {topContributors.map((c, i) => (
                            <Link
                                key={c.slug}
                                to={`/${lang}/author/${c.slug}`}
                                className="card-lift flex items-center gap-4 rounded-2xl border border-border p-5 bg-card"
                            >
                                <div className="font-heading text-3xl font-black text-muted-foreground/40 w-8 text-center">
                                    {i + 1}
                                </div>
                                {c.author.avatar_url ? (
                                    <img src={c.author.avatar_url} alt={c.author.name} className="h-12 w-12 rounded-full object-cover" />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold">{c.author.name[0]}</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-heading font-bold">{c.author.name}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-widest">{c.author.role}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-heading font-black text-lg">{c.count}</div>
                                    <div className="text-xs text-muted-foreground">{t("artikel", "articles")}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* All Contributors Grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <AuthorSkeleton key={i} />)}
                </div>
            ) : authors.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {authors.map((a) => {
                        const stat = topContributors.find((c) => c.slug === a.slug);
                        return (
                            <Link
                                key={a.id}
                                to={`/${lang}/author/${a.slug}`}
                                data-testid={`author-card-${a.slug}`}
                                className="card-lift rounded-2xl border border-border p-6 bg-card"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {a.avatar_url ? (
                                        <img src={a.avatar_url} alt={a.name} className="h-12 w-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold">{a.name[0]}</div>
                                    )}
                                    <div>
                                        <div className="font-heading font-bold">{a.name}</div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-widest">{a.role}</div>
                                    </div>
                                </div>
                                {a.bio && <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-3">{a.bio}</p>}
                                {stat && (
                                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> {stat.count} {t("artikel", "articles")}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Eye className="h-3 w-3" /> {(stat.views || 0).toLocaleString()} {t("views", "views")}
                                        </span>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ) : (
                /* Empty State */
                <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                        <PenSquare className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-heading text-xl font-bold mb-2">
                        {t("Belum ada kontributor", "No contributors yet")}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {t(
                            "MSNCode baru saja memulai. Kontributor ditambahkan melalui undangan email.",
                            "MSNCode is just getting started. Contributors are added via email invitation."
                        )}
                    </p>
                </div>
            )}

            {/* Become a Contributor CTA */}
            <div className="mt-16 rounded-2xl border border-border bg-card p-8 lg:p-10">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">
                    {t("Jadi Kontributor", "Become a Contributor")}
                </div>
                <h2 className="font-heading text-3xl font-black tracking-tight mb-3">
                    {t("Tulis untuk MSNCode", "Write for MSNCode")}
                </h2>
                <p className="font-body text-muted-foreground mb-8 max-w-2xl">
                    {t(
                        "Kontributor dipilih melalui undangan email untuk menjaga kualitas konten. Kirim proposal kamu dan kami akan menghubungi via email.",
                        "Contributors are invited via email to maintain content quality. Send your proposal and we'll reach out via email."
                    )}
                </p>

                <div className="grid sm:grid-cols-3 gap-6 mb-8">
                    {BENEFITS.map((b) => (
                        <div key={b.title_en} className="space-y-2">
                            <div className="flex items-center gap-2 text-[hsl(var(--accent))]">
                                <b.icon className="h-4 w-4" />
                                <span className="font-heading text-sm font-bold">
                                    {lang === "id" ? b.title_id : b.title_en}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-body leading-relaxed">
                                {lang === "id" ? b.desc_id : b.desc_en}
                            </p>
                        </div>
                    ))}
                </div>

                <Link
                    to={`/${lang}/contact`}
                    className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--accent))] text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
                >
                    <Mail className="h-4 w-4" />
                    {t("Kirim Proposal", "Send Proposal")}
                </Link>
            </div>
        </div>
    );
}
