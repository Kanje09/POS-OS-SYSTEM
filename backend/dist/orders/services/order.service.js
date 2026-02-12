"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrdersService = getAllOrdersService;
exports.findOrderByPickupCodeService = findOrderByPickupCodeService;
exports.createOrderService = createOrderService;
exports.updateOrderService = updateOrderService;
const db_1 = __importDefault(require("../../config/database/db"));
const pickupcode_1 = require("../../util/pickupcode");
function isDuplicatePickupCodeError(err) {
    // MySQL duplicate key = ER_DUP_ENTRY
    return err?.code === "ER_DUP_ENTRY";
}
async function getAllOrdersService() {
    const [rows] = await db_1.default.query(`
    SELECT o.*,
      COALESCE(
        JSON_ARRAYAGG(
          IF(oi.id IS NULL, NULL,
            JSON_OBJECT(
              'id', oi.id,
              'name', oi.name,
              'quantity', oi.quantity,
              'price', oi.price,
              'total_price', oi.total_price
            )
          )
        ),
        JSON_ARRAY()
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    `);
    // JSON_ARRAYAGG returns [null] if no items; clean it up
    return rows.map((r) => ({
        ...r,
        items: Array.isArray(r.items) ? r.items.filter(Boolean) : [],
    }));
}
async function findOrderByPickupCodeService(code) {
    console.log('🔍 Searching for pickup code:', code, 'Type:', typeof code);
    // Validate that code is exactly 4 digits (keeps leading zeros)
    if (!/^\d{4}$/.test(code)) {
        console.log('❌ Invalid pickup code format');
        return null;
    }
    const [rows] = await db_1.default.query(`
    SELECT o.*,
      COALESCE(
        JSON_ARRAYAGG(
          IF(oi.id IS NULL, NULL,
            JSON_OBJECT(
              'id', oi.id,
              'name', oi.name,
              'quantity', oi.quantity,
              'price', oi.price,
              'total_price', oi.total_price
            )
          )
        ),
        JSON_ARRAY()
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.pickup_code = ?
    GROUP BY o.id
    LIMIT 1
    `, [code] // ✅ Pass as string, not number
    );
    console.log('📊 Query result rows:', rows.length);
    if (rows.length > 0) {
        console.log('✅ Found order:', rows[0]);
    }
    else {
        console.log('❌ No order found');
    }
    if (!rows.length)
        return null;
    const row = rows[0];
    return {
        ...row,
        items: Array.isArray(row.items) ? row.items.filter(Boolean) : []
    };
}
async function createOrderService(input) {
    if (!input.items || input.items.length === 0) {
        throw new Error("Order items are required.");
    }
    // basic validate
    for (const it of input.items) {
        if (!it.name || it.quantity <= 0 || it.price < 0) {
            throw new Error("Invalid item in order.");
        }
    }
    const conn = await db_1.default.getConnection();
    try {
        await conn.beginTransaction();
        // compute total
        const total_amount = input.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
        // order_number: next sequential
        const [maxRows] = await conn.query(`SELECT COALESCE(MAX(order_number), 0) AS maxNo FROM orders`);
        const nextOrderNumber = Number(maxRows[0].maxNo) + 1;
        // generate UNIQUE pickup code (DB guarantees uniqueness with uq_pickup_code)
        let pickup_code = "";
        for (let attempt = 0; attempt < 20; attempt++) {
            pickup_code = (0, pickupcode_1.random4Digit)();
            try {
                const payment_method = (input.payment_method || "cash");
                const payment_status = "pending";
                const status = "pending";
                const customer_id = input.customer_id ?? null;
                const [result] = await conn.query(`INSERT INTO orders
          (customer_id, pickup_code, order_number, total_amount, status, payment_method, payment_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)`, [customer_id, pickup_code, nextOrderNumber, total_amount, status, payment_method, payment_status]);
                const orderId = result.insertId;
                // insert items
                for (const it of input.items) {
                    const lineTotal = it.price * it.quantity;
                    await conn.query(`INSERT INTO order_items
            (order_id, product_id, name, quantity, price, total_price)
            VALUES (?, ?, ?, ?, ?, ?)`, [orderId, it.product_id ?? null, it.name, it.quantity, it.price, lineTotal]);
                    // OPTIONAL stock decrement if product_id is provided
                    if (it.product_id) {
                        const [prodRows] = await conn.query(`SELECT in_stock FROM products WHERE id = ? FOR UPDATE`, [it.product_id]);
                        if (!prodRows.length)
                            throw new Error(`Product not found: ${it.product_id}`);
                        const inStock = Number(prodRows[0].in_stock);
                        if (inStock < it.quantity)
                            throw new Error("Item stock must be > 0.");
                        await conn.query(`UPDATE products SET in_stock = in_stock - ? WHERE id = ?`, [it.quantity, it.product_id]);
                    }
                }
                await conn.commit();
                const created = await findOrderByPickupCodeService(pickup_code);
                if (!created)
                    throw new Error("Failed to fetch created order.");
                return created;
            }
            catch (err) {
                if (isDuplicatePickupCodeError(err)) {
                    continue; // retry with a new pickup_code
                }
                throw err;
            }
        }
        throw new Error("Failed to generate a unique pickup code. Try again.");
    }
    catch (e) {
        await conn.rollback();
        throw e;
    }
    finally {
        conn.release();
    }
}
async function updateOrderService(id, patch) {
    const allowed = {};
    if (patch.status)
        allowed.status = patch.status;
    if (patch.payment_method)
        allowed.payment_method = patch.payment_method;
    if (patch.payment_status)
        allowed.payment_status = patch.payment_status;
    const keys = Object.keys(allowed);
    if (keys.length === 0) {
        throw new Error("No valid fields to update.");
    }
    const sets = keys.map((k) => `${k} = ?`).join(", ");
    const values = keys.map((k) => allowed[k]);
    const [result] = await db_1.default.query(`UPDATE orders SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
    return result.affectedRows > 0;
}
