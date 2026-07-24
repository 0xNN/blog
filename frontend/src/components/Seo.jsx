import { useEffect } from "react";

// Absolute origin of the SITE (frontend), used for canonical/OG/JSON-LD URLs.
// In prod this resolves to https://blog.msncode.dev automatically.
const SITE_URL = import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
const SITE_NAME = "MSNCode";

/**
 * Imperatively manages <head> tags for SEO.
 * We avoid react-helmet-async because it has issues with React 19 for meta/link/script children.
 */
function setHeadTags(tags) {
    // Remove tags injected for the previous route. Static tags from index.html
    // are updated in place and deliberately kept as a crawler-safe fallback.
    document.querySelectorAll('[data-seo="1"]').forEach((el) => el.remove());

    for (const t of tags) {
        if (!t) continue;
        if (t.tag === "meta" && (t.attrs?.name || t.attrs?.property)) {
            const key = t.attrs.name ? "name" : "property";
            const value = t.attrs[key];
            const existing = document.head.querySelector(`meta[${key}="${value}"]:not([data-seo])`);
            if (existing) {
                existing.setAttribute("content", t.attrs.content ?? "");
                continue;
            }
        }
        const el = document.createElement(t.tag);
        el.setAttribute("data-seo", "1");
        Object.entries(t.attrs || {}).forEach(([k, v]) => {
            if (v == null) return;
            el.setAttribute(k, String(v));
        });
        if (t.text != null) el.textContent = t.text;
        document.head.appendChild(el);
    }
}

function setTitle(title) {
    document.title = title;
}

function setHtmlLang(lang) {
    document.documentElement.lang = lang === "id" ? "id-ID" : "en-US";
}

export function ArticleSeo({ article, lang }) {
    useEffect(() => {
        if (!article) return;
        const content = article[`content_${lang}`] || article.content_id || article.content_en;
        if (!content) return;

        const url = `${SITE_URL}/${lang}/blog/${content.slug}`;
        const otherLang = lang === "id" ? "en" : "id";
        const other = article[`content_${otherLang}`];
        const title = `${content.title} · ${SITE_NAME}`;
        const description = content.meta_description || content.excerpt || "";
        const image = article.cover_image || "";

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": content.title,
            "description": description,
            "image": image ? [image] : undefined,
            "datePublished": article.published_at,
            "dateModified": article.updated_at,
            "author": {
                "@type": "Person",
                "name": article.author_name,
                "url": `${SITE_URL}/${lang}/author/${article.author_slug}`,
            },
            "publisher": { "@type": "Organization", "name": SITE_NAME },
            "mainEntityOfPage": { "@type": "WebPage", "@id": url },
            "inLanguage": lang === "id" ? "id-ID" : "en-US",
            "keywords": (article.tags || []).join(", "),
        };

        const breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": SITE_NAME, "item": `${SITE_URL}/${lang}` },
                { "@type": "ListItem", "position": 2, "name": article.category_slug.replace(/-/g, " "), "item": `${SITE_URL}/${lang}/category/${article.category_slug}` },
                { "@type": "ListItem", "position": 3, "name": content.title, "item": url },
            ],
        };

        setTitle(title);
        setHtmlLang(lang);
        setHeadTags([
            { tag: "meta", attrs: { name: "description", content: description } },
            { tag: "meta", attrs: { name: "robots", content: "index, follow, max-image-preview:large" } },
            { tag: "link", attrs: { rel: "canonical", href: url } },
            other?.slug && { tag: "link", attrs: { rel: "alternate", hreflang: otherLang, href: `${SITE_URL}/${otherLang}/blog/${other.slug}` } },
            { tag: "link", attrs: { rel: "alternate", hreflang: lang, href: url } },
            { tag: "link", attrs: { rel: "alternate", hreflang: "x-default", href: `${SITE_URL}/id/blog/${article.content_id?.slug || content.slug}` } },
            { tag: "meta", attrs: { property: "og:type", content: "article" } },
            { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
            { tag: "meta", attrs: { property: "og:title", content: content.title } },
            { tag: "meta", attrs: { property: "og:description", content: description } },
            { tag: "meta", attrs: { property: "og:url", content: url } },
            image && { tag: "meta", attrs: { property: "og:image", content: image } },
            { tag: "meta", attrs: { property: "og:locale", content: lang === "id" ? "id_ID" : "en_US" } },
            other?.slug && { tag: "meta", attrs: { property: "og:locale:alternate", content: otherLang === "id" ? "id_ID" : "en_US" } },
            article.published_at && { tag: "meta", attrs: { property: "article:published_time", content: article.published_at } },
            article.updated_at && { tag: "meta", attrs: { property: "article:modified_time", content: article.updated_at } },
            { tag: "meta", attrs: { property: "article:author", content: article.author_name } },
            { tag: "meta", attrs: { property: "article:section", content: article.category_slug } },
            ...(article.tags || []).map((tag) => ({ tag: "meta", attrs: { property: "article:tag", content: tag } })),
            { tag: "meta", attrs: { name: "twitter:card", content: image ? "summary_large_image" : "summary" } },
            { tag: "meta", attrs: { name: "twitter:title", content: content.title } },
            { tag: "meta", attrs: { name: "twitter:description", content: description } },
            image && { tag: "meta", attrs: { name: "twitter:image", content: image } },
            { tag: "script", attrs: { type: "application/ld+json" }, text: JSON.stringify(jsonLd) },
            { tag: "script", attrs: { type: "application/ld+json" }, text: JSON.stringify(breadcrumb) },
        ]);

        return () => {
            document.querySelectorAll('[data-seo="1"]').forEach((el) => el.remove());
        };
    }, [article, lang]);

    return null;
}

export function PageSeo({ title, description, path, lang, noIndex = false }) {
    useEffect(() => {
        const url = `${SITE_URL}${path || `/${lang}`}`;
        const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
        const otherLang = lang === "id" ? "en" : "id";
        const localizedPath = (path || `/${lang}`).replace(/^\/(id|en)(?=\/|$)/, `/${otherLang}`);
        const defaultPath = (path || `/${lang}`).replace(/^\/(id|en)(?=\/|$)/, "/id");
        setTitle(fullTitle);
        setHtmlLang(lang);
        setHeadTags([
            { tag: "meta", attrs: { name: "description", content: description || "" } },
            { tag: "meta", attrs: { name: "robots", content: noIndex ? "noindex, follow" : "index, follow, max-image-preview:large" } },
            { tag: "link", attrs: { rel: "canonical", href: url } },
            !noIndex && { tag: "link", attrs: { rel: "alternate", hreflang: lang, href: url } },
            !noIndex && { tag: "link", attrs: { rel: "alternate", hreflang: otherLang, href: `${SITE_URL}${localizedPath}` } },
            !noIndex && { tag: "link", attrs: { rel: "alternate", hreflang: "x-default", href: `${SITE_URL}${defaultPath}` } },
            { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
            { tag: "meta", attrs: { property: "og:type", content: "website" } },
            { tag: "meta", attrs: { property: "og:title", content: fullTitle } },
            { tag: "meta", attrs: { property: "og:description", content: description || "" } },
            { tag: "meta", attrs: { property: "og:url", content: url } },
            { tag: "meta", attrs: { name: "twitter:card", content: "summary" } },
        ]);
        return () => document.querySelectorAll('[data-seo="1"]').forEach((el) => el.remove());
    }, [title, description, path, lang, noIndex]);

    return null;
}

export function AuthorSeo({ author, lang }) {
    useEffect(() => {
        if (!author) return;
        const url = `${SITE_URL}/${lang}/author/${author.slug}`;
        const description = author.bio || `${author.name} on ${SITE_NAME}`;
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": author.name,
            "description": description,
            "url": url,
            "image": author.avatar_url || undefined,
            "sameAs": [
                author.twitter ? `https://twitter.com/${author.twitter}` : null,
                author.github ? `https://github.com/${author.github}` : null,
                author.website || null,
            ].filter(Boolean),
        };
        setTitle(`${author.name} · ${SITE_NAME}`);
        setHtmlLang(lang);
        setHeadTags([
            { tag: "meta", attrs: { name: "description", content: description } },
            { tag: "meta", attrs: { name: "robots", content: "index, follow, max-image-preview:large" } },
            { tag: "link", attrs: { rel: "canonical", href: url } },
            { tag: "meta", attrs: { property: "og:type", content: "profile" } },
            { tag: "meta", attrs: { property: "og:title", content: author.name } },
            { tag: "meta", attrs: { property: "og:description", content: description } },
            author.avatar_url && { tag: "meta", attrs: { property: "og:image", content: author.avatar_url } },
            { tag: "script", attrs: { type: "application/ld+json" }, text: JSON.stringify(jsonLd) },
        ]);
        return () => document.querySelectorAll('[data-seo="1"]').forEach((el) => el.remove());
    }, [author, lang]);

    return null;
}
