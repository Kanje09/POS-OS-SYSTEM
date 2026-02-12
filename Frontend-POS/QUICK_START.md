# 🍌 POS System - Quick Start Guide

Welcome to your new POS (Point of Sale) Management System! This is a separate staff interface for managing customer orders using the 4-digit pickup codes from the Kiosk system.

## 📁 Project Structure

```
POS-Web-App-System/
├── Frontend-Kiosk/          (Customer ordering interface)
├── backend/                 (Express API server)
└── POS-System/             (NEW: Staff management interface)
    ├── index.html          (Main interface)
    ├── styles.css          (Styling)
    ├── script.js           (JavaScript logic)
    ├── config.js           (Configuration)
    ├── README.md           (User documentation)
    ├── BACKEND_INTEGRATION.md (Developer guide)
    └── QUICK_START.md      (This file)
```

## 🚀 Getting Started

### Step 1: Configure the Backend URL

Open `POS-System/script.js` and find this line:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Update it with your actual backend URL if different.

### Step 2: Update Backend Routes

Follow the instructions in [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) to:
- Add `pickup_code` field to orders
- Update database schema
- Create the required API endpoints

### Step 3: Start Your Services

**Terminal 1 - Start Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Open in Browser:**
- Kiosk: `http://localhost:5173` or open `Frontend-Kiosk/index.html`
- POS System: Open `POS-System/index.html`

## 👤 Login Credentials

Default mock staff accounts (for testing):

| Staff ID | Password | Name |
|----------|----------|------|
| STAFF001 | password123 | Juan Cruz |
| STAFF002 | password123 | Maria Santos |
| STAFF003 | password123 | Pedro Lopez |

⚠️ **Replace these with real credentials before production use!**

## 📋 How to Use

### Finding Orders

1. **Search by Code:**
   - Enter the 4-digit pickup code from the customer's receipt
   - Click "Search" or press Enter
   - Order details appear on the right

2. **Browse Recent Orders:**
   - Check the "Recent Orders" list on the left
   - Click any order to view details

### Managing Orders

Once you've found an order, you can:

1. **👨‍🍳 Start Preparing** - Begin making the order
2. **✓ Mark as Ready** - Order is ready for customer pickup
3. **✓ Mark as Completed** - Customer has picked up the order
4. **✕ Cancel Order** - Cancel the order if needed

### Monitoring Dashboard

The bottom of the screen shows real-time counts:
- **⏳ Pending** - Orders waiting to be started
- **👨‍🍳 Preparing** - Orders being made
- **✓ Ready** - Ready for customer pickup
- **✓✓ Completed** - Customer has picked up

## 🔄 System Flow

```
Customer at Kiosk:
    ↓
1. Selects products
    ↓
2. Completes payment
    ↓
3. Receives receipt with 4-digit code
    ↓
    
Staff at POS:
    ↓
1. Logs in with Staff ID
    ↓
2. Enters 4-digit code
    ↓
3. Views order details
    ↓
4. Updates order status as work progresses
    ↓
5. Customer comes to pickup when "Ready"
    ↓
6. Staff marks "Completed"
```

## 🔧 Integration Checklist

- [ ] Backend URL configured in `script.js`
- [ ] Database schema updated with `pickup_code` field
- [ ] Order routes created/updated
- [ ] CORS enabled in backend
- [ ] Business logic tested with mock data
- [ ] Real staff credentials configured
- [ ] Frontend-Kiosk integrated to save pickup codes
- [ ] Backend authenticated requests (if needed)
- [ ] Deployment URLs updated for production

## 🧪 Testing with Mock Data

The POS System comes with built-in mock orders for testing:

**Test Pickup Codes:**
- `1234` - Pending Classic & Ube Turon
- `5678` - Preparing Special Mix
- `9012` - Ready Chocolate & Mango

These appear automatically if the backend is not available.

## 📱 Mobile Support

The interface is responsive and works on:
- Desktop (optimized)
- Tablets (good)
- Mobile phones (basic support)

For best experience, use on a 10"+ tablet or monitor.

## 🔐 Security Notes

Before going to production:

1. **Replace mock staff accounts** with real authentication
2. **Use secure passwords** for staff members
3. **Add proper CORS configuration** for your domain
4. **Use HTTPS** for all API calls
5. **Implement session tokens** (JWT recommended)
6. **Add request validation** on backend
7. **Log all order changes** for audit trail

## 🐛 Troubleshooting

### Login Not Working
- Check if Staff ID is uppercase
- Verify password exactly matches (case-sensitive)
- Check browser console for errors (F12)

### Orders Not Loading
- Check if backend is running
- Verify API_BASE_URL in script.js
- Check browser Network tab (F12) for failed requests
- Look for CORS errors in console

### Pickup Code Not Found
- Ensure code exists in database
- Verify customer completed checkout in Kiosk
- Check database directly for the right 4-digit code

### Status Updates Not Syncing
- Check backend PUT endpoint implementation
- Verify order ID is correct
- Look for validation errors in backend logs

## 📧 Support

For detailed integration help:
1. Read [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)
2. Check [README.md](./README.md) for full documentation
3. Review browser console for specific errors

## ✨ Features

✅ Staff authentication and login  
✅ Real-time order lookup by 4-digit code  
✅ Complete order details display  
✅ Order status tracking (5 states)  
✅ Live dashboard with order counts  
✅ Server connection indicator  
✅ Auto-refresh every 10 seconds  
✅ Mock data fallback for testing  
✅ Responsive design  
✅ Order history view  

## 🎯 Next Steps

1. **Start with mock data** to test the UI
2. **Update your backend** following BACKEND_INTEGRATION.md
3. **Test with real orders** from the Kiosk
4. **Configure staff accounts** with real employees
5. **Deploy to production** with security measures

---

**Happy serving! 🍌**

Need help? Check the README.md and BACKEND_INTEGRATION.md files for more detailed information.
