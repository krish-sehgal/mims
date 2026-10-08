import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes
} from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    loading?: boolean;
}

export function Button({
    variant = "primary",
    loading = false,
    disabled,
    children,
    className,
    ...rest
}: ButtonProps) {
    return (
        <button
            className={`btn btn-${variant}${className ? ` ${className}` : ""}`}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? "Working…" : children}
        </button>
    );
}

interface FieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
    return (
        <div className="field">
            <label htmlFor={htmlFor}>{label}</label>
            {children}
            {hint && !error ? <small className="field-hint">{hint}</small> : null}
            {error ? <small className="field-error">{error}</small> : null}
        </div>
    );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input className="input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select className="input" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className="input" {...props} />;
}

export function Spinner() {
    return <div className="spinner" role="status" aria-label="loading" />;
}

export function EmptyState({ message }: { message: string }) {
    return <div className="empty-state">{message}</div>;
}

export function ErrorBanner({ message }: { message: string }) {
    return <div className="error-banner">{message}</div>;
}

interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="pagination">
            <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
                Prev
            </Button>
            <span>
                Page {page} of {totalPages}
            </span>
            <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
            >
                Next
            </Button>
        </div>
    );
}

type BadgeTone = "in" | "out" | "muted" | "success" | "warn";

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
    return <span className={`badge badge-${tone}`}>{children}</span>;
}

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-head">
                    <h3>{title}</h3>
                    <button className="icon-btn" type="button" onClick={onClose} aria-label="close">
                        ×
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    loading = false,
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    return (
        <Modal title={title} onClose={onCancel}>
            <p className="confirm-message">{message}</p>
            <div className="modal-actions">
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm} loading={loading}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
