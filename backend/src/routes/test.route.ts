import { Router } from "express";
import pool from "../config/database/db";

const router = Router();

// Test database connection.
router.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default router;