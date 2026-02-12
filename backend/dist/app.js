"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const order_route_1 = __importDefault(require("./orders/routes/order.route"));
const auth_route_1 = __importDefault(require("./auth/routes/auth.route"));
const product_route_1 = __importDefault(require("./routes/product.route"));
const test_route_js_1 = __importDefault(require("./routes/test.route.js"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use((0, cors_1.default)({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use("/api", product_route_1.default);
app.use("/api", test_route_js_1.default);
app.use("/api/auth", auth_route_1.default);
app.use("/api", order_route_1.default);
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});
app.get("/api/ping", (req, res) => {
    res.json({ success: true, message: "pong" });
});
exports.default = app;
