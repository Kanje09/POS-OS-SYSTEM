import { Request, Response } from "express";
import {
    createOrderService,
    findOrderByPickupCodeService,
    getAllOrdersService,
    updateOrderService,
} from "../services/order.service";

export async function getOrders(req: Request, res: Response) {
    try {
        const orders = await getAllOrdersService();
        res.json({ success: true, data: orders });
    } catch (err: any) {
        res.status(500).json({ message: "Failed to fetch orders", error: err.message });
    }
}

export async function searchByCode(req: Request, res: Response) {
    try {
        const code = String(req.params.code || "").trim();
        console.log('🎯 Search endpoint hit with code:', code);

        if (code.length !== 4) {
            console.log('❌ Invalid code length');
            return res.status(400).json({ message: "Invalid pickup code" });
        }

        const order = await findOrderByPickupCodeService(code);
        console.log('📦 Service returned:', order ? 'Order found' : 'No order');

        if (!order) {
            console.log('❌ Sending 404 response');
            return res.status(404).json({ message: `Pickup code ${code} not found` });
        }

        console.log('✅ Sending success response');
        res.json({ success: true, data: order });
    } catch (err: any) {
        console.error('💥 Error in searchByCode:', err);
        res.status(500).json({ message: "Search failed", error: err.message });
    }
}

export async function createOrder(req: Request, res: Response) {
    try {
        const created = await createOrderService(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err: any) {
        res.status(400).json({ message: "Cannot create order.", error: err.message || err });
    }
}

export async function updateOrder(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: "Invalid id" });

        const ok = await updateOrderService(id, req.body);
        if (!ok) return res.status(404).json({ message: "Order not found" });

        res.json({ success: true, message: "Order updated" });
    } catch (err: any) {
        res.status(400).json({ message: "Cannot update order.", error: err.message || err });
    }
}
