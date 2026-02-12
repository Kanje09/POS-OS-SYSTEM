"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const index_js_1 = require("../index.js");
const pool = promise_1.default.createPool({
  host: index_js_1.config.DB_HOST,
  user: index_js_1.config.DB_USER,
  password: index_js_1.config.DB_PASSWORD,
  database: index_js_1.config.DB_NAME,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
pool
  .getConnection()
  .then((connection) => {
    console.log("Database connected successfully!");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
exports.default = pool;
