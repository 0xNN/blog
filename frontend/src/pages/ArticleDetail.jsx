import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import StickyTOC from "@/components/StickyTOC";
import ReadingProgress from "@/components/ReadingProgress";
import CommentSection from "@/components/CommentSection";
import RelatedArticles from "@/components/RelatedArticles";
import NewsletterForm from "@/components/NewsletterForm";
import AdSlot from "@/components/AdSlot";
import { Clock, Eye, ArrowLeft, Twitter, Linkedin, Link as LinkIcon, Check } from "lucide-react";
import { ArticleSeo } from "@/components/Seo";

export default function ArticleDetail() {
    const { slug } = useParams();
    const { lang, setLang, t } = useLang();
    const nav = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        api.get(`/articles/${slug}?lang=${lang}`)
            .then((r) => setArticle(r.data))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug, lang]);

    useEffect(() => {
        // scroll to top on nav
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [slug]);

    if (loading) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">{t("Memuat…", "Loading…")}</div>;
    if (notFound || !article) return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
            <h1 className="font-heading text-3xl font-bold mb-4">{t("Artikel tidak ditemukan", "Article not found")}</h1>
            <Link to={`/${lang}`} className="text-[hsl(var(--accent))] underline">{t("Kembali ke beranda", "Back to home")}</Link>
        </div>
    );

    const content = article[`content_${lang}`] || article.content_id || article.content_en;
    const otherLang = lang === "id" ? "en" : "id";
    const otherContent = article[`content_${otherLang}`];
    const hasOther = otherContent && otherContent.slug;

    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    const switchLang = () => {
        if (!hasOther) return;
        setLang(otherLang);
        nav(`/${otherLang}/blog/${otherContent.slug}`);
    };

    // insert ad after 3rd paragraph (roughly)
    const paragraphs = (content.body_md || "").split(/\n\n+/);
    const midpoint = Math.min(3, Math.floor(paragraphs.length / 2));
    const beforeAd = paragraphs.slice(0, midpoint).join("\n\n");
    const afterAd = paragraphs.slice(midpoint).join("\n\n");

    return (
        <>
            <ArticleSeo article={article} lang={lang} />
            <ReadingProgress />

            <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
                <Link to={`/${lang}/blog`} className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8" data-testid="article-back">
                    <ArrowLeft className="h-3.5 w-3.5" /> {t("Semua artikel", "All articles")}
                </Link>

                <header className="max-w-3xl mb-10">
                    <div className="flex flex-wrap items-center gap-3 text-xs mb-5">
                        <Link
                            to={`/${lang}/category/${article.category_slug}`}
                            className="rounded-full bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] px-3 py-1 font-semibold uppercase tracking-wider hover:bg-[hsl(var(--accent))]/20"
                            data-testid="article-category-badge"
                        >
                            {article.category_slug.replace(/-/g, " ")}
                        </Link>
                        {hasOther && (
                            <button
                                onClick={switchLang}
                                data-testid="article-lang-switch"
                                className="rounded-full border border-border px-3 py-1 font-mono hover:border-[hsl(var(--accent))]"
                            >
                                {t(`Read in English →`, `Baca dalam Bahasa Indonesia →`)}
                            </button>
                        )}
                    </div>
                    <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6" data-testid="article-title">
                        {content.title}
                    </h1>
                    {content.excerpt && (
                        <p className="font-body text-lg lg:text-xl text-muted-foreground leading-relaxed">
                            {content.excerpt}
                        </p>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-4 mt-8 pb-6 border-b border-border">
                        <Link to={`/${lang}/author/${article.author_slug}`} className="flex items-center gap-3 group" data-testid="article-author-link">
                            {article.author_avatar ? (
                                <img src={article.author_avatar} alt={article.author_name} className="h-11 w-11 rounded-full object-cover" />
                            ) : (
                                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center font-bold">
                                    {article.author_name?.[0]}
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-sm group-hover:text-[hsl(var(--accent))]">{article.author_name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <Clock className="h-3 w-3" />{article.reading_time || 3} {t("menit baca", "min read")}
                                    <span>·</span>
                                    <Eye className="h-3 w-3" />{article.views} views
                                </div>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2">
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(content.title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]" data-testid="share-twitter" aria-label="Share on Twitter">
                                <Twitter className="h-3.5 w-3.5" />
                            </a>
                            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]" data-testid="share-linkedin" aria-label="Share on LinkedIn">
                                <Linkedin className="h-3.5 w-3.5" />
                            </a>
                            <button onClick={shareCopy} data-testid="share-copy" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]" aria-label="Copy link">
                                {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>
                </header>

                {article.cover_image && (
                    <div className="max-w-5xl mb-12 mx-auto">
                        <img src={article.cover_image} alt={content.title} className="w-full aspect-video object-cover rounded-2xl border border-border" />
                    </div>
                )}

                <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 max-w-6xl mx-auto">
                    <div className="max-w-3xl min-w-0" data-article-body data-testid="article-body">
                        <MarkdownRenderer content={beforeAd} />
                        <AdSlot position="in-article" enabled={article.ads_enabled} />
                        <MarkdownRenderer content={afterAd} />

                        <div className="mt-14 rounded-2xl border border-border bg-card p-6">
                            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                {t("Newsletter", "Newsletter")}
                            </div>
                            <div className="font-heading font-bold text-xl mb-3">
                                {t("Suka artikel ini? Dapatkan yang berikutnya di inbox.", "Enjoyed this? Get the next one in your inbox.")}
                            </div>
                            <NewsletterForm />
                        </div>

                        <div className="mt-10 flex flex-wrap gap-2">
                            {article.tags?.map((tag) => (
                                <Link
                                    key={tag}
                                    to={`/${lang}/blog?q=${encodeURIComponent(tag)}`}
                                    className="text-xs font-mono px-2.5 py-1 rounded-full border border-border hover:border-[hsl(var(--accent))]"
                                    data-testid={`article-tag-${tag}`}
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>

                        <CommentSection articleId={article.id} />
                    </div>

                    <StickyTOC content={content.body_md} />
                </div>

                <div className="max-w-3xl">
                    <RelatedArticles articleId={article.id} />
                </div>
            </article>
        </>
    );
}
