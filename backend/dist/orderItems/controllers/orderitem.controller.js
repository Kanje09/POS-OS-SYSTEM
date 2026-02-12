"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteOrderItem = exports.UpdateOrderItem = exports.createOrderItem = exports.getOrderItemController = exports.getOrderItem = void 0;
const db_1 = __importDefault(require("../../config/database/db"));
//Fetch all Order Items from the database.
const getOrderItem = async (req, res) => {
    try {
        const [rows] = await db_1.default.query("SELECT * FROM useritem");
        res.json({ rows, message: "Order items fetched." });
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching order items", err });
    }
    ;
};
exports.getOrderItem = getOrderItem;
const getOrderItemController = async (req, res) => {
    try {
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching order items", err });
    }
    ;
};
exports.getOrderItemController = getOrderItemController;
//Add a new order item to the database.
const createOrderItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity) {
            return res.status(400).json({
                message: "Quantity is required."
            });
        }
        if (quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be greater than zero."
            });
        }
        if (typeof quantity !== "number") {
            return res.status(400).json({
                message: "Quantity must be a number."
            });
        }
        await db_1.default.query("INSERT INTO orderitem (quantity) VALUES (?)", [quantity]);
        res.json({
            message: "Order Item added."
        });
    }
    catch (err) {
        res.status(500).json({ message: "Error adding order item", err });
    }
};
exports.createOrderItem = createOrderItem;
//Update an existing orderItem in the database.
const UpdateOrderItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        await db_1.default.query("UPDATE orderitem SET quantity = ? WHERE id = ?", [quantity, id]);
        res.json({ message: "Order Item updated." });
    }
    catch (err) {
        res.status(500).json({ message: "Error updating order item", err });
    }
    ;
};
exports.UpdateOrderItem = UpdateOrderItem;
//Delete a product from the database.
const DeleteOrderItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query("DELETE FROM orderitem WHERE id = ?", [id]);
        res.json({ message: "Order Item deleted." });
    }
    catch (err) {
        res.status(500).json({ message: "Error deleting order item", err });
    }
    ;
};
exports.DeleteOrderItem = DeleteOrderItem;
