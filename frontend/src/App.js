import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider, useLang } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
import NotFound from "@/pages/NotFound";

import "@/index.css";

function AppShell() {
    return (
        <>
            <div className="noise-overlay" />
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
                    <Route path="editor/:id" element={<EditorPage />} />
                    <Route path="invite/:token" element={<AcceptInvite />} />
                    <Route path="auth/callback" element={<AuthCallback />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
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
