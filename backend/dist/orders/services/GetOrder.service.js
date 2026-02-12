"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrderByPickupCode = exports.getOrderItemService = void 0;
const db_1 = __importDefault(require("../../config/database/db"));
//Get all orders (for POS dashboard)
const getOrderItemService = async () => {
    try {
        const [rows] = await db_1.default.query(`SELECT
        o.id,
        o.customer_id,
        o.pickup_code,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', oi.id,
              'name', oi.name,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ),
          JSON_ARRAY()
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status != 'completed'
        AND o.status != 'cancelled'
      GROUP BY
        o.id,
        o.customer_id,
        o.pickup_code,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at
      ORDER BY o.created_at DESC;
    `);
        return { success: true, data: rows };
    }
    catch (err) {
        console.error("Service error:", err);
        return { success: false, error: err };
    }
};
exports.getOrderItemService = getOrderItemService;
// Search orders by pickup code
const findOrderByPickupCode = async (code) => {
    try {
        const [rows] = await db_1.default.query(`SELECT
        o.id,
        o.customer_id,
        o.pickup_code,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at,
        COALESCE(
          JSON_ARRAYAGG(
            IF(oi.id IS NULL, NULL,
              JSON_OBJECT(
                'id', oi.id,
                'name', oi.name,
                'quantity', oi.quantity,
                'price', oi.price
              )
            )
          ),
          JSON_ARRAY()
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.pickup_code = ?
      GROUP BY o.id
      LIMIT 1;`, [code]);
        // optional: return single object instead of array
        const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        return { success: true, data };
    }
    catch (err) {
        console.error("Service error:", err);
        return { success: false, error: err };
    }
};
exports.findOrderByPickupCode = findOrderByPickupCode;
