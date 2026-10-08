import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createUnit, listUnits, updateUnit } from "../api/units";
import type { Unit } from "../api/types";
import { ApiError } from "../api/client";
import { useToast } from "../components/Toast";
import {
    Badge,
    Button,
    EmptyState,
    ErrorBanner,
    Field,
    Input,
    Modal,
    Spinner
} from "../components/ui";

export default function UnitsPage() {
    const { notify } = useToast();

    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);

    const [editTarget, setEditTarget] = useState<Unit | null>(null);
    const [editName, setEditName] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await listUnits();
            setUnits(data.units);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to load units");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function handleCreate(event: FormEvent) {
        event.preventDefault();
        setError("");
        setCreating(true);

        try {
            await createUnit(name.trim());
            notify("Unit created", "success");
            setName("");
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to create unit");
        } finally {
            setCreating(false);
        }
    }

    function openEdit(unit: Unit) {
        setEditTarget(unit);
        setEditName(unit.name);
    }

    async function handleSaveEdit(event: FormEvent) {
        event.preventDefault();

        if (!editTarget) {
            return;
        }

        setSavingEdit(true);

        try {
            await updateUnit(editTarget.id, { name: editName.trim() });
            notify("Unit renamed", "success");
            setEditTarget(null);
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to update unit");
        } finally {
            setSavingEdit(false);
        }
    }

    async function handleToggle(unit: Unit) {
        try {
            await updateUnit(unit.id, { active: unit.active !== 1 });
            notify(unit.active === 1 ? "Unit deactivated" : "Unit activated", "success");
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Failed to update unit");
        }
    }

    return (
        <div className="page">
            <div className="page-head">
                <h2>Units</h2>
            </div>

            {error ? <ErrorBanner message={error} /> : null}

            <form className="inline-form" onSubmit={handleCreate}>
                <Field label="New unit name" htmlFor="unitName">
                    <Input
                        id="unitName"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. box"
                        required
                    />
                </Field>
                <Button type="submit" loading={creating}>
                    Add unit
                </Button>
            </form>

            {loading ? (
                <Spinner />
            ) : units.length === 0 ? (
                <EmptyState message="No units yet." />
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.id}>
                                    <td>{unit.id}</td>
                                    <td>{unit.name}</td>
                                    <td>
                                        {unit.active === 1 ? (
                                            <Badge tone="success">active</Badge>
                                        ) : (
                                            <Badge tone="muted">inactive</Badge>
                                        )}
                                    </td>
                                    <td className="row-actions">
                                        <button className="link" type="button" onClick={() => openEdit(unit)}>
                                            Rename
                                        </button>
                                        <button
                                            className="link"
                                            type="button"
                                            onClick={() => handleToggle(unit)}
                                        >
                                            {unit.active === 1 ? "Deactivate" : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editTarget ? (
                <Modal title={`Rename ${editTarget.name}`} onClose={() => setEditTarget(null)}>
                    <form onSubmit={handleSaveEdit}>
                        <Field label="Name" htmlFor="editUnitName">
                            <Input
                                id="editUnitName"
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                required
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
        </div>
    );
}
