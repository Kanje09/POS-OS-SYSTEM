import type { Request, Response, NextFunction } from "express";

export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
    const { name, price, category, quantity } = req.body;

    if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Product name is required and must be a string." });
    }

    if (!price || typeof price !== "number" || price < 0) {
        return res.status(400).json({ message: "Valid price is required." });
    }

    if (!category || typeof category !== "string") {
        return res.status(400).json({ message: "Product category is required and must be a string." });
    }

    if (!quantity || typeof quantity !== "number" || quantity < 0) {
        res.status(400).json({ message: "Valid quantity is required." });
    }
    next();
};

