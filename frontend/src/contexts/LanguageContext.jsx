import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        if (typeof window === "undefined") return "id";
        return localStorage.getItem("msncode-lang") || "id";
    });

    useEffect(() => {
        localStorage.setItem("msncode-lang", lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const t = (id, en) => (lang === "id" ? id : en);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLang = () => useContext(LanguageContext);
