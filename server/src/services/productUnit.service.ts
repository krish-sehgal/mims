import { getPool } from "../configs/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export async function getProductUnits(productId: number): Promise<RowDataPacket[]> {
    const [rows] = await getPool().execute(
        `SELECT pu.id, pu.product_id, pu.unit_id, u.name AS unit_name,
                pu.conversion_to_base, pu.is_base, pu.active
         FROM product_units pu
         JOIN units u ON u.id = pu.unit_id
         WHERE pu.product_id = ?
         ORDER BY pu.is_base DESC, u.name ASC`,
        [productId]
    );
    return rows as RowDataPacket[];
}

export async function findProductUnit(productId: number, unitId: number): Promise<RowDataPacket | undefined> {
    const [rows] = await getPool().execute(
        `SELECT pu.id, pu.product_id, pu.unit_id, u.name AS unit_name,
                pu.conversion_to_base, pu.is_base, pu.active
         FROM product_units pu
         JOIN units u ON u.id = pu.unit_id
         WHERE pu.product_id = ? AND pu.unit_id = ?`,
        [productId, unitId]
    );
    return (rows as RowDataPacket[])[0];
}

export interface AddProductUnitInput {
    productId: number;
    unitId: number;
    conversionToBase: number;
}

export async function addProductUnit(input: AddProductUnitInput): Promise<ResultSetHeader> {
    const [result] = await getPool().execute<ResultSetHeader>(
        `INSERT INTO product_units (product_id, unit_id, conversion_to_base, is_base, active)
         VALUES (?, ?, ?, 0, 1)`,
        [input.productId, input.unitId, input.conversionToBase]
    );
    return result;
}

export interface UpdateProductUnitInput {
    conversionToBase?: number;
    active?: boolean;
}

export async function updateProductUnit(productId: number, unitId: number, input: UpdateProductUnitInput): Promise<void> {
    const fields: string[] = [];
    const params: number[] = [];

    if (input.conversionToBase !== undefined) {
        fields.push("conversion_to_base = ?");
        params.push(input.conversionToBase);
    }

    if (input.active !== undefined) {
        fields.push("active = ?");
        params.push(input.active ? 1 : 0);
    }

    if (fields.length === 0) {
        return;
    }

    params.push(productId, unitId);
    await getPool().execute(
        `UPDATE product_units SET ${fields.join(", ")} WHERE product_id = ? AND unit_id = ?`,
        params
    );
}

export async function deleteProductUnit(productId: number, unitId: number): Promise<void> {
    await getPool().execute(
        'DELETE FROM product_units WHERE product_id = ? AND unit_id = ?',
        [productId, unitId]
    );
}
