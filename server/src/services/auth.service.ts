import { getPool } from "../configs/db.js";
import type { RowDataPacket } from "mysql2/promise";

export async function findByEmail(email: string): Promise<RowDataPacket[]> {
    const [rows] = await getPool().execute('SELECT * FROM user WHERE email = ?', [email]);
    return rows as RowDataPacket[];
}

export async function createUser(email: string, hash_pass: string){
    const [result] = await getPool().execute('INSERT INTO user (email, hash_pass) VALUES (?, ?)', [email, hash_pass]);
    return result;
}