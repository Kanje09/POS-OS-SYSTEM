import mysql from "mysql2/promise";
import { config } from "../index.js";

const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: config.DB_PORT,  // ← ADD THIS
  ssl: { rejectUnauthorized: false },  // ← ADD THIS (disable SSL for Railway proxy)
  connectTimeout: 60000,  // ← ADD THIS (60 seconds)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

pool.getConnection()
  .then(connection => {
    console.log("Database connected successfully!");
    connection.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err);
  });

export default pool;