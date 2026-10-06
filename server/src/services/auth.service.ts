import { getPool } from "../configs/db.js";

export async function findByEmail(email: string){
    const [rows] = await getPool().execute('SELECT * FROM user WHERE email = ?', [email]);
    return rows;
}