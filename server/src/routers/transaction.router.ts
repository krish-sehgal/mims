import { Router } from "express";
import { createTransaction, getTransactions, getTransaction } from "../controllers/transaction.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const transactionRouter = Router()

transactionRouter.get('/', authenticate, getTransactions)
transactionRouter.get('/:id', authenticate, getTransaction)
transactionRouter.post('/', authenticate, createTransaction)

export default transactionRouter
