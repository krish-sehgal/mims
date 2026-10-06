import express from "express"
import "dotenv/config"
import morgan from "morgan"

import authRouter from "./routers/auth.router.js"
import apiError from "./utils/apiError.js"
import errorHandler from "./middlewares/error.middleware.js"

const app = express()

app.use(express.json({limit: "16kb"}))
app.use(morgan('dev'))

app.use('/api/v1/auth', authRouter)

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