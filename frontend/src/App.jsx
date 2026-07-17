import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider, useLang } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import Home from "@/pages/Home";
import ArticleList from "@/pages/ArticleList";
import ArticleDetail from "@/pages/ArticleDetail";
import AuthorPage from "@/pages/AuthorPage";
import AuthorsPage from "@/pages/AuthorsPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import EditorPage from "@/pages/EditorPage";
import AcceptInvite from "@/pages/AcceptInvite";
import AuthCallback from "@/pages/AuthCallback";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NotFound from "@/pages/NotFound";

import "@/index.css";

// Remount EditorPage whenever :id changes (e.g. /editor/abc -> /editor/new) so
// all form state & refs reset. Without this, React reuses the instance and the
// previous article's content lingers into a "new" article.
function EditorRoute() {
    const { id } = useParams();
    return <EditorPage key={id} />;
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);
    return null;
}

function AppShell() {
    return (
        <>
            <div className="noise-overlay" />
            <ScrollToTop />
            <Header />
            <main className="min-h-[70vh] relative z-10">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="blog" element={<ArticleList />} />
                    <Route path="blog/:slug" element={<ArticleDetail />} />
                    <Route path="category/:category" element={<ArticleList />} />
                    <Route path="search" element={<ArticleList />} />
                    <Route path="author/:slug" element={<AuthorPage />} />
                    <Route path="authors" element={<AuthorsPage />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="editor/:id" element={<EditorRoute />} />
                    <Route path="invite/:token" element={<AcceptInvite />} />
                    <Route path="auth/callback" element={<AuthCallback />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
            <ScrollToTopButton />
        </>
    );
}

function LangGate() {
    const location = useLocation();
    const { setLang } = useLang();
    useEffect(() => {
        const seg = location.pathname.split("/")[1];
        if (seg === "id" || seg === "en") setLang(seg);
    }, [location.pathname, setLang]);
    return <AppShell />;
}

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Navigate to="/id" replace />} />
                            <Route path="/id/*" element={<LangGate />} />
                            <Route path="/en/*" element={<LangGate />} />
                            <Route path="*" element={<Navigate to="/id" replace />} />
                        </Routes>
                    </BrowserRouter>
                    <Toaster />
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
