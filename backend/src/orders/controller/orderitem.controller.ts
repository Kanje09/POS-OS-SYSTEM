import pool from "../../database/db";
import type { Request, Response } from "express";
import { getOrderItemService } from "../services/getOrderItemService";

//Fetch all Order Items from the database.
export const getOrderItem = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM useritem");
        res.json({ rows, message: "Order items fetched." });
    } catch (err) {
        res.status(500).json({ message: "Error fetching order items", err });
    };
};

export const getOrderItemController = async (req: Request, res: Response) => {
    try {
        const result = await getOrderItemService();

        res.json({
            message: "Order Items fetched.",
            data: result
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching order items", err });
    };
};


//Add a new order item to the database.
export const createOrderItem = async (req: Request, res: Response) => {
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

        await pool.query(
            "INSERT INTO orderitem (quantity) VALUES (?)",
            [quantity]
        );

        res.json({
            message: "Order Item added."
        });

    } catch (err) {
        res.status(500).json({ message: "Error adding order item", err });
    }
};

//Update an existing orderItem in the database.
export const UpdateOrderItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        await pool.query(
            "UPDATE orderitem SET quantity = ? WHERE id = ?",
            [quantity, id]
        );
        res.json({ message: "Order Item updated." })
    } catch (err) {
        res.status(500).json({ message: "Error updating order item", err });
    };
};

//Delete a product from the database.
export const DeleteOrderItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM orderitem WHERE id = ?", [id]);
        res.json({ message: "Order Item deleted." })
    } catch (err) {
        res.status(500).json({ message: "Error deleting order item", err });
    };
};
