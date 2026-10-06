import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import apiError from "../utils/apiError.js";

const { JsonWebTokenError } = jwt;

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        let token = req.cookies?.accessToken;

        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.slice(7);
        }

        if (!token) {
            throw new apiError(401, "authentication required");
        }

        const payload: string | JwtPayload = jwt.verify(token, process.env.JWT_SECRET!);

        if (typeof payload === "string" || typeof payload.id !== "number") {
            throw new apiError(401, "invalid token");
        }

        req.userId = payload.id;

        next();
    } catch (err) {
        if (err instanceof apiError) {
            next(err);
        } else if (err instanceof JsonWebTokenError) {
            next(new apiError(401, "invalid or expired token"));
        } else {
            next(err);
        }
    }
};

export default authenticate;
