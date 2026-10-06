class apiError extends Error {
    statusCode: number;
    success: boolean;
    errors: any[];

    constructor(statusCode: number, message: string, error = []) {
        super(message)

        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = error;

        Error.captureStackTrace(this, this.constructor)
    }
}

export default apiError