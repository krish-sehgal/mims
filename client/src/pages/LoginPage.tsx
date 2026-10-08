import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { Button, Field, Input } from "../components/ui";
import { ApiError } from "../api/client";

export default function LoginPage() {
    const { login } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email.trim(), password);
            notify("Welcome back!", "success");
            const from = (location.state as { from?: string } | null)?.from ?? "/";
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to log in");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>StockFlow</h1>
                <p className="auth-subtitle">Sign in to manage your inventory</p>

                {error ? <div className="error-banner">{error}</div> : null}

                <Field label="Email" htmlFor="email">
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </Field>

                <Field label="Password" htmlFor="password">
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={8}
                        maxLength={15}
                        required
                    />
                </Field>

                <Button type="submit" loading={loading}>
                    Sign in
                </Button>

                <div className="auth-links">
                    <Link to="/forgot-password">Forgot password?</Link>
                    <Link to="/register">Create an account</Link>
                </div>
            </form>
        </div>
    );
}
