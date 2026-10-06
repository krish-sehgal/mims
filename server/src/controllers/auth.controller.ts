import type { Request, Response } from "express"
import apiError from "../utils/apiError.js";
import { findByEmail } from "../services/auth.service.js";

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req: Request, res: Response) {
    
}

export async function login(req: Request, res: Response) {

    const { email, password } = req.body;

    if (!email || !password) {
        throw new apiError(400, 'email or password cant be empty');
    }

    if (!isValidEmail(email) || password.length < 8 || password.length > 15) {
        throw new apiError(400, 'invalid email or password')
    }

    const user = await findByEmail(email)

    if (!Array.isArray(user) || user.length === 0) {
        throw new apiError(400, "invalid email or password")
    }

    return res.json({
        message: "logged in successfully"
    })
}