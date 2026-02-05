import express from "express";
import productRoutes from "./routes/product.route.js";
import AuthorityRoute from "./routes/auth.route.js"
import orderRoute from "./routes/order.route.js";
import orderItemRoute from "./routes/orderitem.route.js";
import TestRoute from "./routes/test.route.js";
import type { Request, Response } from "express";

const app = express();

app.use(express.json());
app.use("/api", productRoutes);
app.use("/api", TestRoute);
app.use("/api", AuthorityRoute);
app.use("/api", orderRoute);
app.use("/api", orderItemRoute);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

export default app;
