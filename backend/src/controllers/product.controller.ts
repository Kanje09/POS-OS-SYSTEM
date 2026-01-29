import pool from "../database/db";
import type { Request, Response } from "express";

// Fetch all products from the database.
export const getProducts = async (req: Request, res: Response) => {
  const [rows] = await pool.query("SELECT * FROM product");
  res.json(rows);
};

// Add a new product to the database.
export const createProduct = async (req: Request, res: Response) => {
  const { name, price, quantity } = req.body;

  await pool.query(
    "INSERT INTO product (name, price, quantity) VALUES (?, ?, ?)",
    [name, price, quantity]
  );

  res.json({ message: "Product added" });
};

// Update an existing product in the database.
export const UpdateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, quantity } = req.body;

  await pool.query(
    "UPDATE product SET name = ?, price = ?, quantity = ? WHERE id = ?",
    [name, price, quantity, id]
  );
};

// Delete a product from the database.
export const DeleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  await pool.query("DELETE FROM product WHERE id = ?", [id]);
};