import type { Response, Request, NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    console.error(err.stack);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        error:
            process.env.NODE_ENV === "development"
                ? {
                    name: err.name,
                    stack: err.stack,
                }
                : undefined,
    });
};

export default errorHandler;