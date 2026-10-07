import { Router } from "express";
import { createUnit, getUnit, getUnits, updateUnit } from "../controllers/unit.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const unitRouter = Router()

unitRouter.get('/', authenticate, getUnits)
unitRouter.get('/:id', authenticate, getUnit)
unitRouter.post('/', authenticate, createUnit)
unitRouter.patch('/:id', authenticate, updateUnit)

export default unitRouter
