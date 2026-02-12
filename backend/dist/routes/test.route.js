"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/database/db"));
const router = (0, express_1.Router)();
// Test database connection.
router.get("/db-test", async (req, res) => {
    try {
        const [rows] = await db_1.default.query("SELECT 1 + 1 AS result");
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.default = router;
