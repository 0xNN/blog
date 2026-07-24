import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { PageSeo } from "@/components/Seo";

export default function NotFound() {
    const { lang, t } = useLang();
    return (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
            <PageSeo
                lang={lang}
                path={`/${lang}/404`}
                title={t("Halaman tidak ditemukan", "Page not found")}
                description={t("Halaman yang Anda cari tidak tersedia.", "The page you requested is unavailable.")}
                noIndex
            />
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Error 404</div>
            <h1 className="font-heading text-5xl sm:text-7xl font-black tracking-tight mb-6">
                {t("Halaman tidak ditemukan", "Page not found")}
            </h1>
            <p className="font-body text-lg text-muted-foreground mb-8">
                {t("Sepertinya kamu tersesat di antara baris kode.", "Looks like you got lost between the lines of code.")}
            </p>
            <Link to={`/${lang}`} className="inline-flex rounded-full bg-[hsl(var(--accent))] text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition">
                {t("Kembali ke beranda", "Back to home")}
            </Link>
        </div>
    );
}
