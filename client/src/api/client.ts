const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

const NO_REFRESH_PATHS = [
    "/auth/refresh",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/logout"
];

export type QueryValue = string | number | boolean | null | undefined;

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include"
        })
            .then((res) => res.ok)
            .catch(() => false)
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

export interface RequestOptions {
    method?: string;
    body?: unknown;
    query?: Record<string, QueryValue>;
    retry?: boolean;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(`${API_URL}${path}`);

    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, String(value));
            }
        }
    }

    return url.toString();
}

function shouldAttemptRefresh(path: string): boolean {
    return !NO_REFRESH_PATHS.some((prefix) => path.startsWith(prefix));
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query, retry = true } = options;

    const headers: Record<string, string> = {};
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(buildUrl(path, query), {
        method,
        credentials: "include",
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let payload: { success?: boolean; message?: string; data?: unknown } | null = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = null;
        }
    }

    if (response.status === 401 && retry && shouldAttemptRefresh(path)) {
        const refreshed = await refreshSession();

        if (refreshed) {
            return apiRequest<T>(path, { ...options, retry: false });
        }
    }

    if (!response.ok || payload?.success === false) {
        const message = payload?.message ?? `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status);
    }

    return (payload?.data ?? null) as T;
}
