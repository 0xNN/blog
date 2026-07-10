import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
    const nav = useNavigate();
    const loc = useLocation();
    const { lang } = useLang();
    const { refresh } = useAuth();
    const processed = useRef(false);

    // Sync check to grab session_id BEFORE useEffect can run
    if (!processed.current && loc.hash && loc.hash.includes("session_id=")) {
        processed.current = true;
    }

    useEffect(() => {
        const run = async () => {
            const hash = window.location.hash;
            const m = hash.match(/session_id=([^&]+)/);
            if (!m) {
                nav(`/${lang}/login`, { replace: true });
                return;
            }
            const session_id = decodeURIComponent(m[1]);
            try {
                await api.post("/auth/emergent/session", { session_id });
                await refresh();
                // Clear the fragment
                window.history.replaceState(null, "", window.location.pathname);
                nav(`/${lang}/dashboard`, { replace: true });
            } catch (e) {
                nav(`/${lang}/login?error=${encodeURIComponent(e?.response?.data?.detail || "Google login failed")}`, { replace: true });
            }
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mx-auto max-w-md px-4 py-24 text-center">
            <div className="animate-pulse text-muted-foreground font-body text-lg">
                Completing sign-in…
            </div>
        </div>
    );
}
