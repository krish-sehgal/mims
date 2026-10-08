import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../api/products";
import { listTransactions } from "../api/transactions";
import type {
    Pagination as PaginationType,
    Product,
    Transaction,
    TransactionFlow
} from "../api/types";
import { ApiError } from "../api/client";
import {
    Badge,
    Button,
    EmptyState,
    ErrorBanner,
    Field,
    Input,
    Pagination,
    Select,
    Spinner
} from "../components/ui";
import { formatDate, formatNumber } from "../lib/format";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PaginationType>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    });

    const [productId, setProductId] = useState("");
    const [flow, setFlow] = useState<"" | TransactionFlow>("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [applied, setApplied] = useState({ productId: "", flow: "" as "" | TransactionFlow, from: "", to: "" });
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        listProducts({ limit: 100 })
            .then((result) => setProducts(result.products))
            .catch(() => undefined);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await listTransactions({
                page,
                limit: 20,
                product_id: applied.productId ? Number(applied.productId) : undefined,
                flow: applied.flow || undefined,
                from: applied.from || undefined,
                to: applied.to ? `${applied.to}T23:59:59` : undefined
            });
            setTransactions(data.transactions);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to load transactions");
        } finally {
            setLoading(false);
        }
    }, [page, applied]);

    useEffect(() => {
        load();
    }, [load]);

    function applyFilters() {
        setPage(1);
        setApplied({ productId, flow, from, to });
    }

    function clearFilters() {
        setProductId("");
        setFlow("");
        setFrom("");
        setTo("");
        setPage(1);
        setApplied({ productId: "", flow: "", from: "", to: "" });
    }

    return (
        <div className="page">
            <div className="page-head">
                <h2>Transactions</h2>
                <Link className="btn btn-primary" to="/transactions/new">
                    Record movement
                </Link>
            </div>

            <div className="filters">
                <Field label="Product" htmlFor="filterProduct">
                    <Select
                        id="filterProduct"
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    >
                        <option value="">All products</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Flow" htmlFor="filterFlow">
                    <Select
                        id="filterFlow"
                        value={flow}
                        onChange={(event) => setFlow(event.target.value as "" | TransactionFlow)}
                    >
                        <option value="">All</option>
                        <option value="IN">IN</option>
                        <option value="OUT">OUT</option>
                    </Select>
                </Field>
                <Field label="From" htmlFor="filterFrom">
                    <Input
                        id="filterFrom"
                        type="date"
                        value={from}
                        onChange={(event) => setFrom(event.target.value)}
                    />
                </Field>
                <Field label="To" htmlFor="filterTo">
                    <Input
                        id="filterTo"
                        type="date"
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                    />
                </Field>
                <div className="filter-actions">
                    <Button variant="secondary" onClick={clearFilters}>
                        Clear
                    </Button>
                    <Button onClick={applyFilters}>Apply</Button>
                </div>
            </div>

            {error ? <ErrorBanner message={error} /> : null}

            {loading ? (
                <Spinner />
            ) : transactions.length === 0 ? (
                <EmptyState message="No transactions found." />
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Flow</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Base qty</th>
                                <th>Remarks</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>{formatDate(tx.transaction_date)}</td>
                                    <td>
                                        <Link to={`/products/${tx.product_id}`}>{tx.product_name}</Link>
                                        <div className="muted small">{tx.sku}</div>
                                    </td>
                                    <td>
                                        <Badge tone={tx.flow === "IN" ? "in" : "out"}>{tx.flow}</Badge>
                                    </td>
                                    <td>{formatNumber(tx.quantity)}</td>
                                    <td>{tx.unit_name}</td>
                                    <td>{formatNumber(tx.base_quantity)}</td>
                                    <td>{tx.remarks ?? "—"}</td>
                                    <td className="row-actions">
                                        <Link className="link" to={`/transactions/${tx.id}`}>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
        </div>
    );
}
