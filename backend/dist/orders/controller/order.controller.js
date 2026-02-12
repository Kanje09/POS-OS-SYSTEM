"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = getOrders;
exports.searchByCode = searchByCode;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
const order_service_1 = require("../services/order.service");
async function getOrders(req, res) {
    try {
        const orders = await (0, order_service_1.getAllOrdersService)();
        res.json({ success: true, data: orders });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch orders", error: err.message });
    }
}
async function searchByCode(req, res) {
    try {
        const code = String(req.params.code || "").trim();
        console.log('🎯 Search endpoint hit with code:', code);
        if (code.length !== 4) {
            console.log('❌ Invalid code length');
            return res.status(400).json({ message: "Invalid pickup code" });
        }
        const order = await (0, order_service_1.findOrderByPickupCodeService)(code);
        console.log('📦 Service returned:', order ? 'Order found' : 'No order');
        if (!order) {
            console.log('❌ Sending 404 response');
            return res.status(404).json({ message: `Pickup code ${code} not found` });
        }
        console.log('✅ Sending success response');
        res.json({ success: true, data: order });
    }
    catch (err) {
        console.error('💥 Error in searchByCode:', err);
        res.status(500).json({ message: "Search failed", error: err.message });
    }
}
async function createOrder(req, res) {
    try {
        const created = await (0, order_service_1.createOrderService)(req.body);
        res.status(201).json({ success: true, data: created });
    }
    catch (err) {
        res.status(400).json({ message: "Cannot create order.", error: err.message || err });
    }
}
async function updateOrder(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id)
            return res.status(400).json({ message: "Invalid id" });
        const ok = await (0, order_service_1.updateOrderService)(id, req.body);
        if (!ok)
            return res.status(404).json({ message: "Order not found" });
        res.json({ success: true, message: "Order updated" });
    }
    catch (err) {
        res.status(400).json({ message: "Cannot update order.", error: err.message || err });
    }
}
