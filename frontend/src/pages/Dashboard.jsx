import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { PenSquare, Trash2, Eye, LogOut, Sparkles, Users, FileText } from "lucide-react";
import AdminPanel from "@/components/AdminPanel";

export default function Dashboard() {
    const { user, logout, loading } = useAuth();
    const { lang, t } = useLang();
    const nav = useNavigate();
    const [articles, setArticles] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        if (!loading && !user) nav(`/${lang}/login`);
    }, [user, loading, lang, nav]);

    useEffect(() => {
        if (!user) return;
        api.get(`/articles?status=draft&limit=100`).then((r) => {
            api.get(`/articles?status=published&limit=100`).then((r2) => {
                const all = [...r.data, ...r2.data];
                const mine = user.role === "author" ? all.filter((a) => a.author_id === user.id) : all;
                setArticles(mine);
            });
        });
        if (user.role === "owner" || user.role === "editor") {
            api.get("/analytics/summary").then((r) => setAnalytics(r.data)).catch(() => {});
        }
    }, [user]);

    const del = async (id) => {
        if (!confirm(t("Hapus artikel ini?", "Delete this article?"))) return;
        try {
            await api.delete(`/articles/${id}`);
            setArticles((prev) => prev.filter((a) => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    if (!user || user === false) return null;

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
                <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">Dashboard · {user.role}</div>
                    <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight">
                        {t(`Halo, ${user.name.split(" ")[0]}`, `Hi, ${user.name.split(" ")[0]}`)}
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

            {analytics && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <StatCard label={t("Total artikel", "Total articles")} value={analytics.total_articles} icon={<FileText className="h-4 w-4" />} />
                    <StatCard label={t("Terpublikasi", "Published")} value={analytics.published} icon={<Sparkles className="h-4 w-4" />} />
                    <StatCard label={t("Total views", "Total views")} value={analytics.total_views} icon={<Eye className="h-4 w-4" />} />
                    <StatCard label={t("Subscriber", "Subscribers")} value={analytics.total_subscribers} icon={<Users className="h-4 w-4" />} />
                </section>
            )}

            <section className="rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-heading text-lg font-bold tracking-tight">{t("Artikel kamu", "Your articles")}</h2>
                    <span className="text-xs text-muted-foreground font-mono">{articles.length}</span>
                </div>
                <ul>
                    {articles.map((a) => {
                        const c = a.content_id || a.content_en;
                        return (
                            <li key={a.id} data-testid={`dashboard-article-${a.id}`} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/30">
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{c?.title || "(untitled)"}</div>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${a.status === "published" ? "bg-green-500" : "bg-yellow-500"}`}></span>
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
                    })}
                    {articles.length === 0 && (
                        <li className="px-5 py-12 text-center text-sm text-muted-foreground font-body">
                            {t("Belum ada artikel. Yuk tulis yang pertama!", "No articles yet. Write your first one!")}
                        </li>
                    )}
                </ul>
            </section>

            {(user.role === "owner" || user.role === "editor") && <AdminPanel />}
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
