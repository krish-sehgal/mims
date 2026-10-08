import { apiRequest } from "./client";
import type { SafeUser } from "./types";

export interface Credentials {
    email: string;
    password: string;
}

export function login(credentials: Credentials) {
    return apiRequest<SafeUser>("/auth/login", { method: "POST", body: credentials });
}

export function register(credentials: Credentials) {
    return apiRequest<unknown>("/auth/register", { method: "POST", body: credentials });
}

export function logout() {
    return apiRequest<null>("/auth/logout", { method: "POST" });
}

export function me() {
    return apiRequest<{ userId: number }>("/auth/me");
}

export function forgotPassword(email: string) {
    return apiRequest<{ resetLink?: string } | null>("/auth/forgot-password", {
        method: "POST",
        body: { email }
    });
}

export function resetPassword(token: string, password: string) {
    return apiRequest<null>("/auth/reset-password", {
        method: "POST",
        body: { token, password }
    });
}
