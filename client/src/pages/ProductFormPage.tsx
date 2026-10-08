import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, getProduct, updateProduct } from "../api/products";
import { listUnits } from "../api/units";
import type { Unit } from "../api/types";
import { ApiError } from "../api/client";
import { useToast } from "../components/Toast";
import { Button, ErrorBanner, Field, Input, Select, Spinner } from "../components/ui";

export default function ProductFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { notify } = useToast();

    const isEdit = id !== undefined;

    const [units, setUnits] = useState<Unit[]>([]);
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [barcode, setBarcode] = useState("");
    const [baseUnitId, setBaseUnitId] = useState("");
    const [quantity, setQuantity] = useState("0");
    const [minQuantity, setMinQuantity] = useState("0");
    const [category, setCategory] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        listUnits()
            .then((result) => setUnits(result.units))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!isEdit) {
            return;
        }

        setLoading(true);

        getProduct(Number(id))
            .then((product) => {
                setName(product.name);
                setSku(product.sku);
                setBarcode(product.barcode);
                setBaseUnitId(String(product.base_unit_id));
                setQuantity(String(Number(product.quantity)));
                setMinQuantity(String(Number(product.min_quantity)));
                setCategory(product.category ?? "");
                setImageUrl(product.image_url ?? "");
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load product"))
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (!baseUnitId) {
            setError("Please select a base unit");
            return;
        }

        setSaving(true);

        const payload = {
            name: name.trim(),
            sku: sku.trim(),
            barcode: barcode.trim(),
            base_unit_id: Number(baseUnitId),
            quantity: Number(quantity || 0),
            min_quantity: Number(minQuantity || 0),
            category: category.trim() === "" ? null : category.trim(),
            image_url: imageUrl.trim() === "" ? null : imageUrl.trim()
        };

        try {
            if (isEdit) {
                const updated = await updateProduct(Number(id), payload);
                notify("Product updated", "success");
                navigate(`/products/${updated.id}`);
            } else {
                const created = await createProduct(payload);
                notify("Product created", "success");
                navigate(`/products/${created.id}`);
            }
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to save product");
        } finally {
            setSaving(false);
        }
    }

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
                <h2>{isEdit ? "Edit product" : "New product"}</h2>
            </div>

            {error ? <ErrorBanner message={error} /> : null}

            <form className="form-card" onSubmit={handleSubmit}>
                <Field label="Name" htmlFor="name">
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>

                <div className="form-grid">
                    <Field label="SKU" htmlFor="sku">
                        <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
                    </Field>
                    <Field label="Barcode" htmlFor="barcode">
                        <Input
                            id="barcode"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            required
                        />
                    </Field>
                </div>

                <div className="form-grid">
                    <Field label="Base unit" htmlFor="baseUnit">
                        <Select
                            id="baseUnit"
                            value={baseUnitId}
                            onChange={(e) => setBaseUnitId(e.target.value)}
                            required
                        >
                            <option value="">Select a unit…</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                    {unit.active ? "" : " (inactive)"}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Category" htmlFor="category">
                        <Input
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </Field>
                </div>

                <div className="form-grid">
                    <Field label="Quantity" htmlFor="quantity">
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            step="any"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </Field>
                    <Field label="Minimum quantity" htmlFor="minQuantity">
                        <Input
                            id="minQuantity"
                            type="number"
                            min="0"
                            step="any"
                            value={minQuantity}
                            onChange={(e) => setMinQuantity(e.target.value)}
                        />
                    </Field>
                </div>

                <Field label="Image URL" htmlFor="imageUrl">
                    <Input
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://…"
                    />
                </Field>

                <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={saving}>
                        {isEdit ? "Save changes" : "Create product"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
