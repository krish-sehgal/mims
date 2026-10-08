import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { listProducts } from "../api/products";
import { listProductUnits } from "../api/productUnits";
import { recordTransaction } from "../api/transactions";
import type { Product, ProductUnit, TransactionFlow } from "../api/types";
import { ApiError } from "../api/client";
import { useToast } from "../components/Toast";
import { Button, ErrorBanner, Field, Input, Select, Textarea } from "../components/ui";

export default function TransactionFormPage() {
    const navigate = useNavigate();
    const { notify } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);

    const [productId, setProductId] = useState("");
    const [flow, setFlow] = useState<TransactionFlow>("IN");
    const [quantity, setQuantity] = useState("");
    const [unitId, setUnitId] = useState("");
    const [transactionDate, setTransactionDate] = useState("");
    const [remarks, setRemarks] = useState("");

    const [error, setError] = useState("");
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        listProducts({ limit: 100 })
            .then((result) => setProducts(result.products))
            .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load products"));
    }, []);

    useEffect(() => {
        if (!productId) {
            setProductUnits([]);
            setUnitId("");
            return;
        }

        setLoadingUnits(true);
        setError("");

        listProductUnits(Number(productId))
            .then((result) => {
                setProductUnits(result.units);
                const base = result.units.find((unit) => unit.is_base === 1) ?? result.units[0];
                setUnitId(base ? String(base.unit_id) : "");
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load units"))
            .finally(() => setLoadingUnits(false));
    }, [productId]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (!productId) {
            setError("Select a product");
            return;
        }

        const qty = Number(quantity);

        if (!Number.isFinite(qty) || qty <= 0) {
            setError("Quantity must be a positive number");
            return;
        }

        setSaving(true);

        try {
            const result = await recordTransaction({
                product_id: Number(productId),
                flow,
                quantity: qty,
                unit_id: unitId ? Number(unitId) : undefined,
                transaction_date: transactionDate ? transactionDate : undefined,
                remarks: remarks.trim() === "" ? undefined : remarks.trim()
            });
            notify(`Recorded ${flow} — new quantity ${result.new_quantity}`, "success");
            navigate("/transactions");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to record transaction");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="page">
            <div className="page-head">
                <h2>Record stock movement</h2>
            </div>

            {error ? <ErrorBanner message={error} /> : null}

            <form className="form-card" onSubmit={handleSubmit}>
                <Field label="Product" htmlFor="product">
                    <Select
                        id="product"
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                        required
                    >
                        <option value="">Select a product…</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                            </option>
                        ))}
                    </Select>
                </Field>

                <div className="form-grid">
                    <Field label="Flow" htmlFor="flow">
                        <Select
                            id="flow"
                            value={flow}
                            onChange={(event) => setFlow(event.target.value as TransactionFlow)}
                        >
                            <option value="IN">IN (add stock)</option>
                            <option value="OUT">OUT (remove stock)</option>
                        </Select>
                    </Field>
                    <Field label="Quantity" htmlFor="quantity">
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            step="any"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            required
                        />
                    </Field>
                </div>

                <Field label="Unit" htmlFor="unit" hint={loadingUnits ? "Loading units…" : undefined}>
                    <Select
                        id="unit"
                        value={unitId}
                        onChange={(event) => setUnitId(event.target.value)}
                        disabled={!productId || loadingUnits}
                    >
                        <option value="">Select a unit…</option>
                        {productUnits.map((unit) => (
                            <option key={unit.id} value={unit.unit_id}>
                                {unit.unit_name}
                                {unit.is_base === 1 ? " (base)" : ` × ${Number(unit.conversion_to_base)}`}
                            </option>
                        ))}
                    </Select>
                </Field>

                <Field label="Transaction date" htmlFor="transactionDate" hint="Optional — defaults to now">
                    <Input
                        id="transactionDate"
                        type="datetime-local"
                        value={transactionDate}
                        onChange={(event) => setTransactionDate(event.target.value)}
                    />
                </Field>

                <Field label="Remarks" htmlFor="remarks">
                    <Textarea
                        id="remarks"
                        rows={3}
                        value={remarks}
                        onChange={(event) => setRemarks(event.target.value)}
                    />
                </Field>

                <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={saving}>
                        Record movement
                    </Button>
                </div>
            </form>
        </div>
    );
}
