import { getPool } from "../configs/db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export async function listUnits(active: boolean | null): Promise<RowDataPacket[]> {
    const where = active === null ? "" : "WHERE active = ?";
    const params: number[] = active === null ? [] : [active ? 1 : 0];

    const [rows] = await getPool().execute(
        `SELECT id, name, active, created_at, updated_at FROM units ${where} ORDER BY name ASC`,
        params
    );
    return rows as RowDataPacket[];
}

export async function findUnitById(id: number): Promise<RowDataPacket | undefined> {
    const [rows] = await getPool().execute(
        'SELECT id, name, active, created_at, updated_at FROM units WHERE id = ?',
        [id]
    );
    return (rows as RowDataPacket[])[0];
}

export async function findUnitByName(name: string): Promise<RowDataPacket | undefined> {
    const [rows] = await getPool().execute('SELECT id, name FROM units WHERE name = ?', [name]);
    return (rows as RowDataPacket[])[0];
}

export async function createUnit(name: string): Promise<ResultSetHeader> {
    const [result] = await getPool().execute<ResultSetHeader>(
        'INSERT INTO units (name, active) VALUES (?, 1)',
        [name]
    );
    return result;
}

export interface UpdateUnitInput {
    name?: string;
    active?: boolean;
}

export async function updateUnit(id: number, input: UpdateUnitInput): Promise<void> {
    const fields: string[] = [];
    const params: (string | number)[] = [];

    if (input.name !== undefined) {
        fields.push("name = ?");
        params.push(input.name);
    }

    if (input.active !== undefined) {
        fields.push("active = ?");
        params.push(input.active ? 1 : 0);
    }

    if (fields.length === 0) {
        return;
    }

    params.push(id);
    await getPool().execute(`UPDATE units SET ${fields.join(", ")} WHERE id = ?`, params);
}
