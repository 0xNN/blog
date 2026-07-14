import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";

/**
 * Modern featured carousel — one hero card per slide, with dot indicators and
 * prev/next controls. Count is whatever `articles` you pass (dynamic).
 */
export default function FeaturedCarousel({ articles = [] }) {
    const single = articles.length <= 1;
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: !single, align: "start" });
    const [selected, setSelected] = useState(0);
    const [snaps, setSnaps] = useState([]);

    const onSelect = useCallback((api) => setSelected(api.selectedScrollSnap()), []);

    useEffect(() => {
        if (!emblaApi) return;
        setSnaps(emblaApi.scrollSnapList());
        onSelect(emblaApi);
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
        return () => emblaApi.off("select", onSelect);
    }, [emblaApi, onSelect]);

    if (!articles.length) return null;

    // Single item — no carousel chrome needed.
    if (single) {
        return <ArticleCard article={articles[0]} variant="hero" />;
    }

    return (
        <div className="relative">
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
                <div className="flex">
                    {articles.map((a) => (
                        <div key={a.id} className="min-w-0 flex-[0_0_100%]">
                            <ArticleCard article={a} variant="hero" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between mt-5">
                <div className="flex items-center gap-1.5">
                    {snaps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => emblaApi?.scrollTo(i)}
                            aria-label={`Ke slide ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === selected
                                    ? "w-7 bg-[hsl(var(--accent))]"
                                    : "w-1.5 bg-border-strong hover:bg-muted-foreground"
                            }`}
                        />
                    ))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => emblaApi?.scrollPrev()}
                        aria-label="Sebelumnya"
                        className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => emblaApi?.scrollNext()}
                        aria-label="Berikutnya"
                        className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition-colors"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
