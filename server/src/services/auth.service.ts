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

export async function setResetToken(email: string, token: string, expiresAt: Date){
    const [result] = await getPool().execute(
        'UPDATE user SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
        [token, expiresAt, email]
    );
    return result;
}

export async function findByResetToken(token: string): Promise<RowDataPacket[]> {
    const [rows] = await getPool().execute(
        'SELECT * FROM user WHERE reset_token = ? AND reset_token_expires > NOW()',
        [token]
    );
    return rows as RowDataPacket[];
}

export async function updatePassword(id: number, hash_pass: string){
    const [result] = await getPool().execute(
        'UPDATE user SET hash_pass = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hash_pass, id]
    );
    return result;
}