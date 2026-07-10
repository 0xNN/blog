import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { UserPlus, Trash2, MessageSquareWarning, CheckCheck } from "lucide-react";

const ROLE_OPTIONS = ["author", "editor"];

export default function AdminPanel() {
    const { user } = useAuth();
    const { t } = useLang();
    const [tab, setTab] = useState("invites"); // invites | comments | subscribers
    const [invites, setInvites] = useState([]);
    const [comments, setComments] = useState([]);
    const [subs, setSubs] = useState([]);
    const [form, setForm] = useState({ email: "", name: "", role: "author" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const canAccess = user && (user.role === "owner" || user.role === "editor");

    const loadInvites = () => api.get("/invites").then((r) => setInvites(r.data));
    const loadComments = () => api.get("/admin/comments").then((r) => setComments(r.data));
    const loadSubs = () => api.get("/subscribers").then((r) => setSubs(r.data));

    useEffect(() => {
        if (!canAccess) return;
        loadInvites();
        loadComments();
        loadSubs();
    }, [canAccess]);

    const invite = async (e) => {
        e.preventDefault();
        setError(""); setMessage("");
        try {
            const { data } = await api.post("/invites", form);
            setForm({ email: "", name: "", role: "author" });
            const emailStatus = data.email?.status;
            if (emailStatus === "sent") {
                setMessage(t("Undangan terkirim ke email!", "Invitation email sent!"));
            } else if (emailStatus === "skipped") {
                setMessage(t("Undangan dibuat. Resend belum dikonfigurasi — copy link manual.", "Invite created. Resend not configured — copy the link manually."));
            } else {
                setMessage(t("Undangan dibuat.", "Invite created."));
            }
            loadInvites();
        } catch (err) {
            setError(err?.response?.data?.detail || err.message);
        }
    };

    const revokeInvite = async (id) => {
        if (!confirm(t("Cabut undangan ini?", "Revoke this invite?"))) return;
        await api.delete(`/invites/${id}`);
        loadInvites();
    };

    const moderateComment = async (id, status) => {
        await api.patch(`/admin/comments/${id}`, { status });
        loadComments();
    };

    const deleteComment = async (id) => {
        if (!confirm("Delete?")) return;
        await api.delete(`/comments/${id}`);
        loadComments();
    };

    if (!canAccess) {
        return (
            <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
                {t("Hanya Owner/Editor yang bisa mengakses panel admin.", "Only Owner/Editor can access the admin panel.")}
            </div>
        );
    }

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl font-bold tracking-tight">Admin</h2>
                <div className="flex items-center rounded-full border border-border p-0.5 text-xs font-semibold">
                    {[
                        ["invites", `${t("Undangan", "Invites")}`],
                        ["comments", `${t("Moderasi", "Moderation")}`],
                        ["subscribers", `${t("Subscriber", "Subscribers")}`],
                    ].map(([k, label]) => (
                        <button
                            key={k}
                            onClick={() => setTab(k)}
                            data-testid={`admin-tab-${k}`}
                            className={`px-3 py-1.5 rounded-full transition ${tab === k ? "bg-foreground text-background" : "text-muted-foreground"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {tab === "invites" && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <form onSubmit={invite} className="p-4 border-b border-border grid sm:grid-cols-[1fr_1fr_140px_auto] gap-2">
                        <input
                            required
                            type="email"
                            placeholder="email@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            data-testid="invite-form-email"
                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                        <input
                            required
                            placeholder={t("Nama", "Name")}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            data-testid="invite-form-name"
                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            data-testid="invite-form-role"
                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        >
                            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                            type="submit"
                            data-testid="invite-form-submit"
                            className="rounded-lg bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1.5"
                        >
                            <UserPlus className="h-3.5 w-3.5" /> {t("Undang", "Invite")}
                        </button>
                    </form>
                    {message && <div className="px-4 py-2 text-xs text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">{message}</div>}
                    {error && <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{error}</div>}
                    <ul>
                        {invites.map((inv) => (
                            <li key={inv.id} data-testid={`invite-row-${inv.id}`} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 text-sm">
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{inv.name}</div>
                                    <div className="text-xs text-muted-foreground">{inv.email} · {inv.role}</div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest ${inv.status === "pending" ? "bg-yellow-500/20 text-yellow-600" : inv.status === "accepted" ? "bg-green-500/20 text-green-600" : "bg-muted"}`}>{inv.status}</span>
                                {inv.status === "pending" && (
                                    <button onClick={() => revokeInvite(inv.id)} className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive" data-testid={`invite-revoke-${inv.id}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </li>
                        ))}
                        {invites.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada undangan.", "No invites yet.")}</li>
                        )}
                    </ul>
                </div>
            )}

            {tab === "comments" && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <ul>
                        {comments.map((c) => (
                            <li key={c.id} data-testid={`mod-comment-${c.id}`} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm">
                                        <span className="font-semibold">{c.user_name}</span>
                                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${c.status === "spam" ? "bg-destructive/20 text-destructive" : c.status === "pending" ? "bg-yellow-500/20 text-yellow-600" : "bg-green-500/20 text-green-600"}`}>
                                            {c.status || "approved"}
                                        </span>
                                    </div>
                                    <p className="text-sm font-body text-muted-foreground mt-1">{c.body}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button title="Approve" onClick={() => moderateComment(c.id, "approved")} className="p-1.5 rounded-full hover:bg-green-500/10 hover:text-green-600" data-testid={`mod-approve-${c.id}`}>
                                        <CheckCheck className="h-3.5 w-3.5" />
                                    </button>
                                    <button title="Mark as spam" onClick={() => moderateComment(c.id, "spam")} className="p-1.5 rounded-full hover:bg-yellow-500/10 hover:text-yellow-600" data-testid={`mod-spam-${c.id}`}>
                                        <MessageSquareWarning className="h-3.5 w-3.5" />
                                    </button>
                                    <button title="Delete" onClick={() => deleteComment(c.id)} className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive" data-testid={`mod-delete-${c.id}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                        {comments.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada komentar.", "No comments yet.")}</li>
                        )}
                    </ul>
                </div>
            )}

            {tab === "subscribers" && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border text-sm font-semibold">
                        {subs.length} {t("subscriber", "subscribers")}
                    </div>
                    <ul>
                        {subs.map((s) => (
                            <li key={s.id} className="flex items-center px-4 py-2 border-b border-border last:border-0 text-sm">
                                <span className="flex-1 truncate">{s.email}</span>
                                <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                            </li>
                        ))}
                        {subs.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada subscriber.", "No subscribers yet.")}</li>
                        )}
                    </ul>
                </div>
            )}
        </section>
    );
}
