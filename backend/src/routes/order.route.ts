import { Router } from "express";
import { getOrder, CreateOrder, UpdateOrder, DeleteOrder } from "../orders/controller/order.controller";

const router = Router();

router.get("/order", getOrder);
router.post("/order", CreateOrder);
router.put("/order", UpdateOrder);
router.delete("/order", DeleteOrder);

export default router;