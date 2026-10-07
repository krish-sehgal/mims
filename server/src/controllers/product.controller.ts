import type { Request, Response, NextFunction } from "express";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { findBySkuOrBarcode, unitExists, createProduct as insertProduct, getProducts as findProducts, countProducts, findProductById } from "../services/product.service.js";

export async function createProduct(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, sku, barcode, base_unit_id, image_url, category } = req.body;

        if (!name || !sku || !barcode || !base_unit_id) {
            throw new apiError(400, "name, sku, barcode and base_unit_id are required");
        }

        if (typeof base_unit_id !== "number") {
            throw new apiError(400, "base_unit_id must be a number");
        }

        const quantity = req.body.quantity ?? 0;
        const min_quantity = req.body.min_quantity ?? 0;

        if (typeof quantity !== "number" || quantity < 0) {
            throw new apiError(400, "quantity must be a non-negative number");
        }

        if (typeof min_quantity !== "number" || min_quantity < 0) {
            throw new apiError(400, "min_quantity must be a non-negative number");
        }

        const existing = await findBySkuOrBarcode(sku, barcode);

        if (existing.length > 0) {
            throw new apiError(409, "a product with this sku or barcode already exists");
        }

        if (!(await unitExists(base_unit_id))) {
            throw new apiError(400, "invalid base_unit_id");
        }

        const product = await insertProduct({
            name,
            sku,
            barcode,
            base_unit_id,
            quantity,
            min_quantity,
            image_url: image_url ?? null,
            category: category ?? null
        });

        return res.json(new apiResponse(201, "product created successfully", product));
    } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") {
            return next(new apiError(409, "a product with this sku or barcode already exists"));
        }
        next(err);
    }
}

export async function getProducts(req: Request, res: Response, next: NextFunction) {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);
        const search = typeof req.query.search === "string" && req.query.search.trim() !== ""
            ? req.query.search.trim()
            : null;

        if (!Number.isInteger(page) || page < 1) {
            throw new apiError(400, "page must be a positive integer");
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new apiError(400, "limit must be an integer between 1 and 100");
        }

        const offset = (page - 1) * limit;

        const [products, total] = await Promise.all([
            findProducts({ search, limit, offset }),
            countProducts(search)
        ]);

        return res.json(new apiResponse(200, "products fetched successfully", {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }));
    } catch (err) {
        next(err);
    }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            throw new apiError(400, "invalid product id");
        }

        const product = await findProductById(id);

        if (!product) {
            throw new apiError(404, "product not found");
        }

        return res.json(new apiResponse(200, "product fetched successfully", product));
    } catch (err) {
        next(err);
    }
}
