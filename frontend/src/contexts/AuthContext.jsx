import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null=checking, object=logged in, false=logged out
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId) => {
        try {
            const res = await import("@/lib/api").then(m => m.default.get("/users/me/profile"));
            if (res.data) setProfile(res.data);
        } catch {
            // Profile fetch is best-effort
        }
    }, []);

    useEffect(() => {
        // Check current session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(false);
            }
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    if (event === "SIGNED_IN") {
                        fetchProfile(session.user.id);
                    }
                } else {
                    setUser(false);
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription?.unsubscribe();
    }, [fetchProfile]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        if (data?.user) {
            setUser(data.user);
            fetchProfile(data.user.id);
        }
        return data.user;
    };

    const register = async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, slug: name?.toLowerCase().replace(/\s+/g, "-") },
            },
        });
        if (error) throw error;
        if (data?.user) {
            setUser(data.user);
            fetchProfile(data.user.id);
        }
        return data.user;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(false);
        setProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                login,
                register,
                logout,
                refresh: () => fetchProfile(user?.id),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

export function formatApiError(err) {
    // Supabase Auth error
    if (err?.message && err?.status) return err.message;
    if (err?.error_description) return err.error_description;
    // FastAPI-style error (Edge Functions)
    const detail = err?.response?.data?.error || err?.response?.data?.detail;
    if (detail) return typeof detail === "string" ? detail : String(detail);
    return err?.message || "Something went wrong";
}
