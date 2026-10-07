import type { Request, Response, NextFunction } from "express";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import {
    listUnits,
    findUnitById,
    findUnitByName,
    createUnit as insertUnit,
    updateUnit as updateUnitRecord
} from "../services/unit.service.js";
import type { UpdateUnitInput } from "../services/unit.service.js";

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
    if (typeof value !== "string" || value.trim() === "") {
        throw new apiError(400, `${field} must be a non-empty string`);
    }
}

function parseUnitId(raw: unknown): number {
    const id = Number(raw);

    if (!Number.isInteger(id) || id < 1) {
        throw new apiError(400, "invalid unit id");
    }

    return id;
}

export async function getUnits(req: Request, res: Response, next: NextFunction) {
    try {
        let active: boolean | null = null;

        if (req.query.active !== undefined) {
            if (req.query.active === "true") {
                active = true;
            } else if (req.query.active === "false") {
                active = false;
            } else {
                throw new apiError(400, "active must be true or false");
            }
        }

        const units = await listUnits(active);

        return res.json(new apiResponse(200, "units fetched successfully", { units }));
    } catch (err) {
        next(err);
    }
}

export async function getUnit(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseUnitId(req.params.id);
        const unit = await findUnitById(id);

        if (!unit) {
            throw new apiError(404, "unit not found");
        }

        return res.json(new apiResponse(200, "unit fetched successfully", unit));
    } catch (err) {
        next(err);
    }
}

export async function createUnit(req: Request, res: Response, next: NextFunction) {
    try {
        const { name } = req.body;

        assertNonEmptyString(name, "name");

        if (name.length > 100) {
            throw new apiError(400, "name must be at most 100 characters");
        }

        if (await findUnitByName(name)) {
            throw new apiError(409, "a unit with this name already exists");
        }

        const result = await insertUnit(name);
        const unit = await findUnitById(result.insertId);

        return res.json(new apiResponse(201, "unit created successfully", unit));
    } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") {
            return next(new apiError(409, "a unit with this name already exists"));
        }
        next(err);
    }
}

export async function updateUnit(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseUnitId(req.params.id);
        const existing = await findUnitById(id);

        if (!existing) {
            throw new apiError(404, "unit not found");
        }

        const { name, active } = req.body;
        const updates: UpdateUnitInput = {};

        if (name !== undefined) {
            assertNonEmptyString(name, "name");

            if (name.length > 100) {
                throw new apiError(400, "name must be at most 100 characters");
            }

            updates.name = name;
        }

        if (active !== undefined) {
            if (typeof active !== "boolean") {
                throw new apiError(400, "active must be a boolean");
            }
            updates.active = active;
        }

        if (Object.keys(updates).length === 0) {
            throw new apiError(400, "no fields to update");
        }

        if (updates.name !== undefined) {
            const conflict = await findUnitByName(updates.name);

            if (conflict && Number(conflict.id) !== id) {
                throw new apiError(409, "a unit with this name already exists");
            }
        }

        await updateUnitRecord(id, updates);
        const unit = await findUnitById(id);

        return res.json(new apiResponse(200, "unit updated successfully", unit));
    } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") {
            return next(new apiError(409, "a unit with this name already exists"));
        }
        next(err);
    }
}
