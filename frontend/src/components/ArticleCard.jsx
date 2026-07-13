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
            className={`group relative flex flex-col card-lift rounded-2xl border border-border bg-card overflow-hidden shadow-sm ${isLarge ? "md:grid md:grid-cols-2 md:items-stretch" : ""}`}
        >
            {article.cover_image && (
                <div className={`relative overflow-hidden ${isLarge ? "h-64 md:h-full" : "aspect-[16/9]"} bg-muted`}>
                    <img
                        src={article.cover_image}
                        alt={content.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="absolute top-3 left-3 rounded-full bg-black/65 backdrop-blur px-2.5 py-1 text-[10px] font-mono font-medium text-white uppercase tracking-[0.15em]">
                        {article.category_slug.replace(/-/g, " ")}
                    </span>
                </div>
            )}
            <div className={`flex flex-col flex-1 p-5 ${isLarge ? "md:p-8 md:justify-center" : ""}`}>
                <h3 className={`font-heading font-bold leading-[1.15] tracking-tight mb-2 transition-colors group-hover:text-[hsl(var(--accent))] ${isLarge ? "text-2xl sm:text-3xl md:text-4xl" : "text-lg"}`}>
                    {content.title}
                </h3>
                {content.excerpt && (
                    <p className={`text-muted-foreground font-body leading-relaxed ${isLarge ? "text-base mb-5 line-clamp-3" : "text-sm mb-4 line-clamp-2"}`}>
                        {content.excerpt}
                    </p>
                )}
                <div className="mt-auto flex items-center gap-2.5 text-xs text-muted-foreground pt-1">
                    <span className="font-semibold text-foreground truncate">{article.author_name}</span>
                    <span className="text-border-strong">·</span>
                    <span className="inline-flex items-center gap-1 font-mono"><Clock className="h-3 w-3" />{article.reading_time || 3}{t("m", "m")}</span>
                    <span className="text-border-strong">·</span>
                    <span className="inline-flex items-center gap-1 font-mono"><Eye className="h-3 w-3" />{(article.views || 0).toLocaleString()}</span>
                    <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground/50 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-[hsl(var(--accent))]" />
                </div>
            </div>
        </Link>
    );
}
