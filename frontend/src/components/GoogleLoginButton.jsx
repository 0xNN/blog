// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import { useLang } from "@/contexts/LanguageContext";

export default function GoogleLoginButton({ testId = "google-login-btn" }) {
    const { lang, t } = useLang();

    const startGoogleAuth = () => {
        // Use browser's dynamic origin, never hardcode.
        const redirectUrl = window.location.origin + `/${lang}/auth/callback`;
        window.location.href =
            `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    return (
        <button
            type="button"
            onClick={startGoogleAuth}
            data-testid={testId}
            className="w-full py-3 rounded-xl border border-border bg-background hover:border-[hsl(var(--accent))] transition inline-flex items-center justify-center gap-2 font-semibold text-sm"
        >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09a6.94 6.94 0 0 1 0-4.18V7.07H2.18a10.994 10.994 0 0 0 0 9.86l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            {t("Lanjutkan dengan Google", "Continue with Google")}
        </button>
    );
}
