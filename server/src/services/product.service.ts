import { getPool } from "../configs/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export interface CreateProductInput {
    name: string;
    sku: string;
    barcode: string;
    base_unit_id: number;
    quantity: number;
    min_quantity: number;
    image_url: string | null;
    category: string | null;
}

export async function findBySkuOrBarcode(sku: string, barcode: string): Promise<RowDataPacket[]> {
    const [rows] = await getPool().execute(
        'SELECT * FROM products WHERE sku = ? OR barcode = ?',
        [sku, barcode]
    );
    return rows as RowDataPacket[];
}

export interface GetProductsParams {
    search: string | null;
    limit: number;
    offset: number;
}

export async function getProducts({ search, limit, offset }: GetProductsParams): Promise<RowDataPacket[]> {
    const where = search ? "WHERE name LIKE ? OR sku LIKE ? OR barcode LIKE ?" : "";
    const params: (string | number)[] = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

    const [rows] = await getPool().execute(
        `SELECT * FROM products ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    return rows as RowDataPacket[];
}

export async function countProducts(search: string | null): Promise<number> {
    const where = search ? "WHERE name LIKE ? OR sku LIKE ? OR barcode LIKE ?" : "";
    const params: string[] = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

    const [rows] = await getPool().execute(`SELECT COUNT(*) AS total FROM products ${where}`, params);
    const total = (rows as RowDataPacket[])[0]?.total;

    return Number(total ?? 0);
}

export async function findProductById(id: number): Promise<RowDataPacket | undefined> {
    const [rows] = await getPool().execute('SELECT * FROM products WHERE id = ?', [id]);
    return (rows as RowDataPacket[])[0];
}

export async function unitExists(id: number): Promise<boolean> {
    const [rows] = await getPool().execute('SELECT id FROM units WHERE id = ?', [id]);
    return (rows as RowDataPacket[]).length > 0;
}

export async function createProduct(input: CreateProductInput) {
    const connection = await getPool().getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO products
                (name, sku, barcode, base_unit_id, quantity, min_quantity, image_url, category)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.name,
                input.sku,
                input.barcode,
                input.base_unit_id,
                input.quantity,
                input.min_quantity,
                input.image_url,
                input.category
            ]
        );

        const productId = result.insertId;

        await connection.execute(
            `INSERT INTO product_units
                (product_id, unit_id, conversion_to_base, is_base, active)
             VALUES (?, ?, 1, 1, 1)`,
            [productId, input.base_unit_id]
        );

        await connection.commit();

        return { id: productId, ...input };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}
