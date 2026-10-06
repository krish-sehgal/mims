import { getPool } from "../configs/db.js";

export async function findByEmail(email: string){
    const [rows] = await getPool().execute('SELECT * FROM user WHERE email = ?', [email]);
    return rows;
}

export async function createUser(email: string, password: string){
    const [result] = await getPool().execute('INSERT INTO user (email, hash_pass) VALUES (?, ?)', [email, password]);
    return result;
}