import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import ArticleCard from "@/components/ArticleCard";
import { Twitter, Github, Globe } from "lucide-react";

export default function AuthorPage() {
    const { slug } = useParams();
    const { lang, t } = useLang();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/authors/${slug}`)
            .then((r) => setData(r.data))
            .catch(() => setData({ author: null, articles: [] }))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <div className="text-center py-20 text-muted-foreground">{t("Memuat…", "Loading…")}</div>;
    if (!data?.author) return <div className="text-center py-20">{t("Penulis tidak ditemukan", "Author not found")}</div>;

    const a = data.author;
    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <header className="flex flex-col sm:flex-row gap-6 items-start mb-10 pb-10 border-b border-border">
                {a.avatar_url ? (
                    <img src={a.avatar_url} alt={a.name} className="h-24 w-24 rounded-full object-cover" />
                ) : (
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center font-bold text-3xl">
                        {a.name[0]}
                    </div>
                )}
                <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">{a.role}</div>
                    <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight mb-2">{a.name}</h1>
                    {a.bio && <p className="font-body text-muted-foreground leading-relaxed">{a.bio}</p>}
                    <div className="flex gap-3 mt-4">
                        {a.twitter && <a href={`https://twitter.com/${a.twitter}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]"><Twitter className="h-3.5 w-3.5" /></a>}
                        {a.github && <a href={`https://github.com/${a.github}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]"><Github className="h-3.5 w-3.5" /></a>}
                        {a.website && <a href={a.website} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]"><Globe className="h-3.5 w-3.5" /></a>}
                    </div>
                </div>
            </header>

            <h2 className="font-heading text-xl font-bold uppercase tracking-widest text-muted-foreground mb-6">
                {t("Artikel oleh", "Articles by")} {a.name.split(" ")[0]}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
                {data.articles.map((art) => <ArticleCard key={art.id} article={art} />)}
                {data.articles.length === 0 && (
                    <div className="text-muted-foreground">{t("Belum ada artikel.", "No articles yet.")}</div>
                )}
            </div>
        </div>
    );
}
