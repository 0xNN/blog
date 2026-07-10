import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import ArticleCard from "@/components/ArticleCard";
import { Search } from "lucide-react";

export default function ArticleList() {
    const { lang, t } = useLang();
    const { category: categorySlug } = useParams();
    const [params, setParams] = useSearchParams();
    const q = params.get("q") || "";
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(q);

    useEffect(() => {
        setLoading(true);
        const query = new URLSearchParams({ lang, limit: "50" });
        if (categorySlug) query.set("category", categorySlug);
        if (q) query.set("q", q);
        api.get(`/articles?${query.toString()}`)
            .then((r) => setArticles(r.data))
            .finally(() => setLoading(false));
    }, [lang, categorySlug, q]);

    const submitSearch = (e) => {
        e.preventDefault();
        const p = new URLSearchParams(params);
        if (searchInput) p.set("q", searchInput); else p.delete("q");
        setParams(p);
    };

    const title = categorySlug
        ? categorySlug.replace(/-/g, " ").toUpperCase()
        : t("Semua Artikel", "All Articles");

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                        {categorySlug ? t("Kategori", "Category") : t("Blog", "Blog")}
                    </div>
                    <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight">
                        {title}
                    </h1>
                </div>
                <form onSubmit={submitSearch} className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={t("Cari artikel…", "Search articles…")}
                        data-testid="article-list-search"
                        className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))]"
                    />
                </form>
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">{t("Memuat…", "Loading…")}</div>
            ) : articles.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground font-body">
                    {t("Belum ada artikel di sini.", "No articles here yet.")}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
            )}
        </div>
    );
}
