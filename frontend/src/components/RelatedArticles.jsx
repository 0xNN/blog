import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowRight } from "lucide-react";

export default function RelatedArticles({ articleId }) {
    const { lang, t } = useLang();
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!articleId) return;
        api.get(`/articles/${articleId}/related?lang=${lang}&limit=3`)
            .then((r) => setItems(r.data))
            .catch(() => setItems([]));
    }, [articleId, lang]);

    if (!items.length) return null;

    return (
        <section data-testid="related-articles" className="mt-14 pt-12 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
                <ArrowRight className="h-4 w-4 text-[hsl(var(--accent))]" />
                <h2 className="font-heading text-sm font-bold uppercase tracking-widest">
                    {t("Bacaan Selanjutnya", "Keep Reading")}
                </h2>
            </div>
            <ul className="grid sm:grid-cols-3 gap-4">
                {items.map((a) => {
                    const c = a[`content_${lang}`] || a.content_id || a.content_en;
                    if (!c) return null;
                    return (
                        <li key={a.id}>
                            <Link
                                to={`/${lang}/blog/${c.slug}`}
                                data-testid={`related-${c.slug}`}
                                className="group block card-lift rounded-xl border border-border p-4 h-full bg-card"
                            >
                                <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--accent))] font-mono mb-2">
                                    {a.category_slug.replace(/-/g, " ")}
                                </div>
                                <h3 className="font-heading font-bold text-base leading-snug group-hover:text-[hsl(var(--accent))] transition-colors line-clamp-3">
                                    {c.title}
                                </h3>
                                <div className="text-xs text-muted-foreground mt-2 font-body">
                                    {a.author_name} · {a.reading_time || 3} {t("mnt", "min")}
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
