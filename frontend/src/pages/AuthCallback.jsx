import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/contexts/LanguageContext";

export default function AuthCallback() {
    const nav = useNavigate();
    const loc = useLocation();
    const { lang } = useLang();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const handleCallback = async () => {
            // Supabase automatically handles the OAuth callback via #access_token hash
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                nav(`/${lang}/login?error=${encodeURIComponent("OAuth sign-in failed")}`, {
                    replace: true,
                });
                return;
            }

            // Clear URL hash (Supabase puts tokens there)
            window.history.replaceState(null, "", window.location.pathname);

            nav(`/${lang}/dashboard`, { replace: true });
        };

        handleCallback();
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
