import pool from "../database/db";
import type { Request, Response } from "express";
import { getOrderItemService } from "../services/getOrderItemService";

//Fetch all Order Items from the database.
export const getOrderItem = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM useritem");
        res.json({ rows, message: "Order items fetched." });
    } catch (error) {
        res.status(500).json({ message: "Error fetching order items", error });
    };
};

export const getOrderItemController = async (req: Request, res: Response) => {
    try {
        const result = await getOrderItemService()
        res.json({ message: "Order Items fetched.", data: result })
    } catch (error) {
        res.status(500).json({ message: "Error fetching order items", error });
    };
};


//Add a new order item to the database.
export const createOrderItem = async (req: any, res: any) => {
    try {
        const { quantity } = req.body;

        await pool.query(
            "INSERT INTO orderitem (quantity) VALUES (?)",
            [quantity]
        );

        res.json({ message: "Order Item added." })
    } catch (error) {
        res.status(500).json({ message: "Error adding order item", error });
    };
};

//Update an existing orderItem in the database.
export const UpdateOrderItem = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        await pool.query(
            "UPDATE orderitem SET quantity = ? WHERE id = ?",
            [quantity, id]
        );
        res.json({ message: "Order Item updated." })
    } catch (error) {
        res.status(500).json({ message: "Error updating order item", error });
    };
};

//Delete a product from the database.
export const DeleteOrderItem = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM orderitem WHERE id = ?", [id]);
        res.json({ message: "Order Item deleted." })
    } catch (error) {
        res.status(500).json({ message: "Error deleting order item", error });
    };
};
