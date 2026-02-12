import { Request, Response } from "express";
import pool from "../../config/database/db";

export async function getProducts(req: Request, res: Response) {
  try {
    const [rows] = await pool.query(`SELECT id, name, price, image_url, in_stock, category_id FROM products`);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
}
