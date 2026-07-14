import { Link } from "react-router-dom";
import { Clock, Eye, ArrowUpRight } from "lucide-react";
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
            className={`group relative flex flex-col card-lift rounded-xl border border-border bg-card overflow-hidden ${isLarge ? "md:grid md:grid-cols-2 md:items-stretch" : ""}`}
        >
            {article.cover_image && (
                <div className={`relative overflow-hidden ${isLarge ? "h-64 md:h-full" : "aspect-[16/9]"} bg-muted`}>
                    <img
                        src={article.cover_image}
                        alt={content.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Category pill */}
                    <span className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-mono font-medium text-white/90 uppercase tracking-[0.12em]">
                        {article.category_slug.replace(/-/g, " ")}
                    </span>
                </div>
            )}
            <div className={`flex flex-col flex-1 p-4 ${isLarge ? "md:p-8 md:justify-center" : ""}`}>
                {article.category_slug && !article.cover_image && (
                    <span className="inline-block mb-2.5 text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-[hsl(var(--accent))]">
                        {article.category_slug.replace(/-/g, " ")}
                    </span>
                )}
                <h3 className={`font-heading font-bold leading-[1.2] tracking-tight mb-2 transition-colors group-hover:text-[hsl(var(--accent))] ${isLarge ? "text-2xl sm:text-3xl md:text-4xl" : "text-[0.95rem]"}`}>
                    {content.title}
                </h3>
                {content.excerpt && (
                    <p className={`text-muted-foreground font-body leading-relaxed ${isLarge ? "text-base mb-5 line-clamp-3" : "text-[0.8125rem] mb-3 line-clamp-2"}`}>
                        {content.excerpt}
                    </p>
                )}
                <div className="mt-auto flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border">
                    <span className="font-semibold text-foreground/80 truncate min-w-0">{article.author_name}</span>
                    <span className="text-border shrink-0">·</span>
                    <span className="inline-flex items-center gap-1 font-mono shrink-0">
                        <Clock className="h-3 w-3" />
                        {article.reading_time || 3}{t("m", "m")}
                    </span>
                    <span className="text-border shrink-0">·</span>
                    <span className="inline-flex items-center gap-1 font-mono shrink-0">
                        <Eye className="h-3 w-3" />
                        {(article.views || 0).toLocaleString()}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/40 -translate-x-0.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-[hsl(var(--accent))] shrink-0" />
                </div>
            </div>
        </Link>
    );
}
