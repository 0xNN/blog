import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import slugify from "slugify";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Save, Eye, Sparkles, Image as ImageIcon, Languages, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const CATEGORIES = [
    "tutorial-coding", "error-solutions", "system-design", "database-data",
    "devops-infra", "testing-quality", "security-privacy", "dev-workflow",
    "tools-review", "nocode-lowcode",
    "ai-prompt", "ai-agents",
    "career-interview", "developer-finance", "saas-indie", "learning-mindset",
    "blockchain-crypto", "trading",
];

const empty = { title: "", slug: "", excerpt: "", body_md: "", meta_description: "" };

export default function EditorPage() {
    const { user, loading } = useAuth();
    const { lang, t } = useLang();
    const { id } = useParams();
    const nav = useNavigate();
    const isNew = id === "new";

    const [tab, setTab] = useState("id");
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState("");
    const [autoSavedAt, setAutoSavedAt] = useState(null);
    const autosaveTimer = useRef(null);
    const hasChanges = useRef(false);
    const isMounted = useRef(false);

    const [meta, setMeta] = useState({
        category_slug: "tutorial-coding",
        tags: "",
        cover_image: "",
        ads_enabled: true,
        featured: false,
        status: "draft",
    });
    const [contentId, setContentId] = useState(empty);
    const [contentEn, setContentEn] = useState(empty);

    useEffect(() => {
        if (!loading && !user) nav(`/${lang}/login`);
    }, [user, loading, lang, nav]);

    useEffect(() => {
        if (isNew || !id) return;
        api.get(`/articles?limit=100`).then(async (r) => {
            const found = r.data.find((a) => a.id === id);
            if (found) {
                setMeta({
                    category_slug: found.category_slug,
                    tags: (found.tags || []).join(", "),
                    cover_image: found.cover_image || "",
                    ads_enabled: found.ads_enabled,
                    featured: found.featured,
                    status: found.status,
                });
                if (found.content_id) setContentId(found.content_id);
                if (found.content_en) setContentEn(found.content_en);
            } else {
                // check draft
                const r2 = await api.get(`/articles?status=draft&limit=100`);
                const f = r2.data.find((a) => a.id === id);
                if (f) {
                    setMeta({
                        category_slug: f.category_slug,
                        tags: (f.tags || []).join(", "),
                        cover_image: f.cover_image || "",
                        ads_enabled: f.ads_enabled,
                        featured: f.featured,
                        status: f.status,
                    });
                    if (f.content_id) setContentId(f.content_id);
                    if (f.content_en) setContentEn(f.content_en);
                }
            }
        });
    }, [id, isNew]);

    const updateContent = (which) => (field, value) => {
        const setter = which === "id" ? setContentId : setContentEn;
        setter((c) => ({
            ...c,
            [field]: value,
            slug: field === "title" && !c.slug ? slugify(value, { lower: true, strict: true }) : c.slug,
        }));
        hasChanges.current = true;
    };

    // Autosave: 5s after typing stops. Skip for brand-new (no id yet, needs title) articles.
    useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        if (!hasChanges.current) return;
        if (isNew && !contentId.title && !contentEn.title) return;
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(async () => {
            try {
                await save(false, { silent: true });
                setAutoSavedAt(new Date());
                hasChanges.current = false;
            } catch { /* silently ignore */ }
        }, 5000);
        return () => autosaveTimer.current && clearTimeout(autosaveTimer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentId, contentEn, meta]);

    const buildContent = (c) => {
        if (!c.title.trim()) return null;
        return {
            title: c.title,
            slug: c.slug || slugify(c.title, { lower: true, strict: true }),
            excerpt: c.excerpt,
            body_md: c.body_md,
            meta_description: c.meta_description,
        };
    };

    const save = async (publish = false, opts = {}) => {
        const { silent = false } = opts;
        if (!silent) setSaving(true);
        setError("");
        try {
            const body = {
                category_slug: meta.category_slug,
                tags: meta.tags.split(",").map((s) => s.trim()).filter(Boolean),
                cover_image: meta.cover_image,
                ads_enabled: meta.ads_enabled,
                featured: meta.featured,
                status: publish ? "published" : meta.status,
                content_id: buildContent(contentId),
                content_en: buildContent(contentEn),
            };
            if (!body.content_id && !body.content_en) {
                setError(t("Isi setidaknya satu bahasa (ID atau EN).", "Fill at least one language (ID or EN)."));
                setSaving(false);
                return;
            }
            let saved;
            if (isNew) {
                const r = await api.post("/articles", body);
                saved = r.data;
                nav(`/${lang}/editor/${saved.id}`, { replace: true });
            } else {
                const r = await api.put(`/articles/${id}`, body);
                saved = r.data;
            }
            setMeta((m) => ({ ...m, status: saved.status }));
            hasChanges.current = false;
            if (silent) setAutoSavedAt(new Date());
        } catch (err) {
            setError(err?.response?.data?.detail || err.message);
            if (silent) throw err;
        } finally {
            if (!silent) setSaving(false);
        }
    };

    const runAi = async (mode) => {
        const current = tab === "id" ? contentId : contentEn;
        const set = tab === "id" ? setContentId : setContentEn;
        setAiLoading(true);
        setError("");
        try {
            let payload;
            if (mode === "draft") {
                payload = { mode: "draft", prompt: current.title || "Write an article for developers" };
            } else if (mode === "translate") {
                const source = tab === "id" ? contentEn.body_md : contentId.body_md;
                if (!source) { setError(t("Isi bahasa satunya dulu.", "Fill the other language first.")); setAiLoading(false); return; }
                payload = { mode: "translate", prompt: "", source_text: source, target_lang: tab };
            } else if (mode === "meta") {
                payload = { mode: "meta", prompt: "", source_text: current.body_md };
            } else if (mode === "improve") {
                payload = { mode: "improve", prompt: "", source_text: current.body_md };
            }
            const { data } = await api.post("/ai/generate", payload);
            if (mode === "meta") set((c) => ({ ...c, meta_description: data.result.trim() }));
            else set((c) => ({ ...c, body_md: data.result }));
        } catch (err) {
            setError(err?.response?.data?.detail || err.message);
        } finally {
            setAiLoading(false);
        }
    };

    const uploadCover = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        try {
            const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const backend = import.meta.env.VITE_EDGE_FUNCTIONS_URL || "";
            setMeta((m) => ({ ...m, cover_image: `${backend}${data.url}` }));
        } catch (err) {
            setError("Upload failed: " + (err?.response?.data?.detail || err.message));
        }
    };

    if (!user) return null;

    const cur = tab === "id" ? contentId : contentEn;
    const setCur = updateContent(tab);

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-full border border-border p-0.5 text-xs font-semibold">
                        <button data-testid="editor-tab-id" onClick={() => setTab("id")} className={`px-3 py-1.5 rounded-full ${tab === "id" ? "bg-[hsl(var(--accent))] text-white" : "text-muted-foreground"}`}>Bahasa Indonesia</button>
                        <button data-testid="editor-tab-en" onClick={() => setTab("en")} className={`px-3 py-1.5 rounded-full ${tab === "en" ? "bg-[hsl(var(--accent))] text-white" : "text-muted-foreground"}`}>English</button>
                    </div>
                    <button data-testid="editor-preview-toggle" onClick={() => setPreview(!preview)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> {preview ? t("Edit", "Edit") : "Preview"}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {autoSavedAt && (
                        <span data-testid="editor-autosaved" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-[hsl(var(--accent))]" />
                            {t("Tersimpan", "Saved")} {autoSavedAt.toLocaleTimeString()}
                        </span>
                    )}
                    <button data-testid="editor-save-draft" onClick={() => save(false)} disabled={saving} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-[hsl(var(--accent))] disabled:opacity-60 inline-flex items-center gap-1.5">
                        <Save className="h-3.5 w-3.5" /> {saving ? "…" : t("Simpan draft", "Save draft")}
                    </button>
                    <button data-testid="editor-publish" onClick={() => save(true)} disabled={saving} className="rounded-full bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                        {t("Publish", "Publish")}
                    </button>
                </div>
            </div>

            {error && <div data-testid="editor-error" className="mb-4 rounded-xl bg-destructive/10 border border-destructive/40 text-destructive p-3 text-sm">{error}</div>}

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                {/* Main editor */}
                <div className="space-y-4 min-w-0">
                    {!preview ? (
                        <>
                            <input
                                data-testid="editor-title"
                                value={cur.title}
                                onChange={(e) => setCur("title", e.target.value)}
                                placeholder={tab === "id" ? "Judul artikel…" : "Article title…"}
                                className="w-full font-heading text-3xl sm:text-4xl font-black tracking-tight bg-transparent outline-none placeholder:text-muted-foreground/40"
                            />
                            <input
                                data-testid="editor-slug"
                                value={cur.slug}
                                onChange={(e) => setCur("slug", slugify(e.target.value, { lower: true, strict: true }))}
                                placeholder="slug-artikel"
                                className="w-full bg-transparent outline-none text-sm font-mono text-muted-foreground border-b border-border pb-2"
                            />
                            <textarea
                                data-testid="editor-excerpt"
                                value={cur.excerpt}
                                onChange={(e) => setCur("excerpt", e.target.value)}
                                placeholder={tab === "id" ? "Excerpt (ringkasan singkat)" : "Excerpt (short summary)"}
                                rows={2}
                                className="w-full bg-transparent outline-none font-body text-lg text-muted-foreground border-b border-border pb-3 resize-none"
                            />
                            <textarea
                                data-testid="editor-body"
                                value={cur.body_md}
                                onChange={(e) => setCur("body_md", e.target.value)}
                                placeholder={tab === "id" ? "Tulis artikel dalam Markdown…\n\n## Contoh heading\n\n```jsx\nfunction Hi() { return <p>Hello</p> }\n```" : "Write your article in Markdown…"}
                                rows={24}
                                className="w-full bg-transparent outline-none font-mono text-sm leading-relaxed resize-y min-h-[400px]"
                            />
                            <input
                                data-testid="editor-meta-desc"
                                value={cur.meta_description}
                                onChange={(e) => setCur("meta_description", e.target.value)}
                                placeholder={tab === "id" ? "Meta description (SEO)" : "Meta description (SEO)"}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none"
                            />
                        </>
                    ) : (
                        <div>
                            <h1 className="font-heading text-4xl font-black tracking-tight mb-4">{cur.title || "(untitled)"}</h1>
                            {cur.excerpt && <p className="font-body text-lg text-muted-foreground mb-6">{cur.excerpt}</p>}
                            <div data-article-body>
                                <MarkdownRenderer content={cur.body_md || "*Nothing yet*"} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-4">
                    <div className="rounded-2xl border border-border p-4 space-y-3">
                        <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("Pengaturan", "Settings")}</h3>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("Kategori", "Category")}</label>
                            <select
                                data-testid="editor-category"
                                value={meta.category_slug}
                                onChange={(e) => setMeta({ ...meta, category_slug: e.target.value })}
                                className="form-select mt-1"
                            >
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">Tags</label>
                            <input
                                data-testid="editor-tags"
                                value={meta.tags}
                                onChange={(e) => setMeta({ ...meta, tags: e.target.value })}
                                placeholder="react, hooks, tutorial"
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("Cover Image", "Cover Image")}</label>
                            <div className="mt-1 flex gap-2">
                                <input
                                    data-testid="editor-cover-url"
                                    value={meta.cover_image}
                                    onChange={(e) => setMeta({ ...meta, cover_image: e.target.value })}
                                    placeholder="URL"
                                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                                <label className="cursor-pointer px-3 py-2 rounded-lg border border-border text-sm hover:border-[hsl(var(--accent))] inline-flex items-center gap-1">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    <input type="file" accept="image/*" onChange={uploadCover} className="hidden" data-testid="editor-cover-upload" />
                                </label>
                            </div>
                            {meta.cover_image && <img src={meta.cover_image} alt="cover" className="w-full mt-2 rounded-lg" />}
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="editor-ads-enabled"
                                data-testid="editor-ads-enabled"
                                checked={meta.ads_enabled}
                                onCheckedChange={(v) => setMeta({ ...meta, ads_enabled: !!v })}
                            />
                            <label htmlFor="editor-ads-enabled" className="text-sm cursor-pointer select-none">
                                {t("Aktifkan iklan", "Enable ads")}
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="editor-featured"
                                data-testid="editor-featured"
                                checked={meta.featured}
                                onCheckedChange={(v) => setMeta({ ...meta, featured: !!v })}
                            />
                            <label htmlFor="editor-featured" className="text-sm cursor-pointer select-none">
                                {t("Featured di homepage", "Feature on homepage")}
                            </label>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border p-4 space-y-2">
                        <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" /> AI Assistant
                        </h3>
                        <p className="text-xs text-muted-foreground font-body">{t("Powered by Claude Sonnet 4.5", "Powered by Claude Sonnet 4.5")}</p>
                        <button data-testid="ai-draft" onClick={() => runAi("draft")} disabled={aiLoading} className="w-full py-2 rounded-lg border border-border text-sm hover:border-[hsl(var(--accent))] disabled:opacity-60">
                            {aiLoading ? "…" : t("Buat draft dari judul", "Generate draft from title")}
                        </button>
                        <button data-testid="ai-improve" onClick={() => runAi("improve")} disabled={aiLoading || !cur.body_md} className="w-full py-2 rounded-lg border border-border text-sm hover:border-[hsl(var(--accent))] disabled:opacity-60">
                            {t("Perbaiki tulisan", "Improve writing")}
                        </button>
                        <button data-testid="ai-translate" onClick={() => runAi("translate")} disabled={aiLoading} className="w-full py-2 rounded-lg border border-border text-sm hover:border-[hsl(var(--accent))] disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                            <Languages className="h-3.5 w-3.5" />
                            {tab === "id" ? t("Terjemah dari EN", "Translate from EN") : t("Translate from ID", "Translate from ID")}
                        </button>
                        <button data-testid="ai-meta" onClick={() => runAi("meta")} disabled={aiLoading || !cur.body_md} className="w-full py-2 rounded-lg border border-border text-sm hover:border-[hsl(var(--accent))] disabled:opacity-60">
                            {t("Generate meta description", "Generate meta description")}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
