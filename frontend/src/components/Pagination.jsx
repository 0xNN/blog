import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

// Build a compact page list with ellipsis so we don't render hundreds of buttons
// when the catalog grows. Pattern: 1 … (page-1) page (page+1) … totalPages
function buildPageList(page, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2) pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
}

export default function Pagination({ page, totalPages, onPage }) {
    const { t } = useLang();
    if (totalPages <= 1) return null;

    const pages = buildPageList(page, totalPages);

    return (
        <nav
            aria-label={t("Navigasi halaman", "Page navigation")}
            className="flex items-center gap-1"
        >
            <button
                onClick={() => onPage(page - 1)}
                disabled={page <= 1}
                aria-label={t("Halaman sebelumnya", "Previous page")}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            {pages.map((p, i) =>
                p === "…" ? (
                    <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPage(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                            p === page
                                ? "bg-[hsl(var(--accent))] text-white"
                                : "hover:bg-muted text-muted-foreground"
                        }`}
                    >
                        {p}
                    </button>
                )
            )}
            <button
                onClick={() => onPage(page + 1)}
                disabled={page >= totalPages}
                aria-label={t("Halaman berikutnya", "Next page")}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </nav>
    );
}
