import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import type { SafeUser } from "../api/types";

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
    user: SafeUser | null;
    status: AuthStatus;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_KEY = "mis.email";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SafeUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const { userId } = await authApi.me();

                if (!active) {
                    return;
                }

                const email = localStorage.getItem(EMAIL_KEY) ?? "";
                setUser({ id: userId, email, created_at: "" });
                setStatus("authenticated");
            } catch {
                if (!active) {
                    return;
                }

                setUser(null);
                setStatus("guest");
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const current = await authApi.login({ email, password });
        localStorage.setItem(EMAIL_KEY, current.email);
        setUser(current);
        setStatus("authenticated");
    }, []);

    const register = useCallback(async (email: string, password: string) => {
        await authApi.register({ email, password });
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            // ignore network errors on logout
        }

        localStorage.removeItem(EMAIL_KEY);
        setUser(null);
        setStatus("guest");
    }, []);

    const value = useMemo(
        () => ({ user, status, login, register, logout }),
        [user, status, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
