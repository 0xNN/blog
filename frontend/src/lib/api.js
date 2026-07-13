import axios from "axios";
import { getAuthToken } from "@/lib/supabase";

// Point to Supabase Edge Functions
const EDGE_FUNCTIONS_URL = import.meta.env.VITE_EDGE_FUNCTIONS_URL || "";
export const API_BASE = `${EDGE_FUNCTIONS_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

// ---- Attach Supabase auth token to every request ----
api.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ---- Handle 401 (token expired) by refreshing ----
api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const original = error.config;
        const status = error.response?.status;

        if (status !== 401 || !original || original._retried) {
            return Promise.reject(error);
        }

        original._retried = true;

        // Supabase auto-refreshes the token in the background,
        // so we just wait a moment and retry with the new token
        try {
            const token = await getAuthToken();
            if (token) {
                original.headers.Authorization = `Bearer ${token}`;
            }
            return api.request(original);
        } catch (refreshErr) {
            return Promise.reject(error);
        }
    }
);

export default api;

// ---------------- Affiliate helpers (unchanged) ----------------
export const getAffiliateLinks = (category) =>
    api.get(`/affiliate-links${category ? `?category=${encodeURIComponent(category)}` : ""}`)
        .then((r) => r.data);

// Same-origin path — proxied by Vercel (vercel.json) to the Supabase `redirect` function.
export const affiliateHref = (linkId, articleId) =>
    `/r/${linkId}${articleId ? `?article_id=${encodeURIComponent(articleId)}` : ""}`;
