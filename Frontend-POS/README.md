# TURON POS System - Staff Order Management

A complete Point of Sale management system for staff to retrieve and manage customer orders using a 4-digit pickup code.

## Features

✅ **Staff Authentication**
- Secure login with Staff ID and password
- Session management
- Logout functionality

✅ **Order Lookup**
- Search orders by 4-digit pickup code
- Recent orders list
- Real-time order status updates

✅ **Order Management**
- View detailed order information
- Track order items and pricing
- Update order status (Pending → Preparing → Ready → Completed)
- Cancel orders if needed

✅ **Real-time Dashboard**
- Status summary showing order counts
- Live server connection indicator
- Auto-refresh every 10 seconds

✅ **Backend Integration**
- Connects to your Express backend API
- Fetches orders from database
- Updates order status in real-time

## Installation

1. **Copy the POS-System folder** to your project root
2. **Update API_BASE_URL** in `script.js`:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/api'; // Change to your backend URL
   ```

3. **Add staff users** to the mock data in `script.js`:
   ```javascript
   const mockStaff = {
       'STAFF001': { password: 'password123', name: 'Juan Cruz' },
       'STAFF002': { password: 'password123', name: 'Maria Santos' },
       // Add more staff members
   };
   ```

## Usage

### Starting the POS System

1. Open `index.html` in a web browser
2. Login with Staff ID and password:
   - Staff ID: `STAFF001`
   - Password: `password123`

### Searching for Orders

1. Enter the 4-digit pickup code in the input field
2. Click "Search" or press Enter
3. Order details will appear on the right panel

### Managing Orders

**Update Order Status:**
1. Search for the order
2. Click the appropriate action button:
   - 👨‍🍳 **Start Preparing** - Begin making the order
   - ✓ **Mark as Ready** - Order is ready for pickup
   - ✓ **Mark as Completed** - Customer has picked up the order
3. Status updates automatically sync with the backend

**Cancel Order:**
- Click the **✕ Cancel Order** button at the bottom
- Confirm the cancellation

## API Endpoints Required

Make sure your backend supports these endpoints:

### Get All Orders
```
GET /api/orders
Response: { data: [...orders] }
```

### Get Order by ID
```
GET /api/orders/:id
Response: { data: {...order} }
```

### Update Order Status
```
PUT /api/orders/:id
Body: { status: "preparing|ready|completed|cancelled" }
```

### Server Health Check (Optional)
```
GET /api/ping
Response: { status: "ok" }
```

## Order Data Structure

Orders should follow this structure:

```javascript
{
  id: 1,
  pickup_code: "1234",           // 4-digit code from receipt
  order_number: 1,
  total_amount: 150.00,
  status: "pending|preparing|ready|completed|cancelled",
  payment_method: "cash|card|gcash|online",
  payment_status: "pending|paid|refunded",
  items: [
    { name: "Product Name", quantity: 2, price: 35 }
  ],
  customer_name: "John Doe",
  created_at: "2026-02-07 10:30:00"
}
```

## Backend Integration Steps

### 1. Add Pickup Code to Database

Update your Order table to include a `pickup_code` field:

```sql
ALTER TABLE orders ADD COLUMN pickup_code VARCHAR(4) UNIQUE;
```

### 2. Generate Pickup Code in Kiosk

When an order is created in the Kiosk (Frontend-Kiosk), generate a unique 4-digit code:

```typescript
// In your order creation endpoint
const pickupCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
order.pickup_code = pickupCode;
```

### 3. Update Order Routes

Ensure your order routes support status updates:

```typescript
// In order.route.ts
router.put('/orders/:id', (req, res) => {
  const { status } = req.body;
  // Update order status in database
  // Return updated order
});
```

### 4. Link Frontend-Kiosk with POS

In `Frontend-Kiosk/script.js`, when creating an order:

```javascript
function checkout() {
  // ... existing code ...
  
  // Generate pickup code
  const pickupCode = generatePickupCode();
  
  // Save order to backend
  fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: cart,
      total_amount: total,
      pickup_code: pickupCode,
      payment_method: 'cash',
      order_type: 'takeout'
    })
  });
}
```

## Mock Data

The POS system includes mock data for testing purposes. When the backend is unavailable, it will use demo orders:

- **Code: 1234** - Pending order (2x Classic, 1x Ube)
- **Code: 5678** - Preparing order (3x Special Mix)
- **Code: 9012** - Ready order (2x Chocolate, 1x Mango)

To use real backend data, ensure the API endpoints are correctly configured.

## Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary: #D4AF37;      /* Main brand color */
    --success: #4CAF50;      /* Success state */
    --warning: #FFC107;      /* Warning state */
    --danger: #F44336;       /* Error/danger state */
}
```

### Add More Columns
Edit the order info section in `index.html` and `script.js` to display additional fields.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Disconnected" status | Check if backend is running and API_BASE_URL is correct |
| Orders not loading | Verify backend endpoints match the expected format |
| Pickup code not found | Ensure the code exists in the database |
| Status won't update | Check if PUT endpoint is working correctly |

## Security Notes

⚠️ **Mock Staff Data**
- Replace mock staff authentication with real authentication system
- Use secure passwords and JWT tokens
- Implement session management on the backend

⚠️ **API Security**
- Add CORS headers to backend
- Implement authorization checks
- Use HTTPS in production

## Support

For integration issues or questions, check:
1. Browser console for JavaScript errors
2. Network tab to verify API calls
3. Backend logs for server errors

---

**Version**: 1.0.0  
**Last Updated**: February 7, 2026
