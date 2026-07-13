import { useLang } from "@/contexts/LanguageContext";
import { PageSeo } from "@/components/Seo";

// Ganti dengan email kontak publik Anda.
const CONTACT_EMAIL = "hello@msncode.dev";
const SITE_NAME = "Developer Hub";

function Section({ title, children }) {
    return (
        <section className="mt-10">
            <h2 className="font-heading text-2xl font-bold tracking-tight mb-3">{title}</h2>
            <div className="prose-article">{children}</div>
        </section>
    );
}

export default function PrivacyPolicy() {
    const { lang, t } = useLang();
    const updated = "2026-07-13";

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
            <PageSeo
                lang={lang}
                path={`/${lang}/privacy`}
                title={t("Kebijakan Privasi", "Privacy Policy")}
                description={t(
                    "Kebijakan privasi Developer Hub: data yang kami kumpulkan, cookies, iklan pihak ketiga, dan hak Anda.",
                    "Developer Hub privacy policy: data we collect, cookies, third-party ads, and your rights."
                )}
            />
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                {t("Legal", "Legal")}
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tight">
                {t("Kebijakan Privasi", "Privacy Policy")}
            </h1>
            <p className="text-muted-foreground font-body mt-3">
                {t("Terakhir diperbarui", "Last updated")}: {updated}
            </p>

            <Section title={t("Ringkasan", "Overview")}>
                <p>
                    {t(
                        `${SITE_NAME} menghormati privasi Anda. Halaman ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan pilihan yang Anda miliki. Dengan menggunakan situs ini Anda menyetujui praktik yang dijelaskan di sini.`,
                        `${SITE_NAME} respects your privacy. This page explains what data we collect, how we use it, and the choices you have. By using this site you agree to the practices described here.`
                    )}
                </p>
            </Section>

            <Section title={t("Data yang Kami Kumpulkan", "Data We Collect")}>
                <ul>
                    <li>{t(
                        "Akun & penulis: nama, email, dan kata sandi (di-hash) saat Anda mendaftar atau login.",
                        "Account & authors: name, email, and password (hashed) when you register or log in."
                    )}</li>
                    <li>{t(
                        "Newsletter: alamat email jika Anda berlangganan.",
                        "Newsletter: your email address if you subscribe."
                    )}</li>
                    <li>{t(
                        "Komentar: nama dan isi komentar yang Anda kirim.",
                        "Comments: your name and the content of comments you submit."
                    )}</li>
                    <li>{t(
                        "Data teknis: alamat IP dan info perangkat/browser untuk keamanan, statistik baca, dan pencegahan spam.",
                        "Technical data: IP address and device/browser info for security, read stats, and spam prevention."
                    )}</li>
                </ul>
            </Section>

            <Section title={t("Cookies", "Cookies")}>
                <p>
                    {t(
                        "Kami menggunakan cookies untuk menjaga sesi login Anda, menyimpan preferensi (tema & bahasa), serta untuk analitik dan iklan seperti dijelaskan di bawah. Anda dapat menonaktifkan cookies lewat pengaturan browser, namun sebagian fitur mungkin tidak berfungsi.",
                        "We use cookies to keep you logged in, remember preferences (theme & language), and for analytics and ads as described below. You can disable cookies in your browser settings, but some features may not work."
                    )}
                </p>
            </Section>

            <Section title={t("Iklan Pihak Ketiga (Google AdSense)", "Third-Party Advertising (Google AdSense)")}>
                <ul>
                    <li>{t(
                        "Vendor pihak ketiga, termasuk Google, menggunakan cookies untuk menayangkan iklan berdasarkan kunjungan Anda sebelumnya ke situs ini atau situs lain.",
                        "Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this or other websites."
                    )}</li>
                    <li>{t(
                        "Penggunaan cookie iklan oleh Google memungkinkan Google dan mitranya menayangkan iklan kepada Anda berdasarkan kunjungan Anda ke situs kami dan/atau situs lain di internet.",
                        "Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to our site and/or other sites on the internet."
                    )}</li>
                    <li>{t(
                        "Anda dapat menonaktifkan iklan yang dipersonalisasi melalui Setelan Iklan Google di https://www.google.com/settings/ads, atau untuk vendor pihak ketiga lain melalui https://www.aboutads.info/choices.",
                        "You may opt out of personalized advertising via Google Ads Settings at https://www.google.com/settings/ads, or for other third-party vendors via https://www.aboutads.info/choices."
                    )}</li>
                </ul>
            </Section>

            <Section title={t("Link Afiliasi", "Affiliate Links")}>
                <p>
                    {t(
                        "Sebagian artikel memuat link afiliasi. Jika Anda membeli melalui link tersebut, kami mungkin mendapat komisi tanpa biaya tambahan bagi Anda. Kami hanya merekomendasikan produk yang kami anggap relevan.",
                        "Some articles contain affiliate links. If you buy through them, we may earn a commission at no extra cost to you. We only recommend products we consider relevant."
                    )}
                </p>
            </Section>

            <Section title={t("Analitik", "Analytics")}>
                <p>
                    {t(
                        "Kami menggunakan analitik (mis. PostHog) untuk memahami cara pengunjung menggunakan situs secara agregat. Data ini membantu kami memperbaiki konten dan pengalaman pengguna.",
                        "We use analytics (e.g. PostHog) to understand how visitors use the site in aggregate. This helps us improve content and user experience."
                    )}
                </p>
            </Section>

            <Section title={t("Layanan Pihak Ketiga", "Third-Party Services")}>
                <ul>
                    <li>{t("Google AdSense — iklan", "Google AdSense — advertising")}</li>
                    <li>{t("PostHog — analitik produk", "PostHog — product analytics")}</li>
                    <li>{t("Resend — pengiriman email newsletter", "Resend — newsletter email delivery")}</li>
                    <li>{t("Google — login opsional (OAuth)", "Google — optional sign-in (OAuth)")}</li>
                </ul>
            </Section>

            <Section title={t("Hak Anda", "Your Rights")}>
                <p>
                    {t(
                        "Anda berhak meminta akses, koreksi, atau penghapusan data pribadi Anda, serta berhenti berlangganan newsletter kapan saja. Hubungi kami untuk permintaan tersebut.",
                        "You may request access, correction, or deletion of your personal data, and unsubscribe from the newsletter at any time. Contact us for such requests."
                    )}
                </p>
            </Section>

            <Section title={t("Perubahan Kebijakan", "Changes to This Policy")}>
                <p>
                    {t(
                        "Kami dapat memperbarui kebijakan ini sewaktu-waktu. Tanggal 'Terakhir diperbarui' di atas menunjukkan revisi terbaru.",
                        "We may update this policy from time to time. The 'Last updated' date above reflects the latest revision."
                    )}
                </p>
            </Section>

            <Section title={t("Kontak", "Contact")}>
                <p>
                    {t(
                        "Pertanyaan tentang kebijakan ini? Email kami di ",
                        "Questions about this policy? Email us at "
                    )}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
            </Section>
        </div>
    );
}
