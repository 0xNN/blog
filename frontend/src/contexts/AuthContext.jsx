import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = checking, false = logged out
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        // Skip /me check while returning from OAuth — AuthCallback will handle it
        if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            setUser(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMe(); }, [fetchMe]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        setUser(data);
        return data;
    };

    const register = async (email, password, name) => {
        const { data } = await api.post("/auth/register", { email, password, name });
        setUser(data);
        return data;
    };

    const logout = async () => {
        await api.post("/auth/logout");
        setUser(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: fetchMe }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

export function formatApiError(err) {
    const detail = err?.response?.data?.detail;
    if (!detail) return err?.message || "Something went wrong";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail.map((e) => (e?.msg ? e.msg : JSON.stringify(e))).join(" ");
    return String(detail);
}
