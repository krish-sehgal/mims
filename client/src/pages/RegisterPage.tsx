import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { Button, Field, Input } from "../components/ui";
import { ApiError } from "../api/client";

export default function RegisterPage() {
    const { register } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await register(email.trim(), password);
            notify("Account created — please sign in", "success");
            navigate("/login", { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to register");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Create account</h1>
                <p className="auth-subtitle">Start tracking your stock</p>

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

                <Field label="Password" htmlFor="password" hint="8–15 characters">
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={8}
                        maxLength={15}
                        required
                    />
                </Field>

                <Field label="Confirm password" htmlFor="confirm">
                    <Input
                        id="confirm"
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        minLength={8}
                        maxLength={15}
                        required
                    />
                </Field>

                <Button type="submit" loading={loading}>
                    Create account
                </Button>

                <div className="auth-links">
                    <Link to="/login">Already have an account? Sign in</Link>
                </div>
            </form>
        </div>
    );
}
