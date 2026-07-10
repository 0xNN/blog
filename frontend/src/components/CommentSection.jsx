import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

function timeAgo(iso, lang) {
    const then = new Date(iso).getTime();
    const diff = (Date.now() - then) / 1000;
    if (diff < 60) return lang === "id" ? "baru saja" : "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}${lang === "id" ? " mnt lalu" : "m ago"}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}${lang === "id" ? " jam lalu" : "h ago"}`;
    return `${Math.floor(diff / 86400)}${lang === "id" ? " hari lalu" : "d ago"}`;
}

export default function CommentSection({ articleId }) {
    const { user } = useAuth();
    const { lang, t } = useLang();
    const [comments, setComments] = useState([]);
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/comments/${articleId}`).then((r) => setComments(r.data)).catch(() => {});
    }, [articleId]);

    const submit = async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setLoading(true);
        try {
            const { data } = await api.post("/comments", { article_id: articleId, body });
            setComments((prev) => [...prev, data]);
            setBody("");
        } finally {
            setLoading(false);
        }
    };

    const del = async (id) => {
        try {
            await api.delete(`/comments/${id}`);
            setComments((prev) => prev.filter((c) => c.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <section data-testid="comments-section" className="mt-20 border-t border-border pt-12">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5" />
                <h2 className="font-heading text-2xl font-bold">
                    {t("Komentar", "Comments")} <span className="text-muted-foreground text-lg font-normal">({comments.length})</span>
                </h2>
            </div>

            {user && user !== false ? (
                <form onSubmit={submit} className="mb-8 flex gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 flex gap-2">
                        <input
                            data-testid="comment-input"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder={t("Tulis komentar…", "Write a comment…")}
                            className="flex-1 px-4 py-2.5 rounded-full border border-border bg-background text-sm outline-none focus:border-[hsl(var(--accent))] transition font-body"
                        />
                        <button
                            data-testid="comment-submit"
                            type="submit"
                            disabled={loading || !body.trim()}
                            className="px-4 rounded-full bg-foreground text-background text-sm font-semibold disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mb-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    <Link to={`/${lang}/login`} className="text-[hsl(var(--accent))] font-semibold">{t("Masuk", "Log in")}</Link>{" "}
                    {t("untuk ikut berkomentar", "to join the conversation")}
                </div>
            )}

            <ul className="space-y-6">
                {comments.map((c) => (
                    <li key={c.id} data-testid={`comment-${c.id}`} className="flex gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {c.user_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold">{c.user_name}</span>
                                <span className="text-xs text-muted-foreground">{timeAgo(c.created_at, lang)}</span>
                                {user && (user.id === c.user_id || user.role === "owner" || user.role === "editor") && (
                                    <button onClick={() => del(c.id)} className="ml-auto text-muted-foreground hover:text-destructive" data-testid={`comment-delete-${c.id}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm font-body leading-relaxed mt-1">{c.body}</p>
                        </div>
                    </li>
                ))}
                {comments.length === 0 && (
                    <li className="text-sm text-muted-foreground text-center py-8">
                        {t("Belum ada komentar. Jadi yang pertama!", "No comments yet. Be the first!")}
                    </li>
                )}
            </ul>
        </section>
    );
}
