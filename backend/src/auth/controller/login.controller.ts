import type { Request, Response } from "express";
import { loginUser } from "../services/auth.service";

export const login = async (req: Request, res: Response) => {
    try {
        const { staff_id, password } = req.body;

        if (!staff_id || !password) {
            return res.status(400).json({ message: "staff_id and password are required." });
        }

        const result = await loginUser(req.body);

        if (!result.success) {
            return res.status(401).json({ message: result.message || "Login failed." });
        }

        return res.json({
            success: true,
            message: "Login successful.",
            data: result.data, // usually { user, token }
        });
    } catch (err) {
        console.error("Login error", err);
        return res.status(500).json({ message: "Server error." });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    return res.json({
        success: true,
        message: "User retrieved",
        data: req.user,
    });
};
