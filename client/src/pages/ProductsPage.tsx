import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../api/products";
import { listUnits } from "../api/units";
import type { Pagination as PaginationType, Product, Unit } from "../api/types";
import { ApiError } from "../api/client";
import {
    Badge,
    Button,
    EmptyState,
    ErrorBanner,
    Input,
    Pagination,
    Spinner
} from "../components/ui";
import { formatNumber } from "../lib/format";

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [pagination, setPagination] = useState<PaginationType>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    });
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        listUnits()
            .then((result) => setUnits(result.units))
            .catch(() => undefined);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await listProducts({ page, limit: 20, search: query || undefined });
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [page, query]);

    useEffect(() => {
        load();
    }, [load]);

    function unitName(id: number) {
        return units.find((unit) => unit.id === id)?.name ?? `#${id}`;
    }

    function handleSearch(event: FormEvent) {
        event.preventDefault();
        setPage(1);
        setQuery(search.trim());
    }

    return (
        <div className="page">
            <div className="page-head">
                <h2>Products</h2>
                <Link className="btn btn-primary" to="/products/new">
                    New product
                </Link>
            </div>

            <form className="toolbar" onSubmit={handleSearch}>
                <Input
                    placeholder="Search by name, SKU or barcode"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <Button type="submit" variant="secondary">
                    Search
                </Button>
            </form>

            {error ? <ErrorBanner message={error} /> : null}

            {loading ? (
                <Spinner />
            ) : products.length === 0 ? (
                <EmptyState message="No products found." />
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Barcode</th>
                                <th>Quantity</th>
                                <th>Min</th>
                                <th>Unit</th>
                                <th>Category</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const low =
                                    Number(product.quantity) <= Number(product.min_quantity);
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <Link to={`/products/${product.id}`}>{product.name}</Link>
                                        </td>
                                        <td>{product.sku}</td>
                                        <td>{product.barcode}</td>
                                        <td>
                                            {formatNumber(product.quantity)}{" "}
                                            {low ? <Badge tone="warn">low</Badge> : null}
                                        </td>
                                        <td>{formatNumber(product.min_quantity)}</td>
                                        <td>{unitName(product.base_unit_id)}</td>
                                        <td>{product.category ?? "—"}</td>
                                        <td className="row-actions">
                                            <Link className="link" to={`/products/${product.id}`}>
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
        </div>
    );
}

