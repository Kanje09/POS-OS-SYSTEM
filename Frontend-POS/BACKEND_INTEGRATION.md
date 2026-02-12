# POS System Backend Integration Guide

This guide explains how to integrate your backend with the new POS System for order management.

## Overview

The POS System communicates with your backend to:
1. Retrieve all orders
2. Search for specific orders by pickup code
3. Update order status
4. Manage order cancellations

## Required Changes to Backend

### 1. Update Order Model

Add a `pickup_code` field to your Order interface:

```typescript
// backend/src/models/order.model.ts

export interface Order {
  id: number;
  user_id: number;
  pickup_code: string;           // NEW: 4-digit unique code
  order_number: number;          // NEW: Sequential order number
  total_amount: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  payment_method: "cash" | "card" | "gcash" | "online";
  payment_status: "pending" | "paid" | "refunded";
  order_type: "dine-in" | "takeout" | "delivery" | "online";
  table_number?: number;
  delivery_address?: string;
  notes?: string;
  customer_name?: string;       // NEW: For POS display
  items?: OrderItem[];          // NEW: Include items in order
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  name: string;                 // Product name
  quantity: number;
  price: number;                // Unit price
  total_price?: number;         // quantity * price
}
```

### 2. Create/Update Order Routes

```typescript
// backend/src/routes/order.route.ts

import express, { Router, Request, Response } from "express";

const router = Router();

// Get all orders (for POS dashboard)
router.get("/orders", async (req: Request, res: Response) => {
  try {
    // Fetch all orders with items from database
    const orders = await db.query(`
      SELECT 
        o.id,
        o.pickup_code,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.customer_name,
        o.created_at,
        o.updated_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status != 'completed' AND o.status != 'cancelled'
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json({ 
      success: true, 
      data: orders 
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching orders" 
    });
  }
});

// Search order by pickup code
router.get("/orders/search/:code", async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const order = await db.query(`
      SELECT 
        o.id,
        o.pickup_code,
        o.order_number,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status,
        o.customer_name,
        o.created_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name', oi.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.pickup_code = $1
      GROUP BY o.id
    `, [code]);

    if (order.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      data: order[0] 
    });
  } catch (error) {
    console.error("Error searching order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error searching order" 
    });
  }
});

// Get single order by ID
router.get("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await db.query(`
      SELECT 
        o.*,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

    if (order.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      data: order[0] 
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching order" 
    });
  }
});

// Create new order
router.post("/orders", async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      total_amount,
      payment_method,
      order_type,
      customer_name,
      items
    } = req.body;

    // Generate unique 4-digit pickup code
    let pickupCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    let isUnique = false;
    
    while (!isUnique) {
      const existing = await db.query(
        "SELECT id FROM orders WHERE pickup_code = $1",
        [pickupCode]
      );
      if (existing.length === 0) {
        isUnique = true;
      } else {
        pickupCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      }
    }

    // Create order
    const order = await db.query(`
      INSERT INTO orders (
        user_id,
        pickup_code,
        total_amount,
        status,
        payment_method,
        payment_status,
        order_type,
        customer_name,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      user_id,
      pickupCode,
      total_amount,
      'pending',
      payment_method,
      'paid',  // Assuming payment is already processed in kiosk
      order_type,
      customer_name
    ]);

    const orderId = order[0].id;

    // Insert order items
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(`
          INSERT INTO order_items (
            order_id,
            product_id,
            name,
            quantity,
            price,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [
          orderId,
          item.product_id || 0,
          item.name,
          item.quantity,
          item.price
        ]);
      }
    }

    res.json({ 
      success: true, 
      message: "Order created successfully",
      data: {
        ...order[0],
        pickup_code: pickupCode
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating order" 
    });
  }
});

// Update order status
router.put("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status" 
      });
    }

    // Update order
    const updatedOrder = await db.query(`
      UPDATE orders 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (updatedOrder.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      data: updatedOrder[0]
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating order" 
    });
  }
});

// Health check endpoint
router.get("/ping", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

export default router;
```

### 3. Update Database Schema

If using PostgreSQL, add these columns:

```sql
-- Add pickup_code column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(4) UNIQUE;

-- Add customer_name column for POS display
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Create index for faster lookup by pickup_code
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);

-- Ensure order_number is sequential
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;
```

### 4. Update app.ts

Ensure the routes are properly registered:

```typescript
// backend/src/app.ts
import orderRoute from "./routes/order.route.js";

const app = express();

app.use(express.json());
app.use("/api", orderRoute);
// ... other routes

export default app;
```

### 5. Enable CORS for Frontend Access

```typescript
// backend/src/app.ts
import cors from 'cors';

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
```

## Integration with Kiosk System

Update the Kiosk checkout function to save orders to the backend:

```typescript
// Frontend-Kiosk/script.js

function checkout() {
  if (cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Send order to backend
  fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: 1, // Default customer ID
      total_amount: total,
      payment_method: 'cash',
      order_type: 'takeout',
      customer_name: 'Walk-in Customer',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        product_id: 0 // Update with actual product IDs
      }))
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Use the pickup code in receipt
      const pickupCode = data.data.pickup_code;
      
      // Show receipt with pickup code
      document.getElementById('r-pickup-code').textContent = pickupCode;
      document.getElementById('receipt-modal').style.display = "flex";
    }
  })
  .catch(error => {
    console.error('Error creating order:', error);
    // Fallback to local storage
    useMockPickupCode();
  });
}
```

## Testing the Integration

1. **Start your backend server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Open the POS System:**
   - Navigate to `POS-System/index.html`
   - Login with Staff credentials

3. **Create an order via Kiosk:**
   - Open `Frontend-Kiosk/index.html`
   - Add products to cart
   - Complete checkout
   - Note the pickup code

4. **Retrieve order in POS:**
   - Search for the pickup code in POS System
   - Verify order details
   - Update status and confirm changes sync

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Access-Control-Allow-Origin" | Add CORS middleware to backend |
| "Cannot GET /api/orders" | Check route registration in app.ts |
| Orders not appearing | Verify database connection and query syntax |
| Pickup code empty | Ensure code is generated before order creation |

## Next Steps

1. Update authentication to use real staff credentials
2. Add order notification system (push, email, SMS)
3. Implement order history and analytics
4. Add customer feedback/rating system
5. Create mobile app for POS System

---

For more details, see [README.md](./README.md)
