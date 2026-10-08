import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { getTransaction } from "../api/transactions";
import type { Transaction } from "../api/types";
import { ApiError } from "../api/client";
import { Badge, ErrorBanner, Spinner } from "../components/ui";
import { formatDate, formatNumber } from "../lib/format";

export default function TransactionDetailPage() {
    const { id } = useParams();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);

        getTransaction(Number(id))
            .then(setTransaction)
            .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load transaction"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="page">
                <Spinner />
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="page">
                <ErrorBanner message={error || "Transaction not found"} />
                <Link className="link" to="/transactions">
                    Back to transactions
                </Link>
            </div>
        );
    }

    const rows: Array<[string, ReactNode]> = [
        ["Transaction ID", String(transaction.id)],
        ["Product", transaction.product_name],
        ["SKU", transaction.sku],
        ["Barcode", transaction.barcode],
        ["Flow", <Badge tone={transaction.flow === "IN" ? "in" : "out"}>{transaction.flow}</Badge>],
        ["Quantity", `${formatNumber(transaction.quantity)} ${transaction.unit_name}`],
        ["Conversion to base", formatNumber(transaction.conversion_to_base)],
        ["Base quantity", formatNumber(transaction.base_quantity)],
        ["Transaction date", formatDate(transaction.transaction_date)],
        ["Recorded at", formatDate(transaction.created_at)],
        ["Remarks", transaction.remarks ?? "—"]
    ];

    return (
        <div className="page">
            <div className="page-head">
                <h2>Transaction #{transaction.id}</h2>
                <Link className="btn btn-secondary" to="/transactions">
                    Back
                </Link>
            </div>

            <div className="detail-card">
                <dl className="detail-list">
                    {rows.map(([label, value]) => (
                        <div className="detail-row" key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <p>
                <Link className="link" to={`/products/${transaction.product_id}`}>
                    View product
                </Link>
            </p>
        </div>
    );
}
