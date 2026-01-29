import { json } from "node:stream/consumers";
import pool from "../database/db";

//Fetch all order from the database.
export const getOrder = async (req: any, res: any) => {
    try {
        const [rows] = await pool.query("SELECT * FROM order");
        res.json(rows);
        res.json({ message: "Order Fetched." });
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders." })
    };
};

//Add aa new order to the database.
export const CreateOrder = async (req: any, res: any) => {
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
export const UpdateOrder = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { total } = req.body;

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
export const DeleteOrder = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM product WHERE id = ?", [id]);
    } catch (error) {

    };
};