export default function ArticleCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="skeleton aspect-[16/9]" />
            <div className="p-5 space-y-3">
                <div className="skeleton h-5 w-4/5" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/2 mt-2" />
            </div>
        </div>
    );
}
