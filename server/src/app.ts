import express from "express"
import "dotenv/config"
import morgan from "morgan"
import cookieParser from "cookie-parser"

import authRouter from "./routers/auth.router.js"
import productRouter from "./routers/product.router.js"
import transactionRouter from "./routers/transaction.router.js"
import unitRouter from "./routers/unit.router.js"
import apiError from "./utils/apiError.js"
import errorHandler from "./middlewares/error.middleware.js"

const app = express()

app.use(express.json({limit: "16kb"}))
app.use(cookieParser())
app.use(morgan('dev'))

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/product', productRouter)
app.use('/api/v1/transaction', transactionRouter)
app.use('/api/v1/unit', unitRouter)

app.get('/', (req, res) => {
    res.json({
        status: 200,
        message: "I'm healthy"
    })
})

app.use((req, res, next) => {
    next(new apiError(404, 'Route not found'))
})

app.use(errorHandler)

export default app