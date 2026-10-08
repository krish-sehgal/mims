import { Router } from "express";
import { forgotPassword, login, logout, me, refresh, register, resetPassword } from "../controllers/auth.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh', refresh)
authRouter.get('/me', authenticate, me)
authRouter.post('/logout', authenticate, logout)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)

export default authRouter