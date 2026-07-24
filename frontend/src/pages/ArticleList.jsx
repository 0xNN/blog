import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import ArticleCard from "@/components/ArticleCard";
import ArticleCardSkeleton from "@/components/ArticleCardSkeleton";
import Pagination from "@/components/Pagination";
import { PageSeo } from "@/components/Seo";
import { Search } from "lucide-react";

// How many articles per page. Lower = faster initial render + less data transfer.
// Keep this in sync with the backend default cap (`limit` max is 100).
const PAGE_SIZE = 9;

export default function ArticleList() {
    const { lang, t } = useLang();
    const { category: categorySlug } = useParams();
    const [params, setParams] = useSearchParams();
    const q = params.get("q") || "";
    // Page is 1-indexed. Invalid/non-numeric falls back to 1.
    const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);

    const [articles, setArticles] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(q);

    useEffect(() => {
        setLoading(true);
        const query = new URLSearchParams({
            lang,
            limit: String(PAGE_SIZE),
            page: String(page),
            paginated: "true",
        });
        if (categorySlug) query.set("category", categorySlug);
        if (q) query.set("q", q);
        api.get(`/articles?${query.toString()}`)
            .then((r) => {
                const res = r.data;
                // Defensive: handle both new structured response and legacy bare array.
                if (Array.isArray(res)) {
                    setArticles(res);
                    setPagination({ total: res.length, totalPages: 1, hasNext: false, hasPrev: false });
                } else {
                    setArticles(res.data || []);
                    setPagination(res.pagination || { total: 0, totalPages: 1, hasNext: false, hasPrev: false });
                }
            })
            .finally(() => setLoading(false));
    }, [lang, categorySlug, q, page]);

    const submitSearch = (e) => {
        e.preventDefault();
        const p = new URLSearchParams(params);
        if (searchInput) p.set("q", searchInput); else p.delete("q");
        // Reset to page 1 on new search — old page number may not exist for new filter.
        p.delete("page");
        setParams(p);
    };

    const handlePage = (newPage) => {
        const p = new URLSearchParams(params);
        if (newPage > 1) p.set("page", String(newPage)); else p.delete("page");
        setParams(p);
        // Scroll to top so the user sees fresh articles, not mid-list.
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const title = categorySlug
        ? categorySlug.replace(/-/g, " ").toUpperCase()
        : t("Semua Artikel", "All Articles");
    const seoPath = categorySlug
        ? `/${lang}/category/${categorySlug}`
        : `/${lang}/blog`;
    const seoDescription = categorySlug
        ? t(
            `Artikel MSNCode tentang ${categorySlug.replace(/-/g, " ")}: tutorial praktis, penjelasan teknis, dan pengalaman nyata developer.`,
            `MSNCode articles about ${categorySlug.replace(/-/g, " ")}: practical tutorials, technical explanations, and real developer experience.`
        )
        : t(
            "Kumpulan tutorial coding, solusi error, AI, keamanan, karier, dan catatan membangun produk dari pengalaman developer Indonesia.",
            "Coding tutorials, error fixes, AI, security, career notes, and product-building lessons from an Indonesian developer."
        );

    const showing = articles.length;
    const from = showing === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = (page - 1) * PAGE_SIZE + showing;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <PageSeo
                lang={lang}
                path={seoPath}
                title={q ? t(`Hasil pencarian: ${q}`, `Search results: ${q}`) : title}
                description={seoDescription}
                noIndex={Boolean(q) || page > 1}
            />
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => <ArticleCardSkeleton key={i} />)}
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground font-body">
                    {t("Belum ada artikel di sini.", "No articles here yet.")}
                </div>
            ) : (
                <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                    <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-5">
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
                </>
            )}
        </div>
    );
}
