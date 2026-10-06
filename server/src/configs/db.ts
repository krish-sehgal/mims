import mysql, { type Pool } from "mysql2/promise";
import apiError from "../utils/apiError.js";

let pool: Pool;

export function connectDB(): Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'mis'
        });
        console.log("Connected to MySQL database!");
    }
    return pool;
}

export function getPool(): Pool {
    if (!pool) throw new apiError(500, "DB not initialized, call connectDB() first");
    return pool;
}