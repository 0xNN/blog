import { Link } from "react-router-dom";
import { Clock, Eye } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function ArticleCard({ article, variant = "default" }) {
    const { lang, t } = useLang();
    const content = article[`content_${lang}`] || article.content_id || article.content_en;
    if (!content) return null;

    const isLarge = variant === "hero";

    return (
        <Link
            to={`/${lang}/blog/${content.slug}`}
            data-testid={`article-card-${content.slug}`}
            className={`group block card-lift rounded-2xl border border-border bg-card overflow-hidden ${isLarge ? "md:grid md:grid-cols-2" : ""}`}
        >
            {article.cover_image && (
                <div className={`relative overflow-hidden ${isLarge ? "h-64 md:h-full" : "aspect-[16/9]"} bg-muted`}>
                    <img
                        src={article.cover_image}
                        alt={content.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white uppercase tracking-wider">
                        {article.category_slug.replace("-", " ")}
                    </span>
                </div>
            )}
            <div className={`p-5 ${isLarge ? "md:p-8 flex flex-col justify-center" : ""}`}>
                <h3 className={`font-heading font-bold leading-tight tracking-tight mb-2 group-hover:text-[hsl(var(--accent))] transition-colors ${isLarge ? "text-2xl sm:text-3xl md:text-4xl" : "text-lg"}`}>
                    {content.title}
                </h3>
                {content.excerpt && (
                    <p className={`text-muted-foreground font-body leading-relaxed ${isLarge ? "text-base mb-4 line-clamp-3" : "text-sm mb-3 line-clamp-2"}`}>
                        {content.excerpt}
                    </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="font-semibold text-foreground">{article.author_name}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{article.reading_time || 3} {t("mnt", "min")}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{article.views || 0}</span>
                </div>
            </div>
        </Link>
    );
}
