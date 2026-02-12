"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../../config/database/db"));
const index_js_1 = require("../../config/index.js");
//Register a new user (Admin, Cashier, Customer)
const registerUser = async (input) => {
    try {
        //Check if email already exists
        const [existingUser] = await db_1.default.query("SELECT * FROM users WHERE staff_id = ?", [input.staff_id]);
        if (existingUser.length > 0) {
            return { success: false, message: "Staff ID already in use." };
        }
        //Hash password
        const hashedPassword = await bcryptjs_1.default.hash(input.password, 10);
        //Insert user
        const [result] = await db_1.default.query(`INSERT INTO users (staff_id, password, name, role)
            VALUES (?, ?, ?, ?)`, [input.staff_id, hashedPassword, input.name, input.role]);
        return {
            success: true,
            data: {
                id: result.insertId,
                staff_id: input.staff_id,
                password: undefined,
                name: input.name,
                role: input.role
            },
        };
    }
    catch (err) {
        return { success: false, error: err };
    }
};
exports.registerUser = registerUser;
// const fn = <T>(userParams: T) => {
//     const user = {
//         userData: userParams
//     }
//     return user
// }
// fn<User>({
//     id: 1,
//     username: "qweq",
//     email: "qq@",
//     password: "qweq",
//     role: "Admin",
//     created_at: new Date(),
//     updated_at: new Date()
// })
//Login User
const loginUser = async (input) => {
    try {
        const staffId = input.staff_id.trim().toUpperCase();
        // Find user by staff_id (FIXED table name)
        const [users] = await db_1.default.query("SELECT id, staff_id, password, name, role FROM users WHERE staff_id = ? LIMIT 1", [staffId]);
        if (!users || users.length === 0) {
            return { success: false, message: "Invalid credentials" };
        }
        const user = users[0];
        const isMatch = await bcryptjs_1.default.compare(input.password, user.password);
        if (!isMatch) {
            return { success: false, message: "Invalid credentials" };
        }
        // Include payload (FIXED)
        const token = jsonwebtoken_1.default.sign({ id: user.id, staff_id: user.staff_id, role: user.role }, index_js_1.config.JWT_SECRET, {
            algorithm: "HS512",
            expiresIn: `${parseInt(index_js_1.config.JWT_EXPIRES_IN, 10)}h`,
            issuer: "POS Web Application",
        });
        return {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    staff_id: user.staff_id,
                    name: user.name,
                    role: user.role,
                },
            },
        };
    }
    catch (err) {
        return { success: false, error: err };
    }
};
exports.loginUser = loginUser;
