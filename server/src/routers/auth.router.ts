import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.get('/me', authenticate, me)
authRouter.post('/logout', authenticate, logout)

export default authRouter