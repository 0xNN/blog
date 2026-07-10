import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { CheckCircle2, XCircle, Mail } from "lucide-react";

export default function AcceptInvite() {
    const { token } = useParams();
    const { lang, t } = useLang();
    const { refresh } = useAuth();
    const nav = useNavigate();
    const [invite, setInvite] = useState(null);
    const [password, setPassword] = useState("");
    const [state, setState] = useState("loading"); // loading | ready | error | success
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/invites/token/${token}`)
            .then((r) => { setInvite(r.data); setState("ready"); })
            .catch((err) => {
                setError(err?.response?.data?.detail || "Invalid invite");
                setState("error");
            });
    }, [token]);

    const submit = async (e) => {
        e.preventDefault();
        if (password.length < 6) { setError(t("Password minimal 6 karakter", "Password must be at least 6 characters")); return; }
        setError("");
        try {
            await api.post(`/invites/token/${token}/accept`, { password });
            await refresh();
            setState("success");
            setTimeout(() => nav(`/${lang}/dashboard`), 1500);
        } catch (err) {
            setError(err?.response?.data?.detail || "Failed to accept invite");
        }
    };

    if (state === "loading") return <div className="text-center py-24 text-muted-foreground">{t("Memuat…", "Loading…")}</div>;

    if (state === "error") return (
        <div className="mx-auto max-w-md px-4 py-24 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h1 className="font-heading text-3xl font-bold mb-3">{t("Undangan tidak valid", "Invalid invitation")}</h1>
            <p className="text-muted-foreground font-body mb-6">{error}</p>
            <Link to={`/${lang}`} className="text-[hsl(var(--accent))] underline">{t("Kembali ke beranda", "Back to home")}</Link>
        </div>
    );

    if (state === "success") return (
        <div className="mx-auto max-w-md px-4 py-24 text-center animate-fade-in">
            <CheckCircle2 className="h-12 w-12 mx-auto text-[hsl(var(--accent))] mb-4" />
            <h1 className="font-heading text-3xl font-bold mb-3">{t("Selamat datang!", "Welcome aboard!")}</h1>
            <p className="text-muted-foreground font-body">{t("Mengarahkan ke dashboard…", "Redirecting to dashboard…")}</p>
        </div>
    );

    return (
        <div className="mx-auto max-w-md px-4 py-16 lg:py-24">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[hsl(var(--accent))] mb-4">
                    <Mail className="h-5 w-5 text-white" />
                </div>
                <h1 className="font-heading text-4xl font-black tracking-tight">{t("Selamat datang!", "Welcome!")}</h1>
                <p className="text-muted-foreground font-body mt-2">
                    <strong>{invite.invited_by}</strong> {t("mengundang kamu bergabung sebagai", "invited you to join as")} <strong>{invite.role}</strong>.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">Email</label>
                    <input type="email" value={invite.email} disabled className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground" data-testid="invite-email-display" />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">{t("Nama", "Name")}</label>
                    <input value={invite.name} disabled className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground" />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2">{t("Buat Password", "Set Password")}</label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="invite-password"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-[hsl(var(--accent))]"
                        autoFocus
                    />
                </div>
                {error && <div className="text-sm text-destructive" data-testid="invite-error">{error}</div>}
                <button type="submit" data-testid="invite-submit" className="w-full py-3 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition">
                    {t("Terima undangan", "Accept invitation")}
                </button>
            </form>
        </div>
    );
}
