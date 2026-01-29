import { Router } from "express";
import { getProducts, createProduct, UpdateProduct, DeleteProduct } from "../controllers/product.controller";

const router = Router();

router.get("/product", getProducts);
router.post("/product", createProduct);
router.put("/product", UpdateProduct);
router.delete("/product", DeleteProduct);

export default router;