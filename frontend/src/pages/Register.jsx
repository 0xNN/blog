import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, formatApiError } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { PenSquare } from "lucide-react";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function Register() {
    const { register, user, loading: authLoading } = useAuth();
    const { lang, t } = useLang();
    const nav = useNavigate();

    useEffect(() => {
        if (!authLoading && user) nav(`/${lang}/dashboard`, { replace: true });
    }, [user, authLoading, lang, nav]);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await register(form.email, form.password, form.name);
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
                    <PenSquare className="h-5 w-5 text-white" />
                </div>
                <h1 className="font-heading text-4xl font-black tracking-tight">{t("Jadi Kontributor", "Become a contributor")}</h1>
                <p className="text-muted-foreground font-body mt-2">{t("Bagikan pengetahuan kamu dengan komunitas developer.", "Share your knowledge with the dev community.")}</p>
            </div>

            <div className="mb-6">
                <GoogleLoginButton testId="register-google-btn" />
                <div className="my-6 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    {t("atau", "or")}
                    <div className="flex-1 h-px bg-border" />
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">{t("Nama", "Name")}</label>
                    <input
                        required
                        value={form.name}
                        onChange={update("name")}
                        data-testid="register-name"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-[hsl(var(--accent))]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">Email</label>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={update("email")}
                        data-testid="register-email"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-[hsl(var(--accent))]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
                    <input
                        type="password"
                        required
                        minLength={8}
                        pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                        title="At least 8 characters with uppercase, lowercase, and a number"
                        value={form.password}
                        onChange={update("password")}
                        data-testid="register-password"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-[hsl(var(--accent))]"
                    />
                </div>
                {error && <div data-testid="register-error" className="text-sm text-destructive">{error}</div>}
                <button
                    type="submit"
                    data-testid="register-submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[hsl(var(--accent))] text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                    {loading ? "…" : t("Daftar", "Sign up")}
                </button>
            </form>

            <div className="text-center text-sm text-muted-foreground mt-6">
                {t("Sudah punya akun?", "Already have an account?")}{" "}
                <Link to={`/${lang}/login`} className="text-[hsl(var(--accent))] font-semibold">{t("Masuk", "Log in")}</Link>
            </div>
        </div>
    );
}
