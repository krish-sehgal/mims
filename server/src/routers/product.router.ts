import { Router } from "express";
import { createProduct, getProducts, getProduct, updateProduct } from "../controllers/product.controller.js";
import { addProductUnit, deleteProductUnit, getProductUnits, updateProductUnit } from "../controllers/productUnit.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const productRouter = Router()

productRouter.post('/', authenticate, createProduct)
productRouter.get('/', authenticate, getProducts)
productRouter.get('/:id', authenticate, getProduct)
productRouter.put('/:id', authenticate, updateProduct)

productRouter.get('/:id/units', authenticate, getProductUnits)
productRouter.post('/:id/units', authenticate, addProductUnit)
productRouter.patch('/:id/units/:unitId', authenticate, updateProductUnit)
productRouter.delete('/:id/units/:unitId', authenticate, deleteProductUnit)

export default productRouter
