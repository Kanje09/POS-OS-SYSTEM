import pool from "../../config/database/db";

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: unknown;
}

//Get all orders (for POS dashboard)
export const getOrderItemService = async (): Promise<ServiceResult> => {
  try {
    const [rows] = await pool.query(
      `SELECT
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
  } catch (err) {
    console.error("Service error:", err);
    return { success: false, error: err };
  }
};

// Search orders by pickup code
export const findOrderByPickupCode = async (
  code: string
): Promise<ServiceResult<any>> => {
  try {
    const [rows] = await pool.query(
      `SELECT
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
      LIMIT 1;`,
      [code]
    );

    // optional: return single object instead of array
    const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    return { success: true, data };
  } catch (err) {
    console.error("Service error:", err);
    return { success: false, error: err };
  }
};
