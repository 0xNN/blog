import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, formatApiError } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { LogIn } from "lucide-react";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function Login() {
    const { login } = useAuth();
    const { lang, t } = useLang();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, password);
            nav(`/${lang}/dashboard`);
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md px-4 py-16 lg:py-24">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[hsl(var(--accent))] mb-4">
                    <LogIn className="h-5 w-5 text-white" />
                </div>
                <h1 className="font-heading text-4xl font-black tracking-tight">{t("Masuk", "Welcome back")}</h1>
                <p className="text-muted-foreground font-body mt-2">{t("Lanjutkan menulis atau baca artikel eksklusif.", "Keep writing or read exclusive stories.")}</p>
            </div>

            <div className="mb-6">
                <GoogleLoginButton testId="login-google-btn" />
                <div className="my-6 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    {t("atau", "or")}
                    <div className="flex-1 h-px bg-border" />
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="login-email"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-[hsl(var(--accent))] transition"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="login-password"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-[hsl(var(--accent))] transition"
                    />
                </div>
                {error && <div data-testid="login-error" className="text-sm text-destructive">{error}</div>}
                <button
                    type="submit"
                    data-testid="login-submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                    {loading ? "…" : t("Masuk", "Log in")}
                </button>
            </form>

            <div className="text-center text-sm text-muted-foreground mt-6">
                {t("Belum punya akun?", "Don't have an account?")}{" "}
                <Link to={`/${lang}/register`} className="text-[hsl(var(--accent))] font-semibold" data-testid="login-to-register">
                    {t("Daftar", "Sign up")}
                </Link>
            </div>

            <div className="mt-8 rounded-xl border border-dashed border-border p-4 text-xs font-mono text-muted-foreground">
                <div className="font-semibold mb-1">Demo credentials:</div>
                <div>admin@devhub.io / Admin123!</div>
                <div>author@devhub.io / Author123!</div>
            </div>
        </div>
    );
}
