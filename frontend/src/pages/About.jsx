import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { PageSeo } from "@/components/Seo";

const SITE_NAME = "MSNCode";

export default function About() {
    const { lang, t } = useLang();

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
            <PageSeo
                lang={lang}
                path={`/${lang}/about`}
                title={t("Tentang Kami", "About")}
                description={t(
                    "Tentang MSNCode — blog bilingual (ID + EN) untuk developer: tutorial, solusi error, karir, dan indie hacking.",
                    "About MSNCode — a bilingual (ID + EN) blog for developers: tutorials, error fixes, career, and indie hacking."
                )}
            />
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                {t("Tentang", "About")}
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight mb-6">
                {t(`Tentang ${SITE_NAME}`, `About ${SITE_NAME}`)}
            </h1>

            <div className="prose-article">
                <p>
                    {t(
                        `${SITE_NAME} adalah blog bilingual (Bahasa Indonesia & Inggris) yang dibuat untuk developer — dari yang baru mulai hingga senior. Kami menulis tutorial mendalam, solusi error dunia nyata, ulasan tools, serta cerita seputar karir dan indie hacking.`,
                        `${SITE_NAME} is a bilingual (Indonesian & English) blog built for developers — from beginners to seniors. We publish in-depth tutorials, real-world error fixes, tool reviews, and stories about career and indie hacking.`
                    )}
                </p>
                <p>
                    {t(
                        "Tujuan kami sederhana: menyajikan konten teknis yang jelas, jujur, dan bisa langsung dipakai — tanpa basa-basi. Setiap artikel tersedia dalam dua bahasa agar bisa dinikmati pembaca Indonesia maupun global.",
                        "Our goal is simple: clear, honest, immediately-usable technical content — no fluff. Every article is available in two languages so both Indonesian and global readers can enjoy it."
                    )}
                </p>

                <h2>{t("Apa yang kami tulis", "What we write about")}</h2>
                <ul>
                    <li>{t("Tutorial coding & solusi error", "Coding tutorials & error solutions")}</li>
                    <li>{t("AI, prompt engineering, & AI agents", "AI, prompt engineering, & AI agents")}</li>
                    <li>{t("Karir, interview, & finansial developer", "Career, interviews, & developer finance")}</li>
                    <li>{t("SaaS, indie hacking, blockchain & trading", "SaaS, indie hacking, blockchain & trading")}</li>
                </ul>

                <h2>{t("Ingin berkontribusi?", "Want to contribute?")}</h2>
                <p>
                    {t(
                        "Kami terbuka untuk penulis tamu. ",
                        "We welcome guest authors. "
                    )}
                    <Link to={`/${lang}/register`}>{t("Daftar di sini", "Sign up here")}</Link>
                    {t(" atau hubungi kami lewat halaman ", " or reach us via the ")}
                    <Link to={`/${lang}/contact`}>{t("Kontak", "Contact")}</Link>.
                </p>
            </div>
        </div>
    );
}
