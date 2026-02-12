import express from "express";
import ordersRoutes from "./orders/routes/order.route";
import authRoutes from "./auth/routes/auth.route";
import productRoutes from "./routes/product.route";
import TestRoute from "./routes/test.route.js";
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

app.get("/api/ping", (req, res) => {
  res.json({ success: true, message: "pong" });
});

export default app;
