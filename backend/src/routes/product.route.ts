import { Router } from "express";
import { getProducts } from "../Product/controllers/product.controller";

const router = Router();
router.get("/", getProducts);
export default router;
