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
                title={t("Tentang", "About")}
                description={t(
                    "Tentang MSNCode - catatan developer Indonesia soal coding, AI, finansial, dan indie hacking. ID + EN.",
                    "About MSNCode - notes from an Indonesian developer on coding, AI, finance, and indie hacking. ID + EN."
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
                        `${SITE_NAME} adalah catatan saya - seorang developer Indonesia yang kerja remote, ngelatih model AI, dan sekalian ngurusin duit sendiri. Saya nulis apa yang saya pelajarin: tutorial coding yang gue (eh, saya) sendiri butuh, solusi error yang wasted jam saya, sampai gimana ngatur gaji USD dari perspektif developer. Ditulis dalam Bahasa Indonesia & Inggris.`,
                        `${SITE_NAME} is my notebook - an Indonesian developer working remote, training AI models, and figuring out money along the way. I write what I learn: coding tutorials I actually needed, error fixes that cost me hours, and how to manage a USD income from a developer's perspective. Written in both Indonesian and English.`
                    )}
                </p>
                <p>
                    {t(
                        "Tujuannya sederhana: konten teknis yang jujur dan langsung kepake - tanpa embel-embel 'thought leader' atau hype. Kalau saya belum ngerjain sendiri, saya gak nulis.",
                        "The goal is simple: honest, immediately-usable technical content - no 'thought leader' posturing, no hype. If I haven't done it myself, I don't write about it."
                    )}
                </p>

                <h2>{t("Yang saya tulis", "What I write about")}</h2>
                <ul>
                    <li>{t("Tutorial coding & solusi error (dari pengalaman, bukan teori)", "Coding tutorials & error solutions (from experience, not theory)")}</li>
                    <li>{t("AI, prompt engineering, & AI agents - yang gue pake beneran", "AI, prompt engineering, & AI agents - what I actually use")}</li>
                    <li>{t("Karir, interview, & finansial developer (remote USD, pajak, ETF)", "Career, interviews, & developer finance (remote USD, taxes, ETFs)")}</li>
                    <li>{t("SaaS, indie hacking, blockchain & trading (dengan angle dev)", "SaaS, indie hacking, blockchain & trading (from a dev angle)")}</li>
                </ul>

                <h2>{t("Mau nulis bareng?", "Want to write along?")}</h2>
                <p>
                    {t(
                        "Saya terbuka untuk penulis tamu yang punya pengalaman konkret - bukan rewrite AI atau konten generic. ",
                        "I'm open to guest writers with concrete experience - not AI rewrites or generic content. "
                    )}
                    <Link to={`/${lang}/register`}>{t("Daftar di sini", "Sign up here")}</Link>
                    {t(" atau hubungi saya lewat halaman ", " or reach me via the ")}
                    <Link to={`/${lang}/contact`}>{t("Kontak", "Contact")}</Link>.
                </p>
            </div>
        </div>
    );
}
