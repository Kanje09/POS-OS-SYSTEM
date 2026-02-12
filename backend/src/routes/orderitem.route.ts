import { Router } from "express";
import { getOrderItem, createOrderItem, UpdateOrderItem, DeleteOrderItem } from "../orderItems/controllers/orderitem.controller";

const router = Router();

router.get("/orderItem", getOrderItem);
router.post("/orderItem", createOrderItem);
router.put("/orderItem", UpdateOrderItem);
router.delete("/orderItem", DeleteOrderItem);

export default router;