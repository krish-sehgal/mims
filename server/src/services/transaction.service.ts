import { getPool } from "../configs/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import apiError from "../utils/apiError.js";

export type TransactionFlow = "IN" | "OUT";

export interface RecordStockMovementInput {
    productId: number;
    flow: TransactionFlow;
    unitId: number | undefined;
    quantity: number;
    remarks: string | null;
    transactionDate: Date;
}

export async function recordStockMovement(input: RecordStockMovementInput) {
    const connection = await getPool().getConnection();

    try {
        await connection.beginTransaction();

        const [productRows] = await connection.execute(
            'SELECT id, quantity, base_unit_id FROM products WHERE id = ? FOR UPDATE',
            [input.productId]
        );
        const product = (productRows as RowDataPacket[])[0];

        if (!product) {
            throw new apiError(404, "product not found");
        }

        const unitId = input.unitId ?? product.base_unit_id;

        const [unitRows] = await connection.execute(
            'SELECT conversion_to_base FROM product_units WHERE product_id = ? AND unit_id = ? AND active = 1',
            [input.productId, unitId]
        );
        const conversion = (unitRows as RowDataPacket[])[0]?.conversion_to_base;

        if (conversion === undefined || Number(conversion) <= 0) {
            throw new apiError(400, "unit is not configured for this product");
        }

        const conversionToBase = Number(conversion);
        const baseQuantity = input.quantity * conversionToBase;
        const currentQuantity = Number(product.quantity);

        if (input.flow === "OUT" && currentQuantity < baseQuantity) {
            throw new apiError(409, "insufficient stock");
        }

        const newQuantity = input.flow === "IN"
            ? currentQuantity + baseQuantity
            : currentQuantity - baseQuantity;

        await connection.execute(
            'UPDATE products SET quantity = ? WHERE id = ?',
            [newQuantity, input.productId]
        );

        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO transactions
                (product_id, unit_id, flow, quantity, conversion_to_base, base_quantity, transaction_date, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.productId,
                unitId,
                input.flow,
                input.quantity,
                conversionToBase,
                baseQuantity,
                input.transactionDate,
                input.remarks
            ]
        );

        await connection.commit();

        return {
            transactionId: result.insertId,
            productId: input.productId,
            unitId,
            flow: input.flow,
            quantity: input.quantity,
            conversion_to_base: conversionToBase,
            base_quantity: baseQuantity,
            new_quantity: newQuantity
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

export interface TransactionFilters {
    productId: number | null;
    flow: TransactionFlow | null;
    from: Date | null;
    to: Date | null;
}

export interface GetTransactionsParams extends TransactionFilters {
    limit: number;
    offset: number;
}

function buildTransactionFilters(filters: TransactionFilters): { where: string; values: (string | number | Date)[] } {
    const conditions: string[] = [];
    const values: (string | number | Date)[] = [];

    if (filters.productId !== null) {
        conditions.push("t.product_id = ?");
        values.push(filters.productId);
    }

    if (filters.flow !== null) {
        conditions.push("t.flow = ?");
        values.push(filters.flow);
    }

    if (filters.from !== null) {
        conditions.push("t.transaction_date >= ?");
        values.push(filters.from);
    }

    if (filters.to !== null) {
        conditions.push("t.transaction_date <= ?");
        values.push(filters.to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    return { where, values };
}

const TRANSACTION_SELECT = `
    SELECT t.id, t.product_id, p.name AS product_name, p.sku, p.barcode,
           t.unit_id, u.name AS unit_name, t.flow, t.quantity,
           t.conversion_to_base, t.base_quantity, t.transaction_date, t.remarks, t.created_at
    FROM transactions t
    JOIN products p ON p.id = t.product_id
    JOIN units u ON u.id = t.unit_id`;

export async function getTransactions(params: GetTransactionsParams): Promise<RowDataPacket[]> {
    const { where, values } = buildTransactionFilters(params);

    const [rows] = await getPool().execute(
        `${TRANSACTION_SELECT}
         ${where}
         ORDER BY t.transaction_date DESC, t.id DESC
         LIMIT ? OFFSET ?`,
        [...values, params.limit, params.offset]
    );
    return rows as RowDataPacket[];
}

export async function countTransactions(filters: TransactionFilters): Promise<number> {
    const { where, values } = buildTransactionFilters(filters);

    const [rows] = await getPool().execute(
        `SELECT COUNT(*) AS total FROM transactions t ${where}`,
        values
    );

    return Number((rows as RowDataPacket[])[0]?.total ?? 0);
}

export async function findTransactionById(id: number): Promise<RowDataPacket | undefined> {
    const [rows] = await getPool().execute(
        `${TRANSACTION_SELECT} WHERE t.id = ?`,
        [id]
    );
    return (rows as RowDataPacket[])[0];
}
