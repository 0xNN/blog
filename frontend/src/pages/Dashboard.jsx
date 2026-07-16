import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { PenSquare, Trash2, Eye, LogOut, Sparkles, Users, FileText, Search, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import AdminPanel from "@/components/AdminPanel";

const PER_PAGE = 10;

function SkeletonRow() {
    return (
        <li className="flex items-center gap-4 px-5 py-4 border-b border-border animate-pulse">
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="h-8 w-8 bg-muted rounded-full" />
            <div className="h-8 w-8 bg-muted rounded-full" />
        </li>
    );
}

export default function Dashboard() {
    const { user, profile, logout, loading: authLoading } = useAuth();
    const { lang, t } = useLang();
    const nav = useNavigate();
    const [articles, setArticles] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [artLoading, setArtLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!authLoading && !user) nav(`/${lang}/login`);
    }, [user, authLoading, lang, nav]);

    useEffect(() => {
        if (!user) return;
        setArtLoading(true);
        Promise.all([
            api.get(`/articles?status=draft&limit=100`),
            api.get(`/articles?status=published&limit=100`),
        ])
        .then(([drafts, published]) => {
            const all = [...drafts.data, ...published.data];
            const mine = profile?.role === "author" ? all.filter((a) => a.author_id === user.id) : all;
            setArticles(mine);
        })
        .catch(() => {})
        .finally(() => setArtLoading(false));

        if (profile?.role === "owner" || profile?.role === "editor") {
            api.get("/analytics/summary").then((r) => setAnalytics(r.data)).catch(() => {});
        }
    }, [user, profile]);

    const del = async (id) => {
        if (!confirm(t("Hapus artikel ini?", "Delete this article?"))) return;
        try {
            await api.delete(`/articles/${id}`);
            setArticles((prev) => prev.filter((a) => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = articles.filter(a => {
        if (!search) return true;
        const q = search.toLowerCase();
        const c = a.content_id || a.content_en;
        return (c?.title || "").toLowerCase().includes(q)
            || (a.category_slug || "").includes(q)
            || (a.status || "").includes(q);
    });
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    if (!user || user === false) return null;

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
                <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">Dashboard · {profile?.role || "…"}</div>
                    <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight">
                        {(() => {
                            const nm = (profile?.name || user?.email || "").split(" ")[0];
                            return t(`Halo, ${nm}`, `Hi, ${nm}`);
                        })()}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Link to={`/${lang}/editor/new`} className="rounded-full bg-[hsl(var(--accent))] text-white px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2" data-testid="dashboard-new-article">
                        <PenSquare className="h-4 w-4" /> {t("Artikel baru", "New article")}
                    </Link>
                    <button onClick={logout} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 hover:border-destructive" data-testid="dashboard-logout">
                        <LogOut className="h-4 w-4" /> Logout
                    </button>
                </div>
            </header>

            {analytics ? (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <StatCard label={t("Total artikel", "Total articles")} value={analytics.total_articles} icon={<FileText className="h-4 w-4" />} />
                    <StatCard label={t("Terpublikasi", "Published")} value={analytics.published} icon={<Sparkles className="h-4 w-4" />} />
                    <StatCard label={t("Total views", "Total views")} value={analytics.total_views} icon={<Eye className="h-4 w-4" />} />
                    <StatCard label={t("Subscriber", "Subscribers")} value={analytics.total_subscribers} icon={<Users className="h-4 w-4" />} />
                </section>
            ) : (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="rounded-2xl border border-border p-5 bg-card animate-pulse">
                            <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                            <div className="h-8 bg-muted rounded w-1/3" />
                        </div>
                    ))}
                </section>
            )}

            <section className="rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
                    <h2 className="font-heading text-lg font-bold tracking-tight shrink-0">{t("Artikel kamu", "Your articles")}</h2>
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder={t("Cari artikel...", "Search articles...")}
                            className="w-full pl-8 pr-8 py-1.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))] transition" />
                        {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">{filtered.length}</span>
                </div>
                <ul>
                    {artLoading ? (
                        <>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </>
                    ) : paginated.length > 0 ? (
                        paginated.map((a) => {
                            const c = a.content_id || a.content_en;
                            return (
                                <li key={a.id} data-testid={`dashboard-article-${a.id}`} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/30">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{c?.title || "(untitled)"}</div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${a.status === "published" ? "bg-green-500" : "bg-yellow-500"}`} />
                                            {a.status} · {a.views} views · {a.category_slug}
                                        </div>
                                    </div>
                                    <Link to={`/${lang}/editor/${a.id}`} className="p-2 rounded-full hover:bg-muted" title="Edit" data-testid={`edit-article-${a.id}`}>
                                        <PenSquare className="h-4 w-4" />
                                    </Link>
                                    {c?.slug && a.status === "published" && (
                                        <Link to={`/${lang}/blog/${c.slug}`} className="p-2 rounded-full hover:bg-muted" title="View">
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    )}
                                    <button onClick={() => del(a.id)} className="p-2 rounded-full hover:bg-destructive/10 hover:text-destructive" title="Delete" data-testid={`delete-article-${a.id}`}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </li>
                            );
                        })
                    ) : (
                        <li className="px-5 py-12 text-center text-sm text-muted-foreground font-body">
                            {t("Belum ada artikel. Yuk tulis yang pertama!", "No articles yet. Write your first one!")}
                        </li>
                    )}
                </ul>
                {!artLoading && articles.length > PER_PAGE && (
                    <div className="px-5 border-t border-border">
                        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
                    </div>
                )}
            </section>

            {(profile?.role === "owner" || profile?.role === "editor") && <AdminPanel />}
        </div>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <div className="rounded-2xl border border-border p-5 bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                {icon} {label}
            </div>
            <div className="font-heading text-3xl font-black mt-3 tracking-tight">{value?.toLocaleString?.() ?? value}</div>
        </div>
    );
}
