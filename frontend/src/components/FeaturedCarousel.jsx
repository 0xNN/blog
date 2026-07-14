import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";

/**
 * Modern featured carousel with a "peek": each slide is ~88% wide so the next
 * slide shows at the right edge, softly blurred + faded as a hint of more.
 * Count is whatever `articles` you pass (dynamic).
 */
export default function FeaturedCarousel({ articles = [] }) {
    const single = articles.length <= 1;
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: !single, align: "start", containScroll: false });
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

    // Single item — no carousel chrome / peek needed.
    if (single) {
        return <ArticleCard article={articles[0]} variant="hero" />;
    }

    return (
        <div className="relative">
            <div className="relative overflow-hidden rounded-2xl" ref={emblaRef}>
                <div className="flex -ml-5">
                    {articles.map((a) => (
                        <div key={a.id} className="min-w-0 flex-[0_0_88%] md:flex-[0_0_90%] pl-5">
                            <ArticleCard article={a} variant="hero" />
                        </div>
                    ))}
                </div>

                {/* Peek hint: soft gradient over the next slide edge */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[14%] bg-gradient-to-l from-background via-background/80 to-transparent"
                />
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
