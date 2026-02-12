import pool from "../../config/database/db";
import { random4Digit } from "../../util/pickupcode";
import type {
    CreateOrderInput,
    OrderRow,
    PaymentMethod,
    PaymentStatus,
    OrderStatus
} from "../types/order.type";

function isDuplicatePickupCodeError(err: any) {
    // MySQL duplicate key = ER_DUP_ENTRY
    return err?.code === "ER_DUP_ENTRY";
}

export async function getAllOrdersService(): Promise<OrderRow[]> {
    const [rows] = await pool.query<any[]>(
        `
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
    `
    );

    // JSON_ARRAYAGG returns [null] if no items; clean it up
    return rows.map((r) => ({
        ...r,
        items: Array.isArray(r.items) ? r.items.filter(Boolean) : [],
    }));
}

export async function findOrderByPickupCodeService(code: string): Promise<OrderRow | null> {
    console.log('🔍 Searching for pickup code:', code, 'Type:', typeof code);

    // Validate that code is exactly 4 digits (keeps leading zeros)
    if (!/^\d{4}$/.test(code)) {
        console.log('❌ Invalid pickup code format');
        return null;
    }

    const [rows] = await pool.query<any[]>(
        `
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
    `,
        [code]  // ✅ Pass as string, not number
    );

    console.log('📊 Query result rows:', rows.length);

    if (rows.length > 0) {
        console.log('✅ Found order:', rows[0]);
    } else {
        console.log('❌ No order found');
    }

    if (!rows.length) return null;

    const row = rows[0];
    return {
        ...row,
        items: Array.isArray(row.items) ? row.items.filter(Boolean) : []
    };
}

export async function createOrderService(input: CreateOrderInput): Promise<OrderRow> {
    if (!input.items || input.items.length === 0) {
        throw new Error("Order items are required.");
    }

    // basic validate
    for (const it of input.items) {
        if (!it.name || it.quantity <= 0 || it.price < 0) {
            throw new Error("Invalid item in order.");
        }
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // compute total
        const total_amount = input.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

        // order_number: next sequential
        const [maxRows] = await conn.query<any[]>(`SELECT COALESCE(MAX(order_number), 0) AS maxNo FROM orders`);
        const nextOrderNumber = Number(maxRows[0].maxNo) + 1;

        // generate UNIQUE pickup code (DB guarantees uniqueness with uq_pickup_code)
        let pickup_code = "";
        for (let attempt = 0; attempt < 20; attempt++) {
            pickup_code = random4Digit();
            try {
                const payment_method = (input.payment_method || "cash") as PaymentMethod;
                const payment_status: PaymentStatus = "pending";
                const status: OrderStatus = "pending";
                const customer_id = input.customer_id ?? null;

                const [result] = await conn.query<any>(
                    `INSERT INTO orders
          (customer_id, pickup_code, order_number, total_amount, status, payment_method, payment_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [customer_id, pickup_code, nextOrderNumber, total_amount, status, payment_method, payment_status]
                );

                const orderId = result.insertId as number;

                // insert items
                for (const it of input.items) {
                    const lineTotal = it.price * it.quantity;
                    await conn.query(
                        `INSERT INTO order_items
            (order_id, product_id, name, quantity, price, total_price)
            VALUES (?, ?, ?, ?, ?, ?)`,
                        [orderId, it.product_id ?? null, it.name, it.quantity, it.price, lineTotal]
                    );

                    // OPTIONAL stock decrement if product_id is provided
                    if (it.product_id) {
                        const [prodRows] = await conn.query<any[]>(
                            `SELECT in_stock FROM products WHERE id = ? FOR UPDATE`,
                            [it.product_id]
                        );
                        if (!prodRows.length) throw new Error(`Product not found: ${it.product_id}`);
                        const inStock = Number(prodRows[0].in_stock);
                        if (inStock < it.quantity) throw new Error("Item stock must be > 0.");
                        await conn.query(
                            `UPDATE products SET in_stock = in_stock - ? WHERE id = ?`,
                            [it.quantity, it.product_id]
                        );
                    }
                }

                await conn.commit();

                const created = await findOrderByPickupCodeService(pickup_code);
                if (!created) throw new Error("Failed to fetch created order.");
                return created;
            } catch (err: any) {
                if (isDuplicatePickupCodeError(err)) {
                    continue; // retry with a new pickup_code
                }
                throw err;
            }
        }
        throw new Error("Failed to generate a unique pickup code. Try again.");
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

export async function updateOrderService(
    id: number,
    patch: Partial<{
        status: OrderStatus;
        payment_method: PaymentMethod;
        payment_status: PaymentStatus;
    }>
) {
    const allowed: any = {};
    if (patch.status) allowed.status = patch.status;
    if (patch.payment_method) allowed.payment_method = patch.payment_method;
    if (patch.payment_status) allowed.payment_status = patch.payment_status;

    const keys = Object.keys(allowed);
    if (keys.length === 0) {
        throw new Error("No valid fields to update.");
    }

    const sets = keys.map((k) => `${k} = ?`).join(", ");
    const values = keys.map((k) => (allowed as any)[k]);

    const [result] = await pool.query<any>(
        `UPDATE orders SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id]
    );

    return result.affectedRows > 0;
}