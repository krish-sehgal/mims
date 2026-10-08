import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../api/products";
import { listTransactions } from "../api/transactions";
import { listUnits } from "../api/units";
import type { Product, Transaction } from "../api/types";
import { ApiError } from "../api/client";
import { Badge, EmptyState, ErrorBanner, Spinner } from "../components/ui";
import { formatDate, formatNumber } from "../lib/format";

export default function DashboardPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [unitCount, setUnitCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        setError("");

        Promise.all([
            listProducts({ limit: 100 }),
            listTransactions({ limit: 5 }),
            listUnits()
        ])
            .then(([productData, transactionData, unitData]) => {
                setProducts(productData.products);
                setTransactions(transactionData.transactions);
                setUnitCount(unitData.units.filter((unit) => unit.active === 1).length);
            })
            .catch((err) =>
                setError(err instanceof ApiError ? err.message : "Failed to load dashboard")
            )
            .finally(() => setLoading(false));
    }, []);

    const lowStock = products.filter(
        (product) => Number(product.quantity) <= Number(product.min_quantity)
    );

    if (loading) {
        return (
            <div className="page">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-head">
                <h2>Dashboard</h2>
            </div>

            {error ? <ErrorBanner message={error} /> : null}

            <div className="stat-grid">
                <div className="stat-card">
                    <span className="stat-label">Products</span>
                    <span className="stat-value">{products.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Low stock</span>
                    <span className="stat-value">{lowStock.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Active units</span>
                    <span className="stat-value">{unitCount}</span>
                </div>
            </div>

            <section className="section">
                <div className="section-head">
                    <h3>Recent transactions</h3>
                    <Link className="link" to="/transactions">
                        View all
                    </Link>
                </div>

                {transactions.length === 0 ? (
                    <EmptyState message="No transactions yet." />
                ) : (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Flow</th>
                                    <th>Quantity</th>
                                    <th>Base qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{formatDate(tx.transaction_date)}</td>
                                        <td>
                                            <Link to={`/transactions/${tx.id}`}>{tx.product_name}</Link>
                                        </td>
                                        <td>
                                            <Badge tone={tx.flow === "IN" ? "in" : "out"}>
                                                {tx.flow}
                                            </Badge>
                                        </td>
                                        <td>
                                            {formatNumber(tx.quantity)} {tx.unit_name}
                                        </td>
                                        <td>{formatNumber(tx.base_quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="section">
                <div className="section-head">
                    <h3>Low stock</h3>
                    <Link className="link" to="/products">
                        View products
                    </Link>
                </div>

                {lowStock.length === 0 ? (
                    <EmptyState message="All products are above their minimum." />
                ) : (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>On hand</th>
                                    <th>Minimum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStock.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <Link to={`/products/${product.id}`}>{product.name}</Link>
                                        </td>
                                        <td>{product.sku}</td>
                                        <td>{formatNumber(product.quantity)}</td>
                                        <td>{formatNumber(product.min_quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
