import { useLang } from "@/contexts/LanguageContext";
import { PageSeo } from "@/components/Seo";
import NewsletterForm from "@/components/NewsletterForm";
import { Mail, Github, Twitter } from "lucide-react";

// Ganti dengan info kontak publik Anda.
const CONTACT_EMAIL = "hello@msncode.dev";
const TWITTER = "";   // mis. "sendinov" — kosongkan untuk sembunyikan
const GITHUB = "";    // mis. "sendinoviansyah"

export default function Contact() {
    const { lang, t } = useLang();

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
            <PageSeo
                lang={lang}
                path={`/${lang}/contact`}
                title={t("Kontak", "Contact")}
                description={t(
                    "Hubungi tim MSNCode — pertanyaan, kerja sama, atau menjadi penulis tamu.",
                    "Get in touch with the MSNCode team — questions, partnerships, or guest writing."
                )}
            />
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                {t("Kontak", "Contact")}
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight mb-6">
                {t("Hubungi", "Get in Touch")}
            </h1>

            <div className="prose-article">
                <p>
                    {t(
                        "Punya pertanyaan, masukan, tawaran kerja sama, atau ingin menjadi penulis tamu? Saya senang mendengar dari Anda.",
                        "Have a question, feedback, a partnership idea, or want to write for this blog? I'd love to hear from you."
                    )}
                </p>
            </div>

            <div className="mt-8 space-y-3">
                <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    data-testid="contact-email"
                    className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-[hsl(var(--accent))] transition-colors"
                >
                    <Mail className="h-5 w-5 text-[hsl(var(--accent))]" />
                    <span className="font-semibold">{CONTACT_EMAIL}</span>
                </a>
                {TWITTER && (
                    <a
                        href={`https://twitter.com/${TWITTER}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-[hsl(var(--accent))] transition-colors"
                    >
                        <Twitter className="h-5 w-5 text-[hsl(var(--accent))]" />
                        <span className="font-semibold">@{TWITTER}</span>
                    </a>
                )}
                {GITHUB && (
                    <a
                        href={`https://github.com/${GITHUB}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-[hsl(var(--accent))] transition-colors"
                    >
                        <Github className="h-5 w-5 text-[hsl(var(--accent))]" />
                        <span className="font-semibold">github.com/{GITHUB}</span>
                    </a>
                )}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
                <div className="font-heading font-bold text-lg mb-2">
                    {t("Berlangganan newsletter", "Subscribe to the newsletter")}
                </div>
                <p className="text-sm text-muted-foreground font-body mb-4">
                    {t(
                        "Cara termudah tetap terhubung — tips dev & artikel baru langsung ke inbox.",
                        "The easiest way to stay in touch — dev tips & new articles straight to your inbox."
                    )}
                </p>
                <NewsletterForm />
            </div>
        </div>
    );
}
