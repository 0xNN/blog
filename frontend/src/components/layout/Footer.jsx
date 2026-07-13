import { Link } from "react-router-dom";
import { Github, Twitter, Rss } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
    const { lang, t } = useLang();
    return (
        <footer className="border-t border-border mt-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 font-heading font-black text-xl">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]"></span>
                            devhub<span className="text-[hsl(var(--accent))]">.</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm font-body leading-relaxed">
                            {t(
                                "Blog serba-ada untuk developer Indonesia & global. Tutorial, error fixes, karir, dan indie hacker journey.",
                                "The all-in-one blog for Indonesian & global developers. Tutorials, error fixes, career, and indie hacker journeys."
                            )}
                        </p>
                        <div className="max-w-sm">
                            <NewsletterForm compact />
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                            {t("Jelajahi", "Explore")}
                        </div>
                        <ul className="space-y-2 text-sm">
                            <li><Link to={`/${lang}/blog`} className="hover:text-[hsl(var(--accent))]" data-testid="footer-blog">{t("Semua Artikel", "All Articles")}</Link></li>
                            <li><Link to={`/${lang}/category/ai-prompt`} className="hover:text-[hsl(var(--accent))]">AI & Prompt</Link></li>
                            <li><Link to={`/${lang}/category/tutorial-coding`} className="hover:text-[hsl(var(--accent))]">{t("Tutorial", "Tutorials")}</Link></li>
                            <li><Link to={`/${lang}/category/saas-indie`} className="hover:text-[hsl(var(--accent))]">SaaS</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                            {t("Ikuti", "Follow")}
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="#" aria-label="Twitter" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]" data-testid="footer-twitter">
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="#" aria-label="Github" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]" data-testid="footer-github">
                                <Github className="h-4 w-4" />
                            </a>
                            <a href="/rss.xml?lang=id" aria-label="RSS" className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))]" data-testid="footer-rss">
                                <Rss className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
                    <div>© {new Date().getFullYear()} Developer Hub. {t("Dibangun untuk developer.", "Built for developers.")}</div>
                    <div className="flex flex-wrap gap-4">
                        <Link to={`/${lang}/about`} className="hover:text-foreground" data-testid="footer-about">{t("Tentang", "About")}</Link>
                        <Link to={`/${lang}/contact`} className="hover:text-foreground" data-testid="footer-contact">{t("Kontak", "Contact")}</Link>
                        <Link to={`/${lang}/privacy`} className="hover:text-foreground" data-testid="footer-privacy">{t("Privasi", "Privacy")}</Link>
                        <Link to={`/${lang}/authors`} className="hover:text-foreground">{t("Kontributor", "Contributors")}</Link>
                        <a href="/ads.txt" className="hover:text-foreground">ads.txt</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
