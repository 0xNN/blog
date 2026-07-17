import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { UserPlus, Trash2, MessageSquareWarning, CheckCheck, Link2, Plus, Power, Search, X } from "lucide-react";
import Pagination from "@/components/Pagination";

const PER_PAGE = 10;
const ROLE_OPTIONS = ["author", "editor"];
const CATEGORIES = [
    "tutorial-coding", "error-solutions", "system-design", "database-data",
    "devops-infra", "testing-quality", "security-privacy", "dev-workflow",
    "tools-review", "nocode-lowcode",
    "ai-prompt", "ai-agents",
    "career-interview", "developer-finance", "saas-indie", "learning-mindset",
    "blockchain-crypto", "trading",
];

function SkeletonRow() {
    return (
        <li className="flex items-center gap-4 px-4 py-3 border-b border-border animate-pulse">
            <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="size-7 bg-muted rounded-full" />
        </li>
    );
}

export default function AdminPanel() {
    const { user, profile } = useAuth();
    const { t } = useLang();
    const [tab, setTab] = useState("invites");
    const [invites, setInvites] = useState([]);
    const [comments, setComments] = useState([]);
    const [subs, setSubs] = useState([]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState({ invites: true, comments: true, subs: true, links: true });
    const [page, setPage] = useState({ invites: 1, comments: 1, subs: 1, links: 1 });
    const [form, setForm] = useState({ email: "", name: "", role: "author" });
    const [affForm, setAffForm] = useState({ name: "", url: "", merchant: "", category_slug: "tools-review", description: "", image_url: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [search, setSearch] = useState({ invites: "", comments: "", subs: "", links: "" });

    const canAccess = profile && (profile.role === "owner" || profile.role === "editor");
    const isOwner = profile?.role === "owner";

    const loadInvites = () => {
        setLoading(s => ({ ...s, invites: true }));
        api.get("/invites").then(r => setInvites(r.data)).finally(() => setLoading(s => ({ ...s, invites: false })));
    };
    const loadComments = () => {
        setLoading(s => ({ ...s, comments: true }));
        api.get("/admin/comments").then(r => setComments(r.data)).finally(() => setLoading(s => ({ ...s, comments: false })));
    };
    const loadSubs = () => {
        setLoading(s => ({ ...s, subs: true }));
        api.get("/subscribers").then(r => setSubs(r.data)).finally(() => setLoading(s => ({ ...s, subs: false })));
    };
    const loadLinks = () => {
        setLoading(s => ({ ...s, links: true }));
        api.get("/affiliate-links?all=1").then(r => setLinks(r.data)).catch(() => {}).finally(() => setLoading(s => ({ ...s, links: false })));
    };

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
            if (emailStatus === "sent") setMessage(t("Undangan terkirim ke email!", "Invitation email sent!"));
            else if (emailStatus === "skipped") setMessage(t("Undangan dibuat. Resend belum dikonfigurasi.", "Invite created. Resend not configured."));
            else setMessage(t("Undangan dibuat.", "Invite created."));
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
        setLoading(s => ({ ...s, comments: true }));
        await api.patch(`/admin/comments/${id}`, { status });
        loadComments();
    };

    const delComment = async (id) => {
        if (!confirm("Delete?")) return;
        setLoading(s => ({ ...s, comments: true }));
        await api.delete(`/comments/${id}`);
        loadComments();
    };

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
        setLoading(s => ({ ...s, links: true }));
        await api.put(`/affiliate-links/${l.id}`, { active: !l.active });
        loadLinks();
    };

    const deleteLink = async (id) => {
        if (!confirm(t("Hapus link ini?", "Delete this link?"))) return;
        setLoading(s => ({ ...s, links: true }));
        await api.delete(`/affiliate-links/${id}`);
        loadLinks();
    };

    function paginate(data, p) {
        return {
            items: data.slice((p - 1) * PER_PAGE, p * PER_PAGE),
            total: Math.ceil(data.length / PER_PAGE),
        };
    }

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
                        ["invites", t("Undangan", "Invites")],
                        ["comments", t("Moderasi", "Moderation")],
                        ["subscribers", t("Subscriber", "Subscribers")],
                        ...(isOwner ? [["affiliate", "Affiliate"]] : []),
                    ].map(([k, label]) => (
                        <button key={k} onClick={() => { setTab(k); setMessage(""); setError(""); }}
                            className={`px-3 py-1.5 rounded-full transition ${tab === k ? "bg-[hsl(var(--accent))] text-white" : "text-muted-foreground"}`}
                        >{label}</button>
                    ))}
                </div>
            </div>

            {/* --- INVITES --- */}
            {tab === "invites" && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <form onSubmit={invite} className="p-4 border-b border-border grid sm:grid-cols-[1fr_1fr_140px_auto] gap-2">
                        <input required type="email" placeholder="email@example.com" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" data-testid="invite-form-email" />
                        <input required placeholder={t("Nama", "Name")} value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" data-testid="invite-form-name" />
                        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" data-testid="invite-form-role">
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button type="submit" data-testid="invite-form-submit"
                            className="rounded-full bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1.5 whitespace-nowrap">
                            <UserPlus className="h-3.5 w-3.5" /> {t("Undang", "Invite")}
                        </button>
                    </form>
                    {message && <div className="px-4 py-2 text-xs text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">{message}</div>}
                    {error && <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{error}</div>}
                    <div className="px-4 py-2 border-b border-border">
                        <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input value={search.invites} onChange={e => { setSearch(s => ({ ...s, invites: e.target.value })); setPage(p => ({ ...p, invites: 1 })); }}
                                placeholder={t("Cari undangan...", "Search invites...")} className="w-full pl-8 pr-8 py-1.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))]" />
                            {search.invites && <button onClick={() => { setSearch(s => ({ ...s, invites: "" })); setPage(p => ({ ...p, invites: 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                        </div>
                    </div>
                    <ul>
                        {loading.invites ? (
                            <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                        ) : (() => {
                            const filtered = invites.filter(i => !search.invites || i.name.toLowerCase().includes(search.invites.toLowerCase()) || i.email.toLowerCase().includes(search.invites.toLowerCase()));
                            const { items, total } = paginate(filtered, page.invites);
                            return items.length > 0 ? items.map(inv => (
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
                            )) : (
                                <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada undangan.", "No invites yet.")}</li>
                            );
                        })()}
                    </ul>
                    {!loading.invites && invites.filter(i => !search.invites || i.name.toLowerCase().includes(search.invites.toLowerCase()) || i.email.toLowerCase().includes(search.invites.toLowerCase())).length > PER_PAGE && (
                        <div className="px-4 border-t border-border"><Pagination page={page.invites} totalPages={paginate(invites.filter(i => !search.invites || i.name.toLowerCase().includes(search.invites.toLowerCase()) || i.email.toLowerCase().includes(search.invites.toLowerCase())), page.invites).total} onPage={p => setPage(s => ({ ...s, invites: p }))} /></div>
                    )}
                </div>
            )}

            {/* --- COMMENTS --- */}
            {tab === "comments" && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="px-4 py-2 border-b border-border">
                        <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input value={search.comments} onChange={e => { setSearch(s => ({ ...s, comments: e.target.value })); setPage(p => ({ ...p, comments: 1 })); }}
                                placeholder={t("Cari komentar...", "Search comments...")} className="w-full pl-8 pr-8 py-1.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))]" />
                            {search.comments && <button onClick={() => { setSearch(s => ({ ...s, comments: "" })); setPage(p => ({ ...p, comments: 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                        </div>
                    </div>
                    <ul>
                        {loading.comments ? (
                            <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                        ) : (() => {
                            const filtered = comments.filter(c => !search.comments || c.body?.toLowerCase().includes(search.comments.toLowerCase()) || c.user_name?.toLowerCase().includes(search.comments.toLowerCase()));
                            const { items, total } = paginate(filtered, page.comments);
                            return items.length > 0 ? items.map(c => (
                                <li key={c.id} data-testid={`mod-comment-${c.id}`} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm">
                                            <span className="font-semibold">{c.user_name}</span>
                                            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${c.status === "spam" ? "bg-destructive/20 text-destructive" : c.status === "pending" ? "bg-yellow-500/20 text-yellow-600" : "bg-green-500/20 text-green-600"}`}>{c.status || "approved"}</span>
                                        </div>
                                        <p className="text-sm font-body text-muted-foreground mt-1">{c.body}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button title="Approve" onClick={() => moderateComment(c.id, "approved")} className="p-1.5 rounded-full hover:bg-green-500/10 hover:text-green-600" data-testid={`mod-approve-${c.id}`}><CheckCheck className="h-3.5 w-3.5" /></button>
                                        <button title="Spam" onClick={() => moderateComment(c.id, "spam")} className="p-1.5 rounded-full hover:bg-yellow-500/10 hover:text-yellow-600" data-testid={`mod-spam-${c.id}`}><MessageSquareWarning className="h-3.5 w-3.5" /></button>
                                        <button title="Delete" onClick={() => delComment(c.id)} className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive" data-testid={`mod-delete-${c.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </li>
                            )) : (
                                <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada komentar.", "No comments yet.")}</li>
                            );
                        })()}
                    </ul>
                    {!loading.comments && comments.filter(c => !search.comments || c.body?.toLowerCase().includes(search.comments.toLowerCase()) || c.user_name?.toLowerCase().includes(search.comments.toLowerCase())).length > PER_PAGE && (
                        <div className="px-4 border-t border-border"><Pagination page={page.comments} totalPages={paginate(comments.filter(c => !search.comments || c.body?.toLowerCase().includes(search.comments.toLowerCase()) || c.user_name?.toLowerCase().includes(search.comments.toLowerCase())), page.comments).total} onPage={p => setPage(s => ({ ...s, comments: p }))} /></div>
                    )}
                </div>
            )}

            {/* --- SUBSCRIBERS --- */}
            {tab === "subscribers" && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border text-sm font-semibold">
                        {subs.length} {t("subscriber", "subscribers")}
                    </div>
                    <div className="px-4 py-2 border-b border-border">
                        <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input value={search.subs} onChange={e => { setSearch(s => ({ ...s, subs: e.target.value })); setPage(p => ({ ...p, subs: 1 })); }}
                                placeholder={t("Cari subscriber...", "Search subscribers...")} className="w-full pl-8 pr-8 py-1.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))]" />
                            {search.subs && <button onClick={() => { setSearch(s => ({ ...s, subs: "" })); setPage(p => ({ ...p, subs: 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                        </div>
                    </div>
                    <ul>
                        {loading.subs ? (
                            <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                        ) : (() => {
                            const filtered = subs.filter(s => !search.subs || s.email.toLowerCase().includes(search.subs.toLowerCase()));
                            const { items, total } = paginate(filtered, page.subs);
                            return items.length > 0 ? items.map(s => (
                                <li key={s.id} className="flex items-center px-4 py-2 border-b border-border last:border-0 text-sm">
                                    <span className="flex-1 truncate">{s.email}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                                </li>
                            )) : (
                                <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada subscriber.", "No subscribers yet.")}</li>
                            );
                        })()}
                    </ul>
                    {!loading.subs && (() => { const f = subs.filter(s => !search.subs || s.email.toLowerCase().includes(search.subs.toLowerCase())); return f.length > PER_PAGE; })() && (
                        <div className="px-4 border-t border-border"><Pagination page={page.subs} totalPages={paginate(subs.filter(s => !search.subs || s.email.toLowerCase().includes(search.subs.toLowerCase())), page.subs).total} onPage={p => setPage(s => ({ ...s, subs: p }))} /></div>
                    )}
                </div>
            )}

            {/* --- AFFILIATE --- */}
            {tab === "affiliate" && isOwner && (
                <div className="rounded-2xl border border-border overflow-hidden">
                    <form onSubmit={createLink} className="p-4 border-b border-border grid gap-2 sm:grid-cols-2">
                        <input required placeholder={t("Nama", "Name")} value={affForm.name}
                            onChange={e => setAffForm({ ...affForm, name: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" data-testid="aff-name" />
                        <input required type="url" placeholder={t("URL afiliasi", "Affiliate URL")} value={affForm.url}
                            onChange={e => setAffForm({ ...affForm, url: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" data-testid="aff-url" />
                        <input placeholder={t("Merchant", "Merchant")} value={affForm.merchant}
                            onChange={e => setAffForm({ ...affForm, merchant: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" data-testid="aff-merchant" />
                        <select value={affForm.category_slug}
                            onChange={e => setAffForm({ ...affForm, category_slug: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" data-testid="aff-category">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input placeholder={t("Deskripsi singkat", "Short description")} value={affForm.description}
                            onChange={e => setAffForm({ ...affForm, description: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm sm:col-span-2" data-testid="aff-desc" />
                        <input placeholder={t("URL gambar (opsional)", "Image URL (optional)")} value={affForm.image_url}
                            onChange={e => setAffForm({ ...affForm, image_url: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm sm:col-span-2" data-testid="aff-image" />
                        <button type="submit" data-testid="aff-submit"
                            className="rounded-full bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center gap-1.5 sm:col-span-2">
                            <Plus className="h-3.5 w-3.5" /> {t("Tambah link", "Add link")}
                        </button>
                    </form>
                    {message && <div className="px-4 py-2 text-xs text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">{message}</div>}
                    {error && <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{error}</div>}
                    <div className="px-4 py-2 border-b border-border">
                        <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input value={search.links} onChange={e => { setSearch(s => ({ ...s, links: e.target.value })); setPage(p => ({ ...p, links: 1 })); }}
                                placeholder={t("Cari link...", "Search links...")} className="w-full pl-8 pr-8 py-1.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))]" />
                            {search.links && <button onClick={() => { setSearch(s => ({ ...s, links: "" })); setPage(p => ({ ...p, links: 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                        </div>
                    </div>
                    <ul>
                        {loading.links ? (
                            <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                        ) : (() => {
                            const filtered = links.filter(l => !search.links || l.name.toLowerCase().includes(search.links.toLowerCase()) || l.merchant?.toLowerCase().includes(search.links.toLowerCase()));
                            const { items, total } = paginate(filtered, page.links);
                            return items.length > 0 ? items.map(l => (
                                <li key={l.id} data-testid={`aff-row-${l.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 text-sm">
                                    <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{l.name} <span className="text-xs text-muted-foreground font-normal">· {l.category_slug}</span></div>
                                        <div className="text-xs text-muted-foreground truncate">{l.url}</div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{l.clicks || 0} {t("klik", "clicks")}</span>
                                    <button onClick={() => toggleLink(l)} title={l.active ? "Nonaktifkan" : "Aktifkan"}
                                        className={`p-1.5 rounded-full hover:bg-muted ${l.active ? "text-green-600" : "text-muted-foreground"}`} data-testid={`aff-toggle-${l.id}`}>
                                        <Power className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => deleteLink(l.id)} className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive" data-testid={`aff-delete-${l.id}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </li>
                            )) : (
                                <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Belum ada link afiliasi.", "No affiliate links yet.")}</li>
                            );
                        })()}
                    </ul>
                    {!loading.links && links.filter(l => !search.links || l.name.toLowerCase().includes(search.links.toLowerCase()) || l.merchant?.toLowerCase().includes(search.links.toLowerCase())).length > PER_PAGE && (
                        <div className="px-4 border-t border-border"><Pagination page={page.links} totalPages={paginate(links.filter(l => !search.links || l.name.toLowerCase().includes(search.links.toLowerCase()) || l.merchant?.toLowerCase().includes(search.links.toLowerCase())), page.links).total} onPage={p => setPage(s => ({ ...s, links: p }))} /></div>
                    )}
                </div>
            )}
        </section>
    );
}
