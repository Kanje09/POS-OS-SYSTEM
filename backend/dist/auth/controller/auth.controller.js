"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.Login = exports.DeleteAuthority = exports.UpdateAuthority = exports.createAuthority = exports.getAuthority = void 0;
const db_1 = __importDefault(require("../../config/database/db"));
const auth_service_1 = require("../services/auth.service");
// Fetch all user credentials from the database.
const getAuthority = async (req, res) => {
    try {
        const [rows] = await db_1.default.query("SELECT * FROM users");
        res.json({ message: "Fetch successful.", data: rows });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetch." });
    }
    ;
};
exports.getAuthority = getAuthority;
//Add a new user to the database.
const createAuthority = async (req, res) => {
    try {
        const { staff_id, password, name, role } = req.body;
        if (!staff_id || !password || !name || !role) {
            return res.status(400).json({
                message: "staff_id, Password, name and Role is required."
            });
        }
        const result = await (0, auth_service_1.registerUser)(req.body);
        if (!result.success) {
            return res.status(400).json({ message: result.message || "Error, cannot add." });
        }
        res.status(201).json({ message: "Sign up complete." });
    }
    catch (error) {
        res.status(500).json({ message: "Error, cannot add." });
    }
    ;
};
exports.createAuthority = createAuthority;
//Update an existing user credentials in the database.
const UpdateAuthority = async (req, res) => {
    try {
        const { id } = req.params;
        const { staff_id, password, name, role } = req.body;
        await db_1.default.query("UPDATE users SET staff_id = ?, password = ?, name = ?, role = ? WHERE id = ?", [staff_id, password, name, role, id]);
        res.json({ message: "Credentials Updated." });
    }
    catch (error) {
        res.status(500).json({ message: "Error, Cannot update credentials." });
    }
    ;
};
exports.UpdateAuthority = UpdateAuthority;
//Delete a user credentials from the database
const DeleteAuthority = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query("DELETE FROM user WHERE id = ?", [id]);
        res.json({ message: "Delete successful." });
    }
    catch (error) {
        res.status(500).json({ message: "Error, Cannot delete." });
    }
};
exports.DeleteAuthority = DeleteAuthority;
const Login = async (req, res) => {
    try {
        const result = await (0, auth_service_1.loginUser)(req.body);
        if (!result.success) {
            return res.status(400).json({ message: result.message || "Login failed." });
        }
        res.json({
            message: "Login successful.",
            data: result.data
        });
    }
    catch (err) {
        console.error("Login error");
        res.status(500).json({
            message: "server error."
        });
    }
};
exports.Login = Login;
const getCurrentUser = async (req, res) => {
    res.json({
        message: "User retrieve",
        data: req.user
    });
};
exports.getCurrentUser = getCurrentUser;
