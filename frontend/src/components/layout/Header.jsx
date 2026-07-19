import { Link, NavLink, useLocation, useNavigate, useMatch } from "react-router-dom";
import { Moon, Sun, Menu, X, Search, PenSquare, LogOut, Layout } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import BrandMark from "@/components/BrandMark";

// Primary categories shown inline in the desktop navbar (quick access).
const PRIMARY_CATS = [
    { slug: "tutorial-coding", id: "Tutorial", en: "Tutorial" },
    { slug: "ai-prompt", id: "AI & Prompt", en: "AI & Prompt" },
    { slug: "ai-agents", id: "AI Agents", en: "AI Agents" },
    { slug: "blockchain-crypto", id: "Crypto", en: "Crypto" },
    { slug: "trading", id: "Trading", en: "Trading" },
    { slug: "saas-indie", id: "SaaS", en: "SaaS" },
];

// Remaining categories, grouped, surfaced via the "More" dropdown.
const MORE_GROUPS = [
    {
        label_id: "Engineering", label_en: "Engineering",
        items: [
            { slug: "error-solutions", id: "Fix Error", en: "Error Fixes" },
            { slug: "system-design", id: "System Design", en: "System Design" },
            { slug: "database-data", id: "Database", en: "Database" },
            { slug: "devops-infra", id: "DevOps", en: "DevOps" },
            { slug: "testing-quality", id: "Testing", en: "Testing" },
            { slug: "security-privacy", id: "Security", en: "Security" },
            { slug: "dev-workflow", id: "Workflow", en: "Workflow" },
        ],
    },
    {
        label_id: "Tools", label_en: "Tools",
        items: [
            { slug: "tools-review", id: "Review Tools", en: "Tools Review" },
            { slug: "nocode-lowcode", id: "No-Code", en: "No-Code" },
        ],
    },
    {
        label_id: "Karir", label_en: "Career",
        items: [
            { slug: "career-interview", id: "Karir & Interview", en: "Career" },
            { slug: "developer-finance", id: "Finansial Dev", en: "Dev Finance" },
            { slug: "learning-mindset", id: "Mindset", en: "Mindset" },
        ],
    },
];

// Flattened full list for the mobile menu.
const ALL_CATS = [...PRIMARY_CATS, ...MORE_GROUPS.flatMap((g) => g.items)];

export default function Header() {
    const { theme, toggle } = useTheme();
    const { lang, setLang, t } = useLang();
    const { user, profile, logout } = useAuth();
    const canWrite = profile && ["owner", "editor", "author"].includes(profile.role);
    const [open, setOpen] = useState(false);
    const nav = useNavigate();
    const loc = useLocation();

    const [scrolled, setScrolled] = useState(false);
    const rafRef = useRef(null);

    useEffect(() => {
        const onScroll = () => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                setScrolled(window.scrollY > 8);
                rafRef.current = null;
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const langPrefix = `/${lang}`;
    const articleMatch = useMatch(`/${lang}/blog/:slug`);
    const currentArticleSlug = articleMatch?.params?.slug;

    const handleLangSwitch = useCallback(async (newLang) => {
        if (newLang === lang) return;
        setLang(newLang);

        if (currentArticleSlug) {
            try {
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
                /* fall through */
            }
        }

        const path = loc.pathname.replace(/^\/(id|en)(\/|$)/, `/${newLang}$2`);
        nav(path || `/${newLang}`);
    }, [lang, currentArticleSlug, loc.pathname, nav, setLang]);

    return (
        <header className={`sticky top-0 z-40 border-b border-border backdrop-blur-xl transition-all duration-300 ${scrolled ? "bg-background/92 shadow-elev" : "bg-background/70"}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-6">
                    <Link
                        to={`/${lang}`}
                        data-testid="header-logo"
                        className="flex items-center gap-2 font-heading font-black text-xl tracking-tight shrink-0"
                    >
                        <BrandMark size={26} />
                        <span>MSN<span className="text-[hsl(var(--accent))]">Code</span></span>
                        <span className="hidden sm:inline font-mono text-[0.6rem] tracking-[0.12em] text-muted-foreground leading-none ml-0.5">BLOG</span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
                        {PRIMARY_CATS.map((c) => (
                            <NavLink
                                key={c.slug}
                                to={`${langPrefix}/category/${c.slug}`}
                                data-testid={`nav-cat-${c.slug}`}
                                className={({ isActive }) =>
                                    `link-underline transition-colors duration-200 ${isActive ? "text-foreground link-active" : "text-muted-foreground hover:text-foreground"}`
                                }
                            >
                                {lang === "id" ? c.id : c.en}
                            </NavLink>
                        ))}
                        <NavigationMenu className="relative">
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger
                                        data-testid="nav-more-trigger"
                                        className="h-auto rounded-md bg-transparent px-2.5 py-1 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground data-[state=open]:hover:bg-transparent data-[state=open]:hover:text-foreground data-[state=open]:focus:bg-transparent"
                                    >
                                        {t("Lainnya", "More")}
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="grid w-[520px] gap-x-8 gap-y-1 p-4 md:grid-cols-3">
                                            {MORE_GROUPS.map((group) => (
                                                <div key={group.label_en}>
                                                    <div className="eyebrow !text-[0.6rem] !tracking-[0.18em] mb-2">
                                                        {lang === "id" ? group.label_id : group.label_en}
                                                    </div>
                                                    <ul className="space-y-0.5">
                                                        {group.items.map((c) => (
                                                            <li key={c.slug}>
                                                                <NavigationMenuLink asChild>
                                                                    <Link
                                                                        to={`${langPrefix}/category/${c.slug}`}
                                                                        data-testid={`nav-cat-${c.slug}`}
                                                                        className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                                                    >
                                                                        {lang === "id" ? c.id : c.en}
                                                                    </Link>
                                                                </NavigationMenuLink>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </nav>

                    <div className="flex items-center gap-1.5">
                        {/* Language switcher */}
                        <div className="hidden sm:flex items-center rounded-full border border-border p-0.5 text-xs font-semibold">
                            <button
                                data-testid="lang-id"
                                onClick={() => handleLangSwitch("id")}
                                className={`px-2.5 py-1 rounded-full transition-colors duration-200 ${lang === "id" ? "bg-[hsl(var(--accent))] text-white" : "text-muted-foreground hover:text-foreground"}`}
                            >ID</button>
                            <button
                                data-testid="lang-en"
                                onClick={() => handleLangSwitch("en")}
                                className={`px-2.5 py-1 rounded-full transition-colors duration-200 ${lang === "en" ? "bg-[hsl(var(--accent))] text-white" : "text-muted-foreground hover:text-foreground"}`}
                            >EN</button>
                        </div>

                        <button
                            data-testid="header-search"
                            onClick={() => nav(`${langPrefix}/search`)}
                            className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <button
                            data-testid="theme-toggle"
                            onClick={toggle}
                            className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
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
                                    >
                                        {t("Daftar", "Sign up")}
                                    </Button>
                                </Link>
                            </>
                        )}

                        <button
                            data-testid="mobile-menu-toggle"
                            className="lg:hidden p-2 rounded-full hover:bg-muted transition-colors duration-200"
                            onClick={() => setOpen(!open)}
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                        >
                            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {open && (
                    <nav className="lg:hidden pb-4 flex flex-col border-t border-border pt-3 animate-fade-in">
                        {/* Language switcher for mobile */}
                        <div className="flex items-center gap-2 px-1 py-2 mb-1">
                            <span className="text-xs text-muted-foreground font-mono">{t("Bahasa:", "Language:")}</span>
                            <button
                                onClick={() => { handleLangSwitch("id"); setOpen(false); }}
                                className={`text-xs px-2.5 py-1 rounded-full border border-border transition-colors duration-200 ${lang === "id" ? "bg-[hsl(var(--accent))] text-white border-transparent" : "text-muted-foreground"}`}
                            >ID</button>
                            <button
                                onClick={() => { handleLangSwitch("en"); setOpen(false); }}
                                className={`text-xs px-2.5 py-1 rounded-full border border-border transition-colors duration-200 ${lang === "en" ? "bg-[hsl(var(--accent))] text-white border-transparent" : "text-muted-foreground"}`}
                            >EN</button>
                        </div>
                        {PRIMARY_CATS.map((c) => (
                            <NavLink
                                key={c.slug}
                                to={`${langPrefix}/category/${c.slug}`}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `text-sm py-2.5 px-1 border-b border-border last:border-0 transition-colors duration-200 ${isActive ? "text-[hsl(var(--accent))] font-semibold" : "text-muted-foreground hover:text-foreground"}`
                                }
                                data-testid={`mobile-nav-${c.slug}`}
                            >
                                {lang === "id" ? c.id : c.en}
                            </NavLink>
                        ))}
                        {MORE_GROUPS.map((group) => (
                            <div key={group.label_en} className="py-1">
                                <div className="eyebrow !text-[0.6rem] !tracking-[0.18em] px-1 pt-2 pb-1">
                                    {lang === "id" ? group.label_id : group.label_en}
                                </div>
                                {group.items.map((c) => (
                                    <NavLink
                                        key={c.slug}
                                        to={`${langPrefix}/category/${c.slug}`}
                                        onClick={() => setOpen(false)}
                                        className={({ isActive }) =>
                                            `text-sm py-2.5 px-3 border-b border-border last:border-0 transition-colors duration-200 ${isActive ? "text-[hsl(var(--accent))] font-semibold" : "text-muted-foreground hover:text-foreground"}`
                                        }
                                        data-testid={`mobile-nav-${c.slug}`}
                                    >
                                        {lang === "id" ? c.id : c.en}
                                    </NavLink>
                                ))}
                            </div>
                        ))}
                        {user && user !== false && (
                            <button
                                data-testid="mobile-logout"
                                onClick={() => { logout(); setOpen(false); }}
                                className="text-sm py-2.5 px-1 text-left text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors duration-200"
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
