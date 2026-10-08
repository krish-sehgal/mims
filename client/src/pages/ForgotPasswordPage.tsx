import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { ApiError } from "../api/client";
import { Button, Field, Input } from "../components/ui";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [resetLink, setResetLink] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");
        setMessage("");
        setResetLink(null);
        setLoading(true);

        try {
            const data = await forgotPassword(email.trim());
            setMessage("If an account with that email exists, a reset link has been sent.");
            setResetLink(data?.resetLink ?? null);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to process request");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Forgot password</h1>
                <p className="auth-subtitle">We'll send you a reset link</p>

                {error ? <div className="error-banner">{error}</div> : null}

                {message ? (
                    <div className="info-banner">
                        {message}
                        {resetLink ? (
                            <div className="reset-link">
                                <a href={resetLink}>Open reset link</a>
                            </div>
                        ) : null}
                    </div>
                ) : null}

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

                <Button type="submit" loading={loading}>
                    Send reset link
                </Button>

                <div className="auth-links">
                    <Link to="/login">Back to sign in</Link>
                </div>
            </form>
        </div>
    );
}
