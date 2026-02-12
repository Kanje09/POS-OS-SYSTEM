import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                staff_id: string;
                role: "Admin" | "Cashier" | "Customer";
            };
        }
    }
}

// Verify logged-in user
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided." });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, config.JWT_SECRET, {
            algorithms: ["HS512"],
        }) as any;

        req.user = {
            id: decoded.id,
            staff_id: decoded.staff_id,
            role: decoded.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

// Admin only
export const isAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== "Admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

// Admin or Cashier
export const isAdminOrCashier = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (
        req.user?.role !== "Admin" &&
        req.user?.role !== "Cashier"
    ) {
        return res
            .status(403)
            .json({ message: "Access denied. Admins or Cashiers only." });
    }
    next();
};
