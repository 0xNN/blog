import { useEffect, useMemo, useState } from "react";
import slugify from "slugify";

function extractHeadings(md) {
    if (!md) return [];
    const lines = md.split("\n");
    const headings = [];
    for (const line of lines) {
        const m = /^(##|###)\s+(.+)/.exec(line);
        if (m) {
            headings.push({
                level: m[1].length,
                text: m[2].trim(),
                id: slugify(m[2].trim(), { lower: true, strict: true }),
            });
        }
    }
    return headings;
}

export default function StickyTOC({ content }) {
    const headings = useMemo(() => extractHeadings(content), [content]);
    const [active, setActive] = useState("");

    useEffect(() => {
        // add ids to headings in the DOM after markdown renders
        const article = document.querySelector("[data-article-body]");
        if (!article) return;
        const hs = article.querySelectorAll("h2, h3");
        hs.forEach((h) => {
            if (!h.id) h.id = slugify(h.textContent || "", { lower: true, strict: true });
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: "-30% 0px -60% 0px" }
        );
        hs.forEach((h) => observer.observe(h));
        return () => observer.disconnect();
    }, [content]);

    if (headings.length < 2) return null;

    return (
        <nav
            data-testid="sticky-toc"
            className="hidden xl:block sticky top-24 self-start w-56 text-sm"
            aria-label="Table of contents"
        >
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                On this page
            </div>
            <ul className="space-y-2 border-l border-border pl-4">
                {headings.map((h) => (
                    <li key={h.id} className={h.level === 3 ? "ml-3" : ""}>
                        <a
                            href={`#${h.id}`}
                            data-testid={`toc-link-${h.id}`}
                            className={`font-mono text-xs leading-relaxed hover:text-foreground transition-colors ${
                                active === h.id ? "text-[hsl(var(--accent))]" : "text-muted-foreground"
                            }`}
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
