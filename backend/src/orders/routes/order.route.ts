import { Router } from "express";
import { createOrder, getOrders, searchByCode, updateOrder } from "../controller/order.controller";

const router = Router();

router.get("/getorder", getOrders);
router.get("/search/:code", searchByCode);
router.post("/order", createOrder);
router.put("/:id", updateOrder);

export default router;
