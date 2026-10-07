import { Router } from "express";
import { createProduct, getProducts, getProduct } from "../controllers/product.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const productRouter = Router()

productRouter.post('/', authenticate, createProduct)
productRouter.get('/', authenticate, getProducts)
productRouter.get('/:id', authenticate, getProduct)

export default productRouter
