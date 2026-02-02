import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

//Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: "Admin" | "Cashier" | "Customer";
            };
        }
    }
}

//Check if user is logged in

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided." });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        req.user = {
            id: decoded.id,
            email: decoded.username,
            role: decoded.role,
        };

        next(); //Continue to controller

    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

//Check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "Admin") {
        res.status(403).json({ message: "Access denied. Admins only." });
    } else {
        next();
    }
};

//Check if user is cashier or admin
export const isAdminOrCashier = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "Admin" && req.user?.role !== "Cashier") {
        res.status(403).json({ message: "Access denied. Admins or Cashiers only." });
    } else {
        next();
    }
};