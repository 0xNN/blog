import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { UserPlus, Trash2, MessageSquareWarning, CheckCheck, Link2, Plus, Power } from "lucide-react";

const ROLE_OPTIONS = ["author", "editor"];
const CATEGORIES = [
    "tutorial-coding", "error-solutions", "tools-review", "developer-finance",
    "ai-prompt", "ai-agents", "career-interview", "nocode-lowcode",
    "saas-indie", "blockchain-crypto", "trading",
];

export default function AdminPanel() {
    const { user, profile } = useAuth();
    const { t } = useLang();
    const [tab, setTab] = useState("invites"); // invites | comments | subscribers
    const [invites, setInvites] = useState([]);
    const [comments, setComments] = useState([]);
    const [subs, setSubs] = useState([]);
    const [form, setForm] = useState({ email: "", name: "", role: "author" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [links, setLinks] = useState([]);
    const [affForm, setAffForm] = useState({ name: "", url: "", merchant: "", category_slug: "tools-review", description: "", image_url: "" });

    const canAccess = profile && (profile.role === "owner" || profile.role === "editor");
    const isOwner = profile?.role === "owner"; // affiliate (money) is owner-only

    const loadInvites = () => api.get("/invites").then((r) => setInvites(r.data));
    const loadComments = () => api.get("/admin/comments").then((r) => setComments(r.data));
    const loadSubs = () => api.get("/subscribers").then((r) => setSubs(r.data));
    const loadLinks = () => api.get("/affiliate-links?all=1").then((r) => setLinks(r.data)).catch(() => {});

    useEffect(() => {
        if (!canAccess) return;
        loadInvites();
        loadComments();
        loadSubs();
        if (isOwner) loadLinks();
    }, [canAccess, isOwner]);

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

    // ---- Affiliate (owner-only) ----
    const createLink = async (e) => {
        e.preventDefault();
        setError(""); setMessage("");
        try {
            await api.post("/affiliate-links", affForm);
            setAffForm({ name: "", url: "", merchant: "", category_slug: affForm.category_slug, description: "", image_url: "" });
            setMessage(t("Link afiliasi ditambahkan.", "Affiliate link added."));
            loadLinks();
        } catch (err) {
            setError(err?.response?.data?.error || err.message);
        }
    };

    const toggleLink = async (l) => {
        await api.put(`/affiliate-links/${l.id}`, { active: !l.active });
        loadLinks();
    };

    const deleteLink = async (id) => {
        if (!confirm(t("Hapus link ini?", "Delete this link?"))) return;
        await api.delete(`/affiliate-links/${id}`);
        loadLinks();
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
                        ["moderation", `${t("Moderasi", "Moderation")}`],
                        ["subscribers", `${t("Subscriber", "Subscribers")}`],
                        ...(isOwner ? [["affiliate", "Affiliate"]] : []),
                    ].map(([k, label]) => (
                        <button
                            key={k}
                            onClick={() => setTab(k === "moderation" ? "comments" : k)}
                            data-testid={`admin-tab-${k === "moderation" ? "moderation" : k}`}
                            className={`px-3 py-1.5 rounded-full transition ${(tab === k || (k === "moderation" && tab === "comments")) ? "bg-[hsl(var(--accent))] text-white" : "text-muted-foreground"}`}
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
                            className="form-input"
                        />
                        <input
                            required
                            placeholder={t("Nama", "Name")}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            data-testid="invite-form-name"
                            className="form-input"
                        />
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            data-testid="invite-form-role"
                            className="form-select"
                        >
                            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                            type="submit"
                            data-testid="invite-form-submit"
                            className="rounded-full bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1.5 whitespace-nowrap"
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

            {tab === "affiliate" && isOwner && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <form onSubmit={createLink} className="p-4 border-b border-border grid gap-2 sm:grid-cols-2">
                        <input required placeholder={t("Nama (mis. Hostinger)", "Name (e.g. Hostinger)")} value={affForm.name}
                            onChange={(e) => setAffForm({ ...affForm, name: e.target.value })}
                            className="form-input" data-testid="aff-name" />
                        <input required type="url" placeholder={t("URL afiliasi (pakai kode referral Anda)", "Affiliate URL (your referral code)")} value={affForm.url}
                            onChange={(e) => setAffForm({ ...affForm, url: e.target.value })}
                            className="form-input" data-testid="aff-url" />
                        <input placeholder={t("Merchant", "Merchant")} value={affForm.merchant}
                            onChange={(e) => setAffForm({ ...affForm, merchant: e.target.value })}
                            className="form-input" data-testid="aff-merchant" />
                        <select value={affForm.category_slug}
                            onChange={(e) => setAffForm({ ...affForm, category_slug: e.target.value })}
                            className="form-select" data-testid="aff-category">
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input placeholder={t("Deskripsi singkat", "Short description")} value={affForm.description}
                            onChange={(e) => setAffForm({ ...affForm, description: e.target.value })}
                            className="form-input sm:col-span-2" data-testid="aff-desc" />
                        <input placeholder={t("URL gambar (opsional)", "Image URL (optional)")} value={affForm.image_url}
                            onChange={(e) => setAffForm({ ...affForm, image_url: e.target.value })}
                            className="form-input sm:col-span-2" data-testid="aff-image" />
                        <button type="submit" data-testid="aff-submit"
                            className="rounded-full bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center gap-1.5 sm:col-span-2">
                            <Plus className="h-3.5 w-3.5" /> {t("Tambah link", "Add link")}
                        </button>
                    </form>
                    {message && <div className="px-4 py-2 text-xs text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">{message}</div>}
                    {error && <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{error}</div>}
                    <ul>
                        {links.map((l) => (
                            <li key={l.id} data-testid={`aff-row-${l.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 text-sm">
                                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{l.name} <span className="text-xs text-muted-foreground font-normal">· {l.category_slug}</span></div>
                                    <div className="text-xs text-muted-foreground truncate">{l.url}</div>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{l.clicks || 0} {t("klik", "clicks")}</span>
                                <button onClick={() => toggleLink(l)} title={l.active ? t("Nonaktifkan", "Deactivate") : t("Aktifkan", "Activate")}
                                    className={`p-1.5 rounded-full hover:bg-muted ${l.active ? "text-green-600" : "text-muted-foreground"}`} data-testid={`aff-toggle-${l.id}`}>
                                    <Power className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => deleteLink(l.id)} className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive" data-testid={`aff-delete-${l.id}`}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </li>
                        ))}
                        {links.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada link afiliasi.", "No affiliate links yet.")}</li>
                        )}
                    </ul>
                </div>
            )}
        </section>
    );
}
