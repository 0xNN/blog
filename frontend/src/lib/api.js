import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

// ---- Refresh-on-401 interceptor ----
// If any request returns 401, try /auth/refresh once, then replay the original.
// Multiple concurrent 401s share a single in-flight refresh promise.
let refreshInFlight = null;

const AUTH_SKIP_PATHS = [
    "/auth/login",
    "/auth/register",
    "/auth/logout",
    "/auth/refresh",
    "/auth/emergent/session",
];

function isAuthPath(url = "") {
    return AUTH_SKIP_PATHS.some((p) => url.includes(p));
}

api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const original = error.config;
        const status = error.response?.status;

        if (
            status !== 401 ||
            !original ||
            original._retried ||
            isAuthPath(original.url || "")
        ) {
            return Promise.reject(error);
        }

        original._retried = true;

        try {
            if (!refreshInFlight) {
                refreshInFlight = axios
                    .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
                    .finally(() => { refreshInFlight = null; });
            }
            await refreshInFlight;
        } catch (refreshErr) {
            return Promise.reject(error);
        }

        return api.request(original);
    }
);

export default api;
