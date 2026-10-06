import type { Request, Response, NextFunction } from "express"
import bcrypt from "bcryptjs";
import apiError from "../utils/apiError.js";
import { findByEmail, createUser } from "../services/auth.service.js";
import apiResponse from "../utils/apiResponse.js";
import { generateAccessToken } from "../utils/jwt.js";

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new apiError(400, 'email or password cant be empty');
        }

        if (!isValidEmail(email) || password.length < 8 || password.length > 15) {
            throw new apiError(400, 'invalid email or password');
        }

        const existing = await findByEmail(email);

        if (Array.isArray(existing) && existing.length > 0) {
            throw new apiError(409, "email already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await createUser(email, hashedPassword);

        return res.json(new apiResponse(201, "registration successfully", result));
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new apiError(400, 'email or password cant be empty');
        }

        if (!isValidEmail(email) || password.length < 8 || password.length > 15) {
            throw new apiError(400, 'invalid email or password');
        }

        const rows = await findByEmail(email);
        const user = rows[0];

        if (!user) {
            throw new apiError(401, "invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(password, user.hash_pass);

        if (!isPasswordValid) {
            throw new apiError(401, "invalid email or password");
        }

        const { hash_pass: _, ...safeUser } = user;

        const accessToken = generateAccessToken(safeUser.id);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
            path: "/"
        });

        return res.json(new apiResponse(200, "logged in successfully", safeUser));
    } catch (err) {
        next(err);
    }
}