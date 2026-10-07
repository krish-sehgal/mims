import type { Request, Response, NextFunction } from "express";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import {
    recordStockMovement,
    getTransactions as findTransactions,
    countTransactions,
    findTransactionById
} from "../services/transaction.service.js";
import type { TransactionFlow } from "../services/transaction.service.js";

const MAX_BACKDATE_DAYS = 30;

export async function createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
        const { product_id, flow, quantity, unit_id, transaction_date, remarks } = req.body;

        if (product_id === undefined || flow === undefined || quantity === undefined) {
            throw new apiError(400, "product_id, flow and quantity are required");
        }

        if (typeof product_id !== "number" || !Number.isInteger(product_id) || product_id < 1) {
            throw new apiError(400, "product_id must be a positive integer");
        }

        if (flow !== "IN" && flow !== "OUT") {
            throw new apiError(400, "flow must be IN or OUT");
        }

        if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
            throw new apiError(400, "quantity must be a positive number");
        }

        if (unit_id !== undefined && (typeof unit_id !== "number" || !Number.isInteger(unit_id) || unit_id < 1)) {
            throw new apiError(400, "unit_id must be a positive integer");
        }

        const now = new Date();
        let transactionDate = now;

        if (transaction_date !== undefined && transaction_date !== null) {
            transactionDate = new Date(transaction_date);

            if (Number.isNaN(transactionDate.getTime())) {
                throw new apiError(400, "transaction_date must be a valid date");
            }

            if (transactionDate.getTime() > now.getTime()) {
                throw new apiError(400, "transaction_date cannot be in the future");
            }

            const cutoff = now.getTime() - MAX_BACKDATE_DAYS * 24 * 60 * 60 * 1000;

            if (transactionDate.getTime() < cutoff) {
                throw new apiError(400, `transaction_date cannot be more than ${MAX_BACKDATE_DAYS} days in the past`);
            }
        }

        const result = await recordStockMovement({
            productId: product_id,
            flow: flow as TransactionFlow,
            unitId: unit_id,
            quantity,
            remarks: remarks ?? null,
            transactionDate
        });

        return res.json(new apiResponse(201, "transaction recorded successfully", result));
    } catch (err) {
        next(err);
    }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);

        if (!Number.isInteger(page) || page < 1) {
            throw new apiError(400, "page must be a positive integer");
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new apiError(400, "limit must be an integer between 1 and 100");
        }

        let productId: number | null = null;

        if (req.query.product_id !== undefined) {
            const value = Number(req.query.product_id);

            if (!Number.isInteger(value) || value < 1) {
                throw new apiError(400, "product_id must be a positive integer");
            }

            productId = value;
        }

        let flow: TransactionFlow | null = null;

        if (req.query.flow !== undefined) {
            const value = req.query.flow;

            if (value !== "IN" && value !== "OUT") {
                throw new apiError(400, "flow must be IN or OUT");
            }

            flow = value;
        }

        let from: Date | null = null;

        if (req.query.from !== undefined) {
            from = new Date(String(req.query.from));

            if (Number.isNaN(from.getTime())) {
                throw new apiError(400, "from must be a valid date");
            }
        }

        let to: Date | null = null;

        if (req.query.to !== undefined) {
            to = new Date(String(req.query.to));

            if (Number.isNaN(to.getTime())) {
                throw new apiError(400, "to must be a valid date");
            }
        }

        const offset = (page - 1) * limit;
        const filters = { productId, flow, from, to };

        const [transactions, total] = await Promise.all([
            findTransactions({ ...filters, limit, offset }),
            countTransactions(filters)
        ]);

        return res.json(new apiResponse(200, "transactions fetched successfully", {
            transactions,
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

export async function getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            throw new apiError(400, "invalid transaction id");
        }

        const transaction = await findTransactionById(id);

        if (!transaction) {
            throw new apiError(404, "transaction not found");
        }

        return res.json(new apiResponse(200, "transaction fetched successfully", transaction));
    } catch (err) {
        next(err);
    }
}
