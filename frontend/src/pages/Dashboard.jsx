import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { PenSquare, Trash2, Eye, LogOut, Sparkles, Users, FileText, Search, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import AdminPanel from "@/components/AdminPanel";

// How many rows per page in the Dashboard table.
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
    const [params, setParams] = useSearchParams();

    // Page is 1-indexed and lives in the URL so refresh/back works.
    const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
    // Search input is local state; committed to URL on submit (debounce-free,
    // explicit submit keeps the API predictable).
    const [searchInput, setSearchInput] = useState(params.get("q") || "");

    const [articles, setArticles] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
    const [analytics, setAnalytics] = useState(null);
    const [artLoading, setArtLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) nav(`/${lang}/login`);
    }, [user, authLoading, lang, nav]);

    useEffect(() => {
        if (!user) return;
        setArtLoading(true);

        // Dashboard lists both draft + published in one paginated query.
        // Authors see only their own articles; owners/editors see all.
        const query = new URLSearchParams({
            lang,
            limit: String(PER_PAGE),
            page: String(page),
            paginated: "true",
            status: "draft,published",
        });
        if (profile?.role === "author") query.set("author_id", user.id);
        const q = params.get("q");
        if (q) query.set("q", q);

        api.get(`/articles?${query.toString()}`)
            .then((r) => {
                const res = r.data;
                if (Array.isArray(res)) {
                    // Legacy fallback (shouldn't happen with paginated=true, but be safe).
                    setArticles(res);
                    setPagination({ total: res.length, totalPages: 1, hasNext: false, hasPrev: false });
                } else {
                    setArticles(res.data || []);
                    setPagination(res.pagination || { total: 0, totalPages: 1, hasNext: false, hasPrev: false });
                }
            })
            .catch(() => {})
            .finally(() => setArtLoading(false));

        if (profile?.role === "owner" || profile?.role === "editor") {
            api.get("/analytics/summary").then((r) => setAnalytics(r.data)).catch(() => {});
        }
    }, [user, profile, lang, page, params]);

    const del = async (id) => {
        if (!confirm(t("Hapus artikel ini?", "Delete this article?"))) return;
        try {
            await api.delete(`/articles/${id}`);
            // Remove locally + adjust pagination metadata. If we just deleted the
            // last row on page N, navigate back to page N-1 so we don't show an
            // empty page.
            setArticles((prev) => {
                const next = prev.filter((a) => a.id !== id);
                if (next.length === 0 && page > 1) {
                    const p = new URLSearchParams(params);
                    p.set("page", String(page - 1));
                    setParams(p);
                } else {
                    setPagination((pg) => ({ ...pg, total: Math.max(0, pg.total - 1) }));
                }
                return next;
            });
        } catch (e) {
            console.error(e);
        }
    };

    const submitSearch = (e) => {
        e.preventDefault();
        const p = new URLSearchParams(params);
        if (searchInput) p.set("q", searchInput); else p.delete("q");
        p.delete("page"); // New filter = start from page 1.
        setParams(p);
    };

    const clearSearch = () => {
        setSearchInput("");
        const p = new URLSearchParams(params);
        p.delete("q");
        p.delete("page");
        setParams(p);
    };

    const handlePage = (newPage) => {
        const p = new URLSearchParams(params);
        if (newPage > 1) p.set("page", String(newPage)); else p.delete("page");
        setParams(p);
    };

    if (!user || user === false) return null;

    const showing = articles.length;
    const from = showing === 0 ? 0 : (page - 1) * PER_PAGE + 1;
    const to = (page - 1) * PER_PAGE + showing;

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
                    <form onSubmit={submitSearch} className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={t("Cari artikel...", "Search articles...")}
                            data-testid="dashboard-article-search"
                            className="w-full pl-8 pr-8 py-1.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))] transition"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                aria-label={t("Hapus pencarian", "Clear search")}
                            >
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </form>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">{pagination.total}</span>
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
                    ) : articles.length > 0 ? (
                        articles.map((a) => {
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
                {!artLoading && pagination.total > 0 && (
                    <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground font-mono">
                            {t(
                                `Menampilkan ${from}–${to} dari ${pagination.total} artikel`,
                                `Showing ${from}–${to} of ${pagination.total} articles`
                            )}
                        </div>
                        <Pagination
                            page={page}
                            totalPages={pagination.totalPages}
                            onPage={handlePage}
                        />
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
