import pool from "../../config/database/db"
import type { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

// Fetch all user credentials from the database.
export const getAuthority = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users");
        res.json({ message: "Fetch successful.", data: rows });
    } catch (error) {
        res.status(500).json({ message: "Error fetch." });
    };
};

//Add a new user to the database.
export const createAuthority = async (req: Request, res: Response) => {
    try {
        const { staff_id, password, name, role } = req.body;

        if (!staff_id || !password || !name || !role) {
            return res.status(400).json({
                message: "staff_id, Password, name and Role is required."
            });
        }

        const result = await registerUser(req.body);

        if (!result.success) {
            return res.status(400).json({ message: result.message || "Error, cannot add." });
        }

        res.status(201).json({ message: "Sign up complete." });
    } catch (error) {
        res.status(500).json({ message: "Error, cannot add." });
    };
};

//Update an existing user credentials in the database.
export const UpdateAuthority = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { staff_id, password, name, role } = req.body;

        await pool.query(
            "UPDATE users SET staff_id = ?, password = ?, name = ?, role = ? WHERE id = ?",
            [staff_id, password, name, role, id]
        );

        res.json({ message: "Credentials Updated." });
    } catch (error) {
        res.status(500).json({ message: "Error, Cannot update credentials." });
    };
};

//Delete a user credentials from the database
export const DeleteAuthority = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM user WHERE id = ?", [id]);

        res.json({ message: "Delete successful." });
    } catch (error) {
        res.status(500).json({ message: "Error, Cannot delete." })
    }
};

export const Login = async (req: Request, res: Response) => {
    try {
        const result = await loginUser(req.body);

        if (!result.success) {
            return res.status(400).json({ message: result.message || "Login failed." });
        }

        res.json({
            message: "Login successful.",
            data: result.data
        });

    } catch (err) {
        console.error("Login error");
        res.status(500).json({
            message: "server error."
        });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    res.json({
        message: "User retrieve",
        data: req.user
    });
};