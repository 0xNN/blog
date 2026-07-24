import { Link } from "react-router-dom";
import { Rss } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import NewsletterForm from "@/components/NewsletterForm";
import BrandMark from "@/components/BrandMark";

const EXPLORE_LINKS = [
    { slug: "blog", labelId: "Semua Artikel", labelEn: "All Articles", testId: "footer-blog" },
    { slug: "category/tutorial-coding", labelId: "Tutorial", labelEn: "Tutorials" },
    { slug: "category/system-design", labelId: "System Design", labelEn: "System Design" },
    { slug: "category/ai-prompt", labelId: "AI & Prompt", labelEn: "AI & Prompt" },
    { slug: "category/ai-agents", labelId: "AI Agents", labelEn: "AI Agents" },
    { slug: "category/security-privacy", labelId: "Security", labelEn: "Security" },
    { slug: "category/saas-indie", labelId: "SaaS & Indie", labelEn: "SaaS & Indie" },
    { slug: "category/blockchain-crypto", labelId: "Crypto", labelEn: "Crypto" },
];

export default function Footer() {
    const { lang, t } = useLang();
    return (
        <footer className="border-t border-border mt-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
                    {/* Brand + newsletter — spans 2 cols on lg */}
                    <div className="lg:col-span-2 space-y-5">
                        <Link
                            to={`/${lang}`}
                            className="inline-flex items-center gap-2 font-heading font-black text-xl tracking-tight"
                        >
                            <BrandMark size={28} />
                            <span>MSN<span className="text-[hsl(var(--accent))]">Code</span></span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-sm font-body leading-relaxed">
                            {t(
                                "Blog developer Indonesia dan global. Tutorial mendalam, error fixes, karir, dan cerita indie hacker.",
                                "The developer blog for Indonesia and beyond. Deep tutorials, error fixes, career tips, and indie hacker stories."
                            )}
                        </p>
                        <div className="max-w-sm">
                            <p className="text-xs font-mono text-muted-foreground mb-2.5 uppercase tracking-wider">
                                {t("Newsletter mingguan", "Weekly newsletter")}
                            </p>
                            <NewsletterForm compact />
                        </div>
                    </div>

                    {/* Explore */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                            {t("Jelajahi", "Explore")}
                        </p>
                        <ul className="space-y-2.5 text-sm">
                            {EXPLORE_LINKS.map((link) => (
                                <li key={link.slug}>
                                    <Link
                                        to={`/${lang}/${link.slug}`}
                                        data-testid={link.testId}
                                        className="text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors duration-200"
                                    >
                                        {lang === "id" ? link.labelId : link.labelEn}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Follow + company */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                                {t("Ikuti", "Follow")}
                            </p>
                            <div className="flex items-center gap-2">
                                <a
                                    href="/rss.xml?lang=id"
                                    aria-label="RSS"
                                    data-testid="footer-rss"
                                    className="p-2 rounded-full border border-border hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition-colors duration-200"
                                >
                                    <Rss className="h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                                {t("Lainnya", "More")}
                            </p>
                            <ul className="space-y-2.5 text-sm">
                                <li>
                                    <Link to={`/${lang}/about`} data-testid="footer-about" className="text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors duration-200">
                                        {t("Tentang", "About")}
                                    </Link>
                                </li>
                                <li>
                                    <Link to={`/${lang}/contact`} data-testid="footer-contact" className="text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors duration-200">
                                        {t("Kontak", "Contact")}
                                    </Link>
                                </li>
                                <li>
                                    <Link to={`/${lang}/authors`} className="text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors duration-200">
                                        {t("Kontributor", "Contributors")}
                                    </Link>
                                </li>
                                <li>
                                    <Link to={`/${lang}/privacy`} data-testid="footer-privacy" className="text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors duration-200">
                                        {t("Privasi", "Privacy")}
                                    </Link>
                                </li>
                                <li>
                                    <Link to={`/${lang}/terms`} data-testid="footer-terms" className="text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors duration-200">
                                        {t("Ketentuan", "Terms")}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-muted-foreground">
                    <div className="font-mono">
                        &copy; {new Date().getFullYear()} MSNCode.{" "}
                        {t("Dibangun untuk developer.", "Built for developers.")}
                    </div>
                    <a href="/ads.txt" className="hover:text-foreground transition-colors duration-200 font-mono">
                        ads.txt
                    </a>
                </div>
            </div>
        </footer>
    );
}
