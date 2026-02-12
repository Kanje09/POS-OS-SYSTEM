import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../config/database/db";
import { config } from "../../config/index.js";
import { Users, LoginInput } from "../types/user.type";

//Register a new user (Admin, Cashier, Customer)
export const registerUser = async (input: Users) => {
    try {
        //Check if email already exists
        const [existingUser]: any = await pool.query(
            "SELECT * FROM users WHERE staff_id = ?",
            [input.staff_id]
        );

        if (existingUser.length > 0) {
            return { success: false, message: "Staff ID already in use." };
        }

        //Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        //Insert user
        const [result]: any = await pool.query(
            `INSERT INTO users (staff_id, password, name, role)
            VALUES (?, ?, ?, ?)`,
            [input.staff_id, hashedPassword, input.name, input.role]
        );

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

    } catch (err) {
        return { success: false, error: err };
    }
};


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
export const loginUser = async (input: LoginInput) => {
    try {
        const staffId = input.staff_id.trim().toUpperCase();

        // Find user by staff_id (FIXED table name)
        const [users]: any = await pool.query(
            "SELECT id, staff_id, password, name, role FROM users WHERE staff_id = ? LIMIT 1",
            [staffId]
        );

        if (!users || users.length === 0) {
            return { success: false, message: "Invalid credentials" };
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(input.password, user.password);
        if (!isMatch) {
            return { success: false, message: "Invalid credentials" };
        }

        // Include payload (FIXED)
        const token = jwt.sign(
            { id: user.id, staff_id: user.staff_id, role: user.role },
            config.JWT_SECRET,
            {
                algorithm: "HS512",
                expiresIn: `${parseInt(config.JWT_EXPIRES_IN, 10)}h`,
                issuer: "POS Web Application",
            }
        );

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
    } catch (err) {
        return { success: false, error: err };
    }
};
