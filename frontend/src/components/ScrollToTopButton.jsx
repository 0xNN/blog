import { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);
    const rafRef = useRef(null);

    useEffect(() => {
        const onScroll = () => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                setVisible(window.scrollY > 400);
                rafRef.current = null;
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white shadow-lg transition-all duration-300 hover:bg-[hsl(var(--accent))/0.85] hover:scale-105 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
        >
            <ArrowUp className="h-5 w-5" />
        </button>
    );
}
