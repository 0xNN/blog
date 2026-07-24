import { useLang } from "@/contexts/LanguageContext";
import { PageSeo } from "@/components/Seo";

const CONTACT_EMAIL = "hello@msncode.dev";

function Section({ title, children }) {
    return (
        <section className="mt-10">
            <h2 className="font-heading text-2xl font-bold tracking-tight mb-3">{title}</h2>
            <div className="prose-article">{children}</div>
        </section>
    );
}

export default function TermsOfUse() {
    const { lang, t } = useLang();
    const updated = "2026-07-24";

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
            <PageSeo
                lang={lang}
                path={`/${lang}/terms`}
                title={t("Ketentuan Penggunaan", "Terms of Use")}
                description={t(
                    "Ketentuan penggunaan MSNCode untuk konten, akun, komentar, tautan eksternal, iklan, dan afiliasi.",
                    "MSNCode terms covering content, accounts, comments, external links, advertising, and affiliates."
                )}
            />

            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                {t("Legal", "Legal")}
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight">
                {t("Ketentuan Penggunaan", "Terms of Use")}
            </h1>
            <p className="text-muted-foreground font-body mt-3">
                {t("Terakhir diperbarui", "Last updated")}: {updated}
            </p>

            <Section title={t("Penggunaan Situs", "Using This Site")}>
                <p>{t(
                    "MSNCode menyediakan artikel, snippet, dan referensi untuk tujuan informasi dan pembelajaran. Anda boleh membaca, membagikan tautan, dan mengutip bagian singkat dengan atribusi serta tautan ke halaman sumber.",
                    "MSNCode provides articles, snippets, and references for information and learning. You may read, share links, and quote short portions with attribution and a link to the source page."
                )}</p>
            </Section>

            <Section title={t("Akurasi dan Tanggung Jawab", "Accuracy and Responsibility")}>
                <p>{t(
                    "Kami berusaha menjaga konten tetap akurat, tetapi teknologi berubah dan kesalahan dapat terjadi. Uji kode di lingkungan aman dan lakukan penilaian sendiri sebelum menerapkan informasi pada sistem production, keamanan, hukum, pajak, investasi, atau keputusan penting lainnya.",
                    "We work to keep content accurate, but technology changes and mistakes can happen. Test code in a safe environment and use your own judgment before applying information to production systems, security, legal, tax, investment, or other important decisions."
                )}</p>
            </Section>

            <Section title={t("Akun dan Kontribusi", "Accounts and Contributions")}>
                <p>{t(
                    "Jika Anda membuat akun atau mengirim kontribusi, Anda bertanggung jawab atas keamanan akun dan memastikan materi tersebut milik Anda atau dapat digunakan secara sah. Kami dapat menghapus spam, plagiarisme, konten berbahaya, atau kontribusi yang melanggar hak pihak lain.",
                    "If you create an account or submit a contribution, you are responsible for account security and for ensuring the material is yours or may lawfully be used. We may remove spam, plagiarism, harmful content, or contributions that violate another party's rights."
                )}</p>
            </Section>

            <Section title={t("Komentar dan Perilaku", "Comments and Conduct")}>
                <p>{t(
                    "Jangan mengirim ujaran kebencian, pelecehan, malware, data pribadi orang lain, promosi menyesatkan, atau tautan spam. Kami dapat memoderasi atau menghapus komentar untuk menjaga diskusi tetap aman dan relevan.",
                    "Do not submit hate speech, harassment, malware, another person's private data, misleading promotions, or spam links. We may moderate or remove comments to keep discussion safe and relevant."
                )}</p>
            </Section>

            <Section title={t("Tautan, Iklan, dan Afiliasi", "Links, Ads, and Affiliates")}>
                <p>{t(
                    "Situs dapat memuat tautan pihak ketiga, iklan, dan tautan afiliasi. Kami dapat menerima komisi tanpa menambah biaya Anda. Kehadiran tautan atau iklan tidak berarti kami mengendalikan atau menjamin layanan pihak ketiga tersebut.",
                    "The site may contain third-party links, advertisements, and affiliate links. We may receive a commission at no extra cost to you. A link or advertisement does not mean we control or guarantee that third-party service."
                )}</p>
            </Section>

            <Section title={t("Perubahan dan Kontak", "Changes and Contact")}>
                <p>
                    {t(
                        "Kami dapat memperbarui ketentuan ini ketika situs atau kewajiban kami berubah. Pertanyaan dapat dikirim ke ",
                        "We may update these terms as the site or our obligations change. Questions may be sent to "
                    )}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
            </Section>
        </div>
    );
}
