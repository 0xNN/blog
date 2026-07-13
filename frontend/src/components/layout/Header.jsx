import { Link, NavLink, useLocation, useNavigate, useMatch } from "react-router-dom";
import { Moon, Sun, Menu, X, Search, PenSquare, LogOut, Layout } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
    { slug: "tutorial-coding", id: "Tutorial", en: "Tutorial" },
    { slug: "ai-prompt", id: "AI & Prompt", en: "AI & Prompt" },
    { slug: "ai-agents", id: "AI Agents", en: "AI Agents" },
    { slug: "blockchain-crypto", id: "Crypto", en: "Crypto" },
    { slug: "trading", id: "Trading", en: "Trading" },
    { slug: "saas-indie", id: "SaaS", en: "SaaS" },
];

export default function Header() {
    const { theme, toggle } = useTheme();
    const { lang, setLang, t } = useLang();
    const { user, profile, logout } = useAuth();
    const canWrite = profile && ["owner", "editor", "author"].includes(profile.role);
    const [open, setOpen] = useState(false);
    const nav = useNavigate();
    const loc = useLocation();

    const langPrefix = `/${lang}`;
    const articleMatch = useMatch(`/${lang}/blog/:slug`);
    const currentArticleSlug = articleMatch?.params?.slug;

    const handleLangSwitch = async (newLang) => {
        if (newLang === lang) return;
        setLang(newLang);

        // If we're on an article page, try to map to the translated slug
        if (currentArticleSlug) {
            try {
                // Load the article (with fallback across languages) to get its ID
                const { data: article } = await api.get(
                    `/articles/${currentArticleSlug}?lang=${lang}`
                );
                const { data: siblings } = await api.get(`/articles/${article.id}/siblings`);
                const targetSlug = newLang === "id" ? siblings.id_slug : siblings.en_slug;
                if (targetSlug) {
                    nav(`/${newLang}/blog/${targetSlug}`);
                    return;
                }
            } catch {
                /* fall through to naive path swap */
            }
        }

        // Default: swap the URL prefix
        const path = loc.pathname.replace(/^\/(id|en)(\/|$)/, `/${newLang}$2`);
        nav(path || `/${newLang}`);
    };

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-6">
                    <Link
                        to={`/${lang}`}
                        data-testid="header-logo"
                        className="flex items-center gap-2 font-heading font-black text-xl tracking-tight"
                    >
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]"></span>
                        <span>devhub<span className="text-[hsl(var(--accent))]">.</span></span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
                        {CATEGORIES.map((c) => (
                            <NavLink
                                key={c.slug}
                                to={`${langPrefix}/category/${c.slug}`}
                                data-testid={`nav-cat-${c.slug}`}
                                className={({ isActive }) =>
                                    `transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
                                }
                            >
                                {lang === "id" ? c.id : c.en}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        {/* language switcher */}
                        <div className="hidden sm:flex items-center rounded-full border border-border p-0.5 text-xs font-semibold">
                            <button
                                data-testid="lang-id"
                                onClick={() => handleLangSwitch("id")}
                                className={`px-2.5 py-1 rounded-full transition ${lang === "id" ? "bg-foreground text-background" : "text-muted-foreground"}`}
                            >ID</button>
                            <button
                                data-testid="lang-en"
                                onClick={() => handleLangSwitch("en")}
                                className={`px-2.5 py-1 rounded-full transition ${lang === "en" ? "bg-foreground text-background" : "text-muted-foreground"}`}
                            >EN</button>
                        </div>

                        <button
                            data-testid="header-search"
                            onClick={() => nav(`${langPrefix}/search`)}
                            className="p-2 rounded-full hover:bg-muted transition"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <button
                            data-testid="theme-toggle"
                            onClick={toggle}
                            className="p-2 rounded-full hover:bg-muted transition"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>

                        {user && user !== false ? (
                            <>
                                <Link to={`${langPrefix}/dashboard`}>
                                    <Button
                                        data-testid="header-dashboard"
                                        variant="outline"
                                        size="sm"
                                        className="hidden sm:inline-flex rounded-full"
                                    >
                                        <Layout className="h-3.5 w-3.5 mr-1.5" />
                                        {t("Dashboard", "Dashboard")}
                                    </Button>
                                </Link>
                                {canWrite && (
                                    <Link to={`${langPrefix}/editor/new`}>
                                        <Button
                                            data-testid="header-write"
                                            size="sm"
                                            className="rounded-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white"
                                        >
                                            <PenSquare className="h-3.5 w-3.5 mr-1.5" />
                                            {t("Tulis", "Write")}
                                        </Button>
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <Link to={`${langPrefix}/login`}>
                                    <Button data-testid="header-login" variant="ghost" size="sm" className="rounded-full">
                                        {t("Masuk", "Log in")}
                                    </Button>
                                </Link>
                                <Link to={`${langPrefix}/register`} className="hidden sm:block">
                                    <Button
                                        data-testid="header-register"
                                        size="sm"
                                        className="rounded-full bg-foreground text-background hover:opacity-90"
                                    >
                                        {t("Daftar", "Sign up")}
                                    </Button>
                                </Link>
                            </>
                        )}

                        <button
                            data-testid="mobile-menu-toggle"
                            className="lg:hidden p-2 rounded-full hover:bg-muted"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {open && (
                    <nav className="lg:hidden pb-4 flex flex-col gap-2 border-t border-border pt-4">
                        {CATEGORIES.map((c) => (
                            <NavLink
                                key={c.slug}
                                to={`${langPrefix}/category/${c.slug}`}
                                onClick={() => setOpen(false)}
                                className="text-sm py-2 text-muted-foreground hover:text-foreground"
                                data-testid={`mobile-nav-${c.slug}`}
                            >
                                {lang === "id" ? c.id : c.en}
                            </NavLink>
                        ))}
                        {user && user !== false && (
                            <button
                                data-testid="mobile-logout"
                                onClick={() => { logout(); setOpen(false); }}
                                className="text-sm py-2 text-left text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" /> Logout
                            </button>
                        )}
                    </nav>
                )}
            </div>
        </header>
    );
}
