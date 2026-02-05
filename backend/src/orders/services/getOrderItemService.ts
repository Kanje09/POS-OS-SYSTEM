import type { Request, Response } from "express";
import pool from "../../database/db";

interface ServiceResult {
  success: boolean;
  data?: any;
  error?: any;
}

//Get all order items
export const getOrderItemService = async (): Promise<ServiceResult> => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        oi.*,
        p.name as product_name,
        p.price as current_price,
        o.status as order_status
       FROM orderitem oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN orders o ON oi.order_id = o.id
       ORDER BY oi.created_at DESC`
    );

    return { success: true, data: rows };
  } catch (err) {
    console.error("Service error:", err);
    return { success: false, error: err };
  }
};

export const getOrderItemsByOrderId = async (orderId: number): Promise<ServiceResult> => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        oi.*,
        p.name as product_name,
        p.image_url
       FROM orderitem oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err };
  }
};