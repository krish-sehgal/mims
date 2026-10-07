import type { Request, Response, NextFunction } from "express";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { findProductById, unitExists } from "../services/product.service.js";
import {
    getProductUnits as findProductUnits,
    findProductUnit,
    addProductUnit as insertProductUnit,
    updateProductUnit as updateProductUnitRecord,
    deleteProductUnit as deleteProductUnitRecord
} from "../services/productUnit.service.js";
import type { UpdateProductUnitInput } from "../services/productUnit.service.js";

function parsePositiveInt(raw: unknown, field: string): number {
    const value = Number(raw);

    if (!Number.isInteger(value) || value < 1) {
        throw new apiError(400, `invalid ${field}`);
    }

    return value;
}

export async function getProductUnits(req: Request, res: Response, next: NextFunction) {
    try {
        const productId = parsePositiveInt(req.params.id, "product id");

        if (!(await findProductById(productId))) {
            throw new apiError(404, "product not found");
        }

        const units = await findProductUnits(productId);

        return res.json(new apiResponse(200, "product units fetched successfully", { units }));
    } catch (err) {
        next(err);
    }
}

export async function addProductUnit(req: Request, res: Response, next: NextFunction) {
    try {
        const productId = parsePositiveInt(req.params.id, "product id");
        const { unit_id, conversion_to_base } = req.body;

        if (unit_id === undefined || conversion_to_base === undefined) {
            throw new apiError(400, "unit_id and conversion_to_base are required");
        }

        if (typeof unit_id !== "number" || !Number.isInteger(unit_id) || unit_id < 1) {
            throw new apiError(400, "unit_id must be a positive integer");
        }

        if (typeof conversion_to_base !== "number" || !Number.isFinite(conversion_to_base) || conversion_to_base <= 0) {
            throw new apiError(400, "conversion_to_base must be a positive number");
        }

        const product = await findProductById(productId);

        if (!product) {
            throw new apiError(404, "product not found");
        }

        if (Number(product.base_unit_id) === unit_id) {
            throw new apiError(409, "this unit is already the base unit for this product");
        }

        if (!(await unitExists(unit_id))) {
            throw new apiError(400, "invalid unit_id");
        }

        if (await findProductUnit(productId, unit_id)) {
            throw new apiError(409, "this unit is already configured for this product");
        }

        await insertProductUnit({ productId, unitId: unit_id, conversionToBase: conversion_to_base });
        const unit = await findProductUnit(productId, unit_id);

        return res.json(new apiResponse(201, "product unit added successfully", unit));
    } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") {
            return next(new apiError(409, "this unit is already configured for this product"));
        }
        next(err);
    }
}

export async function updateProductUnit(req: Request, res: Response, next: NextFunction) {
    try {
        const productId = parsePositiveInt(req.params.id, "product id");
        const unitId = parsePositiveInt(req.params.unitId, "unit id");

        if (!(await findProductById(productId))) {
            throw new apiError(404, "product not found");
        }

        const existing = await findProductUnit(productId, unitId);

        if (!existing) {
            throw new apiError(404, "product unit not found");
        }

        if (Number(existing.is_base) === 1) {
            throw new apiError(400, "the base unit cannot be modified");
        }

        const { conversion_to_base, active } = req.body;
        const updates: UpdateProductUnitInput = {};

        if (conversion_to_base !== undefined) {
            if (typeof conversion_to_base !== "number" || !Number.isFinite(conversion_to_base) || conversion_to_base <= 0) {
                throw new apiError(400, "conversion_to_base must be a positive number");
            }
            updates.conversionToBase = conversion_to_base;
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

        await updateProductUnitRecord(productId, unitId, updates);
        const unit = await findProductUnit(productId, unitId);

        return res.json(new apiResponse(200, "product unit updated successfully", unit));
    } catch (err) {
        next(err);
    }
}

export async function deleteProductUnit(req: Request, res: Response, next: NextFunction) {
    try {
        const productId = parsePositiveInt(req.params.id, "product id");
        const unitId = parsePositiveInt(req.params.unitId, "unit id");

        if (!(await findProductById(productId))) {
            throw new apiError(404, "product not found");
        }

        const existing = await findProductUnit(productId, unitId);

        if (!existing) {
            throw new apiError(404, "product unit not found");
        }

        if (Number(existing.is_base) === 1) {
            throw new apiError(400, "the base unit cannot be removed");
        }

        await deleteProductUnitRecord(productId, unitId);

        return res.json(new apiResponse(200, "product unit removed successfully"));
    } catch (err) {
        next(err);
    }
}
