import type { Request, Response, NextFunction } from "express"
import type { JwtPayload } from "jsonwebtoken"
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import apiError from "../utils/apiError.js";
import { findByEmail, createUser, setResetToken, findByResetToken, updatePassword } from "../services/auth.service.js";
import apiResponse from "../utils/apiResponse.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const accessCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 15 * 60 * 1000,
    path: "/"
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 28 * 24 * 60 * 60 * 1000,
    path: "/"
};

function clearAuthCookies(res: Response) {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
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

        const { hash_pass: _, reset_token: _rt, reset_token_expires: _rte, ...safeUser } = user;

        const accessToken = generateAccessToken(safeUser.id);
        const refreshToken = generateRefreshToken(safeUser.id);

        res.cookie("accessToken", accessToken, accessCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        return res.json(new apiResponse(200, "logged in successfully", safeUser));
    } catch (err) {
        next(err);
    }
}

export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.userId

        return res.json(new apiResponse(200, "user profile fetched successfully", { userId }))
    } catch (err) {
        next(err)
    }
}

export function logout(req: Request, res: Response, next: NextFunction) {
    try {
        clearAuthCookies(res);

        return res.json(new apiResponse(200, "Logout successful"))
    } catch (err) {
        next(err)
    }
}

export function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            throw new apiError(401, "refresh token missing");
        }

        let payload: string | JwtPayload;

        try {
            payload = verifyRefreshToken(token);
        } catch {
            clearAuthCookies(res);
            throw new apiError(401, "invalid or expired refresh token");
        }

        if (typeof payload === "string" || typeof payload.id !== "number") {
            clearAuthCookies(res);
            throw new apiError(401, "invalid refresh token");
        }

        const accessToken = generateAccessToken(payload.id);

        res.cookie("accessToken", accessToken, accessCookieOptions);

        return res.json(new apiResponse(200, "token refreshed successfully", { userId: payload.id }));
    } catch (err) {
        next(err)
    }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body;

        if (!email) {
            throw new apiError(400, "email cant be empty")
        }
        if (!isValidEmail(email)) {
            throw new apiError(400, "invalid email")
        }
        if (email.length > 300) {
            throw new apiError(400, "email can't be longer then 300 letters")
        }

        const rows = await findByEmail(email)
        const user = rows[0]

        const genericMessage = "if an account with that email exists, a reset link has been sent"

        if (!user) {
            return res.json(new apiResponse(200, genericMessage))
        }

        const token = randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

        await setResetToken(email, token, expiresAt)

        const resetLink = `http://localhost:${process.env.PORT ?? 5000}/api/v1/auth/reset-password?token=${token}`

        console.log(`[forgot-password] reset link for ${email}: ${resetLink}`)

        return res.json(new apiResponse(
            200,
            genericMessage,
            process.env.NODE_ENV === "production" ? null : { resetLink }
        ))
    } catch (err) {
        next(err)
    }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            throw new apiError(400, "token or password cant be empty")
        }
        if (password.length < 8 || password.length > 15) {
            throw new apiError(400, "password must be between 8 and 15 characters")
        }

        const rows = await findByResetToken(token)
        const user = rows[0]

        if (!user) {
            throw new apiError(400, "invalid or expired reset token")
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await updatePassword(user.id, hashedPassword)

        return res.json(new apiResponse(200, "password reset successfully"))
    } catch (err) {
        next(err)
    }
}