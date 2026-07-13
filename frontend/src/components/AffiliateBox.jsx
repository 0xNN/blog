import { useEffect, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { getAffiliateLinks, affiliateHref } from "@/lib/api";
import { ExternalLink, ShieldAlert } from "lucide-react";

export default function AffiliateBox({ category, articleId, title }) {
    const { lang, t } = useLang();
    const [links, setLinks] = useState([]);

    useEffect(() => {
        getAffiliateLinks(category)
            .then((data) => setLinks(Array.isArray(data) ? data : []))
            .catch(() => setLinks([]));
    }, [category]);

    if (!links.length) return null;

    return (
        <section
            data-testid="affiliate-box"
            className="my-10 rounded-2xl border border-border bg-card p-6"
        >
            {title && (
                <div className="font-heading font-bold text-lg mb-4">{title}</div>
            )}
            <ul className="grid sm:grid-cols-2 gap-3">
                {links.map((l) => (
                    <li key={l.id}>
                        <a
                            href={affiliateHref(l.id, articleId)}
                            target="_blank"
                            rel="sponsored nofollow noopener"
                            data-testid={`affiliate-${l.id}`}
                            className="group flex items-center gap-3 rounded-xl border border-border p-3 h-full hover:border-[hsl(var(--accent))] transition-colors"
                        >
                            {l.image_url ? (
                                <img
                                    src={l.image_url}
                                    alt={l.name}
                                    className="h-12 w-12 rounded-lg object-cover shrink-0"
                                />
                            ) : (
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center font-bold shrink-0">
                                    {(l.merchant || l.name)?.[0]}
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="font-semibold text-sm leading-snug group-hover:text-[hsl(var(--accent))]">
                                    {l.name}
                                </div>
                                {l.description && (
                                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {l.description}
                                    </div>
                                )}
                                {l.merchant && (
                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-1 font-mono">
                                        {l.merchant}
                                    </div>
                                )}
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                        </a>
                    </li>
                ))}
            </ul>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                <ShieldAlert className="h-3 w-3" />
                {t(
                    "Artikel ini memuat link afiliasi. Kami mungkin mendapat komisi jika Anda membeli lewat link tersebut, tanpa biaya tambahan bagi Anda.",
                    "This article contains affiliate links. We may earn a commission if you buy via these links, at no extra cost to you."
                )}
            </div>
        </section>
    );
}
