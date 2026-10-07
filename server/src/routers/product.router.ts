import { Router } from "express";
import { createProduct, getProducts, getProduct, updateProduct } from "../controllers/product.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const productRouter = Router()

productRouter.post('/', authenticate, createProduct)
productRouter.get('/', authenticate, getProducts)
productRouter.get('/:id', authenticate, getProduct)
productRouter.put('/:id', authenticate, updateProduct)

export default productRouter
