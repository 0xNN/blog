import { useState } from "react";
import { Mail, Check } from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";

export default function NewsletterForm({ compact = false }) {
    const { t } = useLang();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus("loading");
        setError("");
        try {
            await api.post("/subscribe", { email });
            setStatus("success");
            setEmail("");
        } catch (err) {
            const d = err?.response?.data?.detail;
            setError(typeof d === "string" ? d : t("Gagal berlangganan", "Failed to subscribe"));
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div
                data-testid="newsletter-success"
                className="flex items-center gap-2 rounded-full bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30 px-4 py-2.5 text-sm text-[hsl(var(--accent))]"
            >
                <Check className="h-4 w-4" />
                <span>{t("Terima kasih! Kamu berhasil berlangganan.", "Thanks! You're subscribed.")}</span>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className={`flex gap-2 ${compact ? "" : "max-w-md"}`}>
            <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("Email kamu", "Your email")}
                    data-testid="newsletter-email-input"
                    className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))] transition"
                />
            </div>
            <button
                type="submit"
                data-testid="newsletter-submit"
                disabled={status === "loading"}
                className="rounded-full px-4 py-2.5 bg-foreground text-background text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
                {status === "loading" ? "…" : t("Subscribe", "Subscribe")}
            </button>
            {error && (
                <div data-testid="newsletter-error" className="text-xs text-destructive absolute mt-14">{error}</div>
            )}
        </form>
    );
}
