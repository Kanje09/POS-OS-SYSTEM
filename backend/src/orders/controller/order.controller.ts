import type { Request, Response } from "express";
import pool from "../../database/db";

//Fetch all order from the database.
export const getOrder = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM order");
        res.json(rows);
        res.json({ message: "Order Fetched." });
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders." })
    };
};

//Add aa new order to the database.
export const CreateOrder = async (req: Request, res: Response) => {
    try {
        const { total } = req.body;

        await pool.query(
            "INSERT INTO order (total) VALUES (?)",
            [total]
        );

        res.json({ message: "Order added." });
    } catch (error) {
        res.status(500).json({ message: "Error. Cannot add your order." })
    };
};

//Update an existing product in the database.
export const UpdateOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { total } = req.body;

        if (!id || !total) {
            return res.status(400).json({
                message: "ID and Total are required."
            });
        };

        if (typeof total !== "number") {
            return res.status(400).json({
                message: "Total must be a number."
            });
        }

        await pool.query(
            "UPDATE order SET total = ? WHERE id = ?",
            [total]
        );
        res.json({ message: "Update successfully." })
    } catch (error) {
        res.status(500).json({ message: "Error. Cannot update." });
    };
};

// Delete a product from the database.
export const DeleteOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM product WHERE id = ?", [id]);
    } catch (error) {

    };
};