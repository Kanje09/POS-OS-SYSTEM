"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
const db_1 = __importDefault(require("../../config/database/db"));
async function getProducts(req, res) {
    try {
        const [rows] = await db_1.default.query(`SELECT id, name, price, image_url, in_stock, category_id FROM products`);
        res.json({ success: true, data: rows });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch products", error: err.message });
    }
}
