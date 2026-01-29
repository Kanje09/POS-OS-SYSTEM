import pool from "../database/db";
import type { Request, Response } from "express";

//Fetch all reports from teh database.
export const getReports = async (req: Request, res: Response) => {
    const [rows] = await pool.query("SELECT * FROM report");
    res.json(rows);
};

//Update an existing reports in the database.
export const UpdateReport = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { total } = req.body;

    await pool.query(
        "UPDATE report SET total = ? WHERE id = ?",
        [total, id]
    );
};

//Delete a product from the database
export const DeleteReport = async (req: Request, res: Response) => {
    const { id } = req.params;

    await pool.query("DELETE FROM report WHERE id = ?", [id]);
};