"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminOrCashier = exports.isAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../../config/index.js");
// Verify logged-in user
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided." });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, index_js_1.config.JWT_SECRET, {
            algorithms: ["HS512"],
        });
        req.user = {
            id: decoded.id,
            staff_id: decoded.staff_id,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};
exports.authenticate = authenticate;
// Admin only
const isAdmin = (req, res, next) => {
    if (req.user?.role !== "Admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};
exports.isAdmin = isAdmin;
// Admin or Cashier
const isAdminOrCashier = (req, res, next) => {
    if (req.user?.role !== "Admin" &&
        req.user?.role !== "Cashier") {
        return res
            .status(403)
            .json({ message: "Access denied. Admins or Cashiers only." });
    }
    next();
};
exports.isAdminOrCashier = isAdminOrCashier;
