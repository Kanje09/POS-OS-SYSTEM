import pool from "../database/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { CreateUserInput, LoginInput, User } from "../models/user.model.js";
import type { Response, Request } from "express";

//Register a new user (Admin, Cashier, Customer)
export const registerUser = async (input: CreateUserInput) => {
    try {
        //Check if email already exists
        const [existingUser]: any = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [input.email]
        );

        if (existingUser.length > 0) {
            return { success: false, message: "Email already in use." };
        }

        //Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        //Insert user
        const [result]: any = await pool.query(
            `INSERT INTO user (username, email, password, role)
            VALUES (?, ?, ?, ?)`,
            [input.username, input.email, hashedPassword, input.role]
        );

        return {
            success: true,
            data: { id: result.InsertId, username: input.username, email: input.email, role: input.role, password: undefined },
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
        //Find user by email
        const [users]: any = await pool.query(
            "SELECT * FROM user WHERE email = ?",
            [input.email]
        );

        if (users.length === 0) {
            return { success: false, message: "Invalid credentials" };
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(input.password, user.password);

        if (!isMatch)
            return { success: false, message: "Invalid credentials" };



        const token = jwt.sign(
            {}, config.JWT_SECRET, {
            algorithm: "HS512", expiresIn: `${parseInt(config.JWT_EXPIRES_IN, 10)}h`,
            issuer: "POS Web Application",
        }
        )
        return {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                }
            }
        };

    } catch (err) {
        return { success: false, error: err };
    }
}