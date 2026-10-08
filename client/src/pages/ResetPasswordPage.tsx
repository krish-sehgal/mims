import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { ApiError } from "../api/client";
import { useToast } from "../components/Toast";
import { Button, Field, Input } from "../components/ui";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { notify } = useToast();

    const token = searchParams.get("token") ?? "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (!token) {
            setError("Missing reset token. Open the link from your email.");
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await resetPassword(token, password);
            notify("Password reset — please sign in", "success");
            navigate("/login", { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to reset password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Reset password</h1>
                <p className="auth-subtitle">Choose a new password</p>

                {error ? <div className="error-banner">{error}</div> : null}

                <Field label="New password" htmlFor="password" hint="8–15 characters">
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
                    Reset password
                </Button>

                <div className="auth-links">
                    <Link to="/login">Back to sign in</Link>
                </div>
            </form>
        </div>
    );
}
