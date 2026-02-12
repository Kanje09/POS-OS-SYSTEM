import express from "express";
import ordersRoutes from "./orders/routes/order.route";
import authRoutes from "./auth/routes/auth.route";
import productRoutes from "./routes/product.route";
import TestRoute from "./routes/test.route.js";
import pool from "./config/database/db.js";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));

app.use(cors({
  origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use("/api", productRoutes);
app.use("/api", TestRoute);
app.use("/api/auth", authRoutes);
app.use("/api", ordersRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Health check with database verification
app.get("/health/db", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      message: "Server and database are running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    res.status(503).json({
      status: "error",
      message: "Database connection failed",
      database: "disconnected",
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
});


app.get("/api/ping", (req, res) => {
  res.json({ success: true, message: "pong" });
});

export default app;
