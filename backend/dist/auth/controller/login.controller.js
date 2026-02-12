"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const login = async (req, res) => {
    try {
        const { staff_id, password } = req.body;
        if (!staff_id || !password) {
            return res.status(400).json({ message: "staff_id and password are required." });
        }
        const result = await (0, auth_service_1.loginUser)(req.body);
        if (!result.success) {
            return res.status(401).json({ message: result.message || "Login failed." });
        }
        return res.json({
            success: true,
            message: "Login successful.",
            data: result.data, // usually { user, token }
        });
    }
    catch (err) {
        console.error("Login error", err);
        return res.status(500).json({ message: "Server error." });
    }
};
exports.login = login;
const getCurrentUser = async (req, res) => {
    return res.json({
        success: true,
        message: "User retrieved",
        data: req.user,
    });
};
exports.getCurrentUser = getCurrentUser;
