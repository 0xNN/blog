import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import StickyTOC from "@/components/StickyTOC";
import ReadingProgress from "@/components/ReadingProgress";
import CommentSection from "@/components/CommentSection";
import RelatedArticles from "@/components/RelatedArticles";
import AffiliateBox from "@/components/AffiliateBox";
import NewsletterForm from "@/components/NewsletterForm";
import AdSlot from "@/components/AdSlot";
import { Clock, Eye, ArrowLeft, Twitter, Linkedin, Facebook, Link as LinkIcon, Check } from "lucide-react";
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

    if (loading) return (
        <div className="mx-auto max-w-3xl px-4 py-14 space-y-4">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-3/4" />
            <div className="skeleton aspect-video w-full !mt-8" />
            <div className="skeleton h-4 w-full !mt-8" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
        </div>
    );
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
                    <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.1] mb-4" data-testid="article-title">
                        {content.title}
                    </h1>
                    {content.excerpt && (
                        <p className="font-body text-base lg:text-base text-muted-foreground leading-relaxed max-w-2xl">
                            {content.excerpt}
                        </p>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-4 mt-8 pb-6 border-b border-border">
                        <Link to={`/${lang}/author/${article.author_slug}`} className="flex items-center gap-3 group" data-testid="article-author-link">
                            {article.author_avatar ? (
                                <img src={article.author_avatar} alt={article.author_name} className="h-11 w-11 rounded-full object-cover ring-2 ring-border group-hover:ring-[hsl(var(--accent))] transition" />
                            ) : (
                                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center font-bold ring-2 ring-border group-hover:ring-[hsl(var(--accent))] transition">
                                    {article.author_name?.[0]}
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-sm group-hover:text-[hsl(var(--accent))] transition">{article.author_name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <Clock className="h-3 w-3" />{article.reading_time || 3} {t("menit baca", "min read")}
                                    <span className="text-border-strong">·</span>
                                    <Eye className="h-3 w-3" />{article.views} views
                                </div>
                            </div>
                        </Link>

                        <div className="flex items-center gap-1.5">
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(content.title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition" data-testid="share-twitter" aria-label="Share on Twitter">
                                <Twitter className="h-3.5 w-3.5" />
                            </a>
                            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition" data-testid="share-linkedin" aria-label="Share on LinkedIn">
                                <Linkedin className="h-3.5 w-3.5" />
                            </a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition" data-testid="share-facebook" aria-label="Share on Facebook">
                                <Facebook className="h-3.5 w-3.5" />
                            </a>
                            <a href={`https://wa.me/?text=${encodeURIComponent(content.title + ' ' + url)}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition" data-testid="share-whatsapp" aria-label="Share on WhatsApp">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                            <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(content.title)}`} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition" data-testid="share-telegram" aria-label="Share on Telegram">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                            </a>
                            <button onClick={shareCopy} data-testid="share-copy" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition" aria-label="Copy link">
                                {copied ? <Check className="h-3.5 w-3.5 text-[hsl(var(--accent))]" /> : <LinkIcon className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>
                </header>

                {article.cover_image && (
                    <div className="max-w-5xl mb-12 mx-auto">
                        <img src={article.cover_image} alt={content.title} className="w-full aspect-video object-cover rounded-2xl border border-border" />
                    </div>
                )}

                <div className="grid lg:grid-cols-[minmax(0,1fr)_14rem] gap-8 max-w-5xl mx-auto">
                    <div className="min-w-0 prose-article" data-article-body data-testid="article-body">
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
                    <AffiliateBox
                        category={article.category_slug}
                        articleId={article.id}
                        title={t("Rekomendasi Tools", "Recommended Tools")}
                    />
                </div>
            </article>
        </>
    );
}
