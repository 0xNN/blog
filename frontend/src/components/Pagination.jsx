import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPage }) {
    if (totalPages <= 1) return null;

    const pages = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="flex items-center justify-between pt-4 pb-2 text-sm">
            <span className="text-xs text-muted-foreground font-mono">
                Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPage(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {pages.map((i) => (
                    <button
                        key={i}
                        onClick={() => onPage(i)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                            i === page
                                ? "bg-[hsl(var(--accent))] text-white"
                                : "hover:bg-muted text-muted-foreground"
                        }`}
                    >
                        {i}
                    </button>
                ))}
                <button
                    onClick={() => onPage(page + 1)}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
