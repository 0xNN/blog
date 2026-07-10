import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";

export default function AuthorsPage() {
    const { lang, t } = useLang();
    const [authors, setAuthors] = useState([]);

    useEffect(() => {
        api.get("/authors").then((r) => setAuthors(r.data)).catch(() => {});
    }, []);

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">{t("Tim", "Team")}</div>
                <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight">{t("Kontributor", "Contributors")}</h1>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {authors.map((a) => (
                    <Link key={a.id} to={`/${lang}/author/${a.slug}`} data-testid={`author-card-${a.slug}`} className="card-lift rounded-2xl border border-border p-6 bg-card">
                        <div className="flex items-center gap-3 mb-3">
                            {a.avatar_url ? (
                                <img src={a.avatar_url} alt={a.name} className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold">{a.name[0]}</div>
                            )}
                            <div>
                                <div className="font-heading font-bold">{a.name}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">{a.role}</div>
                            </div>
                        </div>
                        {a.bio && <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-3">{a.bio}</p>}
                    </Link>
                ))}
            </div>
        </div>
    );
}
