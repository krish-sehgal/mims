import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../api/products";
import {
    addProductUnit,
    deleteProductUnit,
    listProductUnits,
    updateProductUnit
} from "../api/productUnits";
import { listUnits } from "../api/units";
import type { Product, ProductUnit, Unit } from "../api/types";
import { ApiError } from "../api/client";
import { useToast } from "../components/Toast";
import {
    Badge,
    Button,
    ConfirmDialog,
    EmptyState,
    ErrorBanner,
    Field,
    Input,
    Modal,
    Select,
    Spinner
} from "../components/ui";
import { formatNumber } from "../lib/format";

export default function ProductDetailPage() {
    const { id } = useParams();
    const productId = Number(id);
    const { notify } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [addUnitId, setAddUnitId] = useState("");
    const [addConversion, setAddConversion] = useState("");
    const [adding, setAdding] = useState(false);

    const [editTarget, setEditTarget] = useState<ProductUnit | null>(null);
    const [editConversion, setEditConversion] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<ProductUnit | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [productData, unitData, productUnitData] = await Promise.all([
                getProduct(productId),
                listUnits(),
                listProductUnits(productId)
            ]);
            setProduct(productData);
            setUnits(unitData.units);
            setProductUnits(productUnitData.units);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to load product");
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        load();
    }, [load]);

    const configuredUnitIds = new Set(productUnits.map((unit) => unit.unit_id));
    const availableUnits = units.filter((unit) => !configuredUnitIds.has(unit.id));

    async function handleAdd(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (!addUnitId) {
            setError("Select a unit to add");
            return;
        }

        const conversion = Number(addConversion);

        if (!Number.isFinite(conversion) || conversion <= 0) {
            setError("Conversion must be a positive number");
            return;
        }

        setAdding(true);

        try {
            await addProductUnit(productId, Number(addUnitId), conversion);
            notify("Unit conversion added", "success");
            setAddUnitId("");
            setAddConversion("");
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to add unit");
        } finally {
            setAdding(false);
        }
    }

    function openEdit(target: ProductUnit) {
        setEditTarget(target);
        setEditConversion(String(Number(target.conversion_to_base)));
    }

    async function handleSaveEdit(event: FormEvent) {
        event.preventDefault();

        if (!editTarget) {
            return;
        }

        const conversion = Number(editConversion);

        if (!Number.isFinite(conversion) || conversion <= 0) {
            setError("Conversion must be a positive number");
            return;
        }

        setSavingEdit(true);

        try {
            await updateProductUnit(productId, editTarget.unit_id, { conversion_to_base: conversion });
            notify("Conversion updated", "success");
            setEditTarget(null);
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to update conversion");
        } finally {
            setSavingEdit(false);
        }
    }

    async function handleToggleActive(target: ProductUnit) {
        try {
            await updateProductUnit(productId, target.unit_id, { active: target.active !== 1 });
            notify(target.active === 1 ? "Unit deactivated" : "Unit activated", "success");
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to update unit");
        }
    }

    async function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);

        try {
            await deleteProductUnit(productId, deleteTarget.unit_id);
            notify("Unit removed", "success");
            setDeleteTarget(null);
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to remove unit");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="page">
                <Spinner />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="page">
                <ErrorBanner message={error || "Product not found"} />
                <Link className="link" to="/products">
                    Back to products
                </Link>
            </div>
        );
    }

    const lowStock = Number(product.quantity) <= Number(product.min_quantity);

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2>{product.name}</h2>
                    <p className="muted">
                        SKU {product.sku} · Barcode {product.barcode}
                    </p>
                </div>
                <div className="page-actions">
                    <Link className="btn btn-secondary" to="/products">
                        Back
                    </Link>
                    <Link className="btn btn-primary" to={`/products/${product.id}/edit`}>
                        Edit
                    </Link>
                </div>
            </div>

            {error ? <ErrorBanner message={error} /> : null}

            <div className="stat-grid">
                <div className="stat-card">
                    <span className="stat-label">On hand</span>
                    <span className="stat-value">
                        {formatNumber(product.quantity)}
                        {lowStock ? <Badge tone="warn">low</Badge> : null}
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Minimum</span>
                    <span className="stat-value">{formatNumber(product.min_quantity)}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Category</span>
                    <span className="stat-value">{product.category ?? "—"}</span>
                </div>
            </div>

            <section className="section">
                <h3>Unit conversions</h3>
                <p className="muted">
                    Conversion is how many base units one of this unit equals.
                </p>

                {productUnits.length === 0 ? (
                    <EmptyState message="No units configured." />
                ) : (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Unit</th>
                                    <th>Conversion to base</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {productUnits.map((unit) => (
                                    <tr key={unit.id}>
                                        <td>{unit.unit_name}</td>
                                        <td>{formatNumber(unit.conversion_to_base)}</td>
                                        <td>
                                            {unit.is_base === 1 ? (
                                                <Badge tone="in">base</Badge>
                                            ) : (
                                                <Badge tone="muted">derived</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {unit.active === 1 ? (
                                                <Badge tone="success">active</Badge>
                                            ) : (
                                                <Badge tone="muted">inactive</Badge>
                                            )}
                                        </td>
                                        <td className="row-actions">
                                            {unit.is_base === 1 ? (
                                                <span className="muted">—</span>
                                            ) : (
                                                <>
                                                    <button
                                                        className="link"
                                                        type="button"
                                                        onClick={() => openEdit(unit)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="link"
                                                        type="button"
                                                        onClick={() => handleToggleActive(unit)}
                                                    >
                                                        {unit.active === 1 ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <button
                                                        className="link danger"
                                                        type="button"
                                                        onClick={() => setDeleteTarget(unit)}
                                                    >
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <form className="inline-form" onSubmit={handleAdd}>
                    <Field label="Unit" htmlFor="addUnit">
                        <Select
                            id="addUnit"
                            value={addUnitId}
                            onChange={(event) => setAddUnitId(event.target.value)}
                        >
                            <option value="">Select unit…</option>
                            {availableUnits.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Conversion to base" htmlFor="addConversion">
                        <Input
                            id="addConversion"
                            type="number"
                            min="0"
                            step="any"
                            value={addConversion}
                            onChange={(event) => setAddConversion(event.target.value)}
                        />
                    </Field>
                    <Button type="submit" loading={adding}>
                        Add unit
                    </Button>
                </form>
            </section>

            {editTarget ? (
                <Modal title={`Edit ${editTarget.unit_name} conversion`} onClose={() => setEditTarget(null)}>
                    <form onSubmit={handleSaveEdit}>
                        <Field label="Conversion to base" htmlFor="editConversion">
                            <Input
                                id="editConversion"
                                type="number"
                                min="0"
                                step="any"
                                value={editConversion}
                                onChange={(event) => setEditConversion(event.target.value)}
                            />
                        </Field>
                        <div className="modal-actions">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setEditTarget(null)}
                                disabled={savingEdit}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={savingEdit}>
                                Save
                            </Button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {deleteTarget ? (
                <ConfirmDialog
                    title="Remove unit"
                    message={`Remove "${deleteTarget.unit_name}" from this product?`}
                    confirmLabel="Remove"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            ) : null}
        </div>
    );
}
