import { apiCall, CONFIG } from "./config.js";

// Configuration
const API_BASE_URL = "https://pos-os-system-1.onrender.com/api"; // Update with your backend URL
let currentStaffId = null;
let currentOrderCode = null;
let currentOrderData = null;
let allOrders = [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeServerStatus();
  setupEventListeners();

  // ✅ Auto-login if token exists
  const token = localStorage.getItem("pos_token");
  const userRaw = localStorage.getItem("pos_user");

  if (token && userRaw) {
    const user = JSON.parse(userRaw);
    currentStaffId = user.staff_id;
    showLoginSuccess(user.name);
  }
});

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);

  document.getElementById("pickup-code").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchOrder();
  });
}

// ============ AUTHENTICATION ============

async function handleLogin(event) {
  event.preventDefault();

  const staff_id = document
    .getElementById("staff-id")
    .value.trim()
    .toUpperCase();
  const password = document.getElementById("password").value;

  try {
    const data = await apiCall(CONFIG.ENDPOINTS.STAFF_LOGIN, {
      method: "POST",
      body: JSON.stringify({ staff_id, password }),
    });

    localStorage.setItem("pos_token", data.data.token);
    localStorage.setItem("pos_user", JSON.stringify(data.data.user));

    currentStaffId = data.data.user.staff_id;
    showLoginSuccess(data.data.user.name);
  } catch (err) {
    console.error(err);
    showLoginError(err.message || "Login failed");
  }
}

function showLoginSuccess(staffName) {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("pos-interface").style.display = "flex";
  document.getElementById("staff-name").textContent = staffName;
  showNotification(`Welcome, ${staffName}!`, "success");
  fetchAllOrders();
}

function showLoginError(message) {
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 3000);
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    currentStaffId = null;
    currentOrderCode = null;
    currentOrderData = null;
    allOrders = [];
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("pos-interface").style.display = "none";
    document.getElementById("staff-id").value = "";
    document.getElementById("password").value = "";
    document.getElementById("pickup-code").value = "";
    showNotification("Logged out successfully", "success");

    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
  }
}

// ============ SERVER STATUS ============

function initializeServerStatus() {
  checkServerStatus();
  setInterval(checkServerStatus, 5000);
}

async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/ping`, { timeout: 3000 });
    if (response.ok) {
      updateServerStatus(true);
    } else {
      updateServerStatus(false);
    }
  } catch (error) {
    updateServerStatus(false);
  }
}

function updateServerStatus(isConnected) {
  const indicator = document.getElementById("server-status");
  const statusText = document.getElementById("server-status-text");

  if (isConnected) {
    indicator.classList.remove("disconnected");
    indicator.classList.add("connected");
    statusText.textContent = "Connected";
  } else {
    indicator.classList.remove("connected");
    indicator.classList.add("disconnected");
    statusText.textContent = "Disconnected";
  }
}

// ============ FETCHING ORDERS ============

async function fetchAllOrders() {
  try {
    showLoadingSpinner(true);

    const token = localStorage.getItem("pos_token");

    const response = await fetch(`${API_BASE_URL}/getorder`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status} - ${raw || response.statusText}`,
      );
    }

    const data = await response.json();
    allOrders = data.data || data || [];

    updateRecentOrdersList();
    updateStatusCounts();
  } catch (error) {
    console.error("Error fetching orders:", error);
    showNotification("Failed to fetch orders from server", "error");

    // optional fallback
    useMockOrdersData();
  } finally {
    showLoadingSpinner(false);
  }
}

function updateRecentOrdersList() {
  const list = document.getElementById("recent-orders-list");

  if (allOrders.length === 0) {
    list.innerHTML = '<p class="empty-state">No orders available</p>';
    return;
  }

  // Sort by most recent first and limit to 10
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  list.innerHTML = recentOrders
    .map(
      (order) => `
        <div class="order-item" onclick="loadOrderDetails('${order.pickup_code}')">
            <div class="order-code">Code: #${order.pickup_code}</div>
            <div class="order-status">Status: ${getStatusLabel(order.status)}</div>
        </div>
    `,
    )
    .join("");
}

function getStatusLabel(status) {
  const labels = {
    pending: "⏳ Pending",
    preparing: "👨‍🍳 Preparing",
    ready: "✓ Ready",
    completed: "✓✓ Completed",
    cancelled: "✕ Cancelled",
  };
  return labels[status] || status;
}

function updateStatusCounts() {
  const counts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
  };

  allOrders.forEach((order) => {
    if (counts.hasOwnProperty(order.status)) {
      counts[order.status]++;
    }
  });

  document.getElementById("count-pending").textContent = counts.pending;
  document.getElementById("count-preparing").textContent = counts.preparing;
  document.getElementById("count-ready").textContent = counts.ready;
  document.getElementById("count-completed").textContent = counts.completed;
}

// ============ SEARCH ORDER ============

// FIXED searchOrder function for pos.js
// Replace your current searchOrder function with this

async function searchOrder() {
  const code = document.getElementById("pickup-code").value.trim();
  console.log("🔍 Frontend searching for:", code);

  if (!code || code.length !== 4) {
    showNotification("Please enter a valid 4-digit code", "error");
    return;
  }

  try {
    const url = `${API_BASE_URL}/search/${code}`;
    console.log("📡 Calling URL:", url);

    const res = await fetch(url);
    console.log("📥 Response status:", res.status);
    console.log("📥 Response ok:", res.ok);

    // CRITICAL FIX: Check response status BEFORE parsing JSON
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Unknown error" }));
      console.log("❌ Error response:", data);
      showNotification(
        data.message || `Pickup code ${code} not found`,
        "error",
      );
      clearOrderDetails();
      return;
    }

    // SUCCESS: Parse the JSON data
    const data = await res.json();
    console.log("📦 Response data:", data);

    // Check if data exists
    if (!data || !data.data) {
      console.log("❌ No data in response");
      showNotification(`Pickup code ${code} not found`, "error");
      clearOrderDetails();
      return;
    }

    const found = data.data;
    console.log("✅ Order found:", found);

    // Update the orders list if this is a new order
    const idx = allOrders.findIndex((o) => o.id === found.id);
    if (idx === -1) {
      allOrders.unshift(found);
    } else {
      allOrders[idx] = found;
    }

    // Update UI
    updateRecentOrdersList();
    updateStatusCounts();

    // Load the order details
    loadOrderDetails(found.pickup_code);

    // Show success notification
    showNotification(
      `Order #${found.pickup_code} loaded successfully`,
      "success",
    );
  } catch (error) {
    console.error("💥 Frontend error:", error);
    console.error("💥 Error details:", error.message);
    console.error("💥 Error stack:", error.stack);
    showNotification("Failed to search order. Please try again.", "error");
    clearOrderDetails();
  }
}

// ALTERNATIVE: Even simpler version if the above doesn't work
async function searchOrderSimple() {
  const code = document.getElementById("pickup-code").value.trim();

  if (!code || code.length !== 4) {
    showNotification("Please enter a valid 4-digit code", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/search/${code}`);
    const result = await response.json();

    if (response.ok && result.success && result.data) {
      // SUCCESS - order found
      const order = result.data;

      // Update orders list
      const idx = allOrders.findIndex((o) => o.id === order.id);
      if (idx === -1) {
        allOrders.unshift(order);
      } else {
        allOrders[idx] = order;
      }

      updateRecentOrdersList();
      updateStatusCounts();
      loadOrderDetails(order.pickup_code);
      showNotification(`Order #${order.pickup_code} loaded`, "success");
    } else {
      // ERROR - order not found
      showNotification(result.message || "Order not found", "error");
      clearOrderDetails();
    }
  } catch (error) {
    console.error("Search error:", error);
    showNotification("Search failed. Check console for details.", "error");
    clearOrderDetails();
  }
}

function loadOrderDetails(code) {
  const order = allOrders.find((o) => o.pickup_code === code);

  if (!order) {
    showNotification(`Pickup code ${code} not found`, "error");
    clearOrderDetails();
    return;
  }

  currentOrderCode = code;
  currentOrderData = order;

  // Update UI with order details
  document.getElementById("no-order-selected").style.display = "none";
  document.getElementById("order-details-container").style.display = "block";

  // Fill in order information
  document.getElementById("detail-pickup-code").textContent = order.pickup_code;
  document.getElementById("detail-order-number").textContent =
    `#${order.order_number}`;
  document.getElementById("detail-status").textContent = getStatusLabel(
    order.status,
  );
  document.getElementById("detail-customer").textContent =
    order.customer_name || "N/A";
  document.getElementById("detail-time").textContent = order.created_at;
  const totalAmount = parseFloat(order.total_amount) || 0;
  document.getElementById("detail-total").textContent =
    `₱${totalAmount.toFixed(2)}`;
  document.getElementById("detail-payment").textContent =
    order.payment_method.toUpperCase();

  // Payment status
  const paymentStatus = order.payment_status === "paid" ? "✓ Paid" : "Pending";
  document.getElementById("detail-payment-status").textContent = paymentStatus;

  // Items list
  const itemsList = document.getElementById("order-items-list");
  itemsList.innerHTML = order.items
    .map((item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 0;
      const itemTotal = itemPrice * itemQuantity;

      return `
    <div class="item-entry">
      <span class="item-name">${itemQuantity}x ${item.name}</span>
      <span class="item-price">₱${itemTotal.toFixed(2)}</span>
    </div>
  `;
    })
    .join("");

  // Update action buttons based on status
  updateActionButtons(order.status);

  // Update payment UI
  updatePaymentUI();

  // Highlight the selected order in the list
  document
    .querySelectorAll(".order-item")
    .forEach((el) => el.classList.remove("active"));
  const selectedItem = Array.from(
    document.querySelectorAll(".order-item"),
  ).find((el) => el.textContent.includes(code));
  if (selectedItem) {
    selectedItem.classList.add("active");
  }
}

function updateActionButtons(status) {
  const btnPreparing = document.getElementById("btn-preparing");
  const btnReady = document.getElementById("btn-ready");
  const btnCompleted = document.getElementById("btn-completed");

  // Reset all buttons
  btnPreparing.style.display = "inline-block";
  btnReady.style.display = "none";
  btnCompleted.style.display = "none";

  // Show appropriate buttons based on status
  if (status === "pending") {
    btnPreparing.style.display = "inline-block";
  } else if (status === "preparing") {
    btnReady.style.display = "inline-block";
  } else if (status === "ready") {
    btnCompleted.style.display = "inline-block";
  } else if (status === "completed" || status === "cancelled") {
    btnPreparing.style.display = "none";
    btnReady.style.display = "none";
    btnCompleted.style.display = "none";
  }
}

function clearOrderDetails() {
  currentOrderCode = null;
  currentOrderData = null;
  document.getElementById("order-details-container").style.display = "none";
  document.getElementById("no-order-selected").style.display = "flex";
  document.getElementById("pickup-code").value = "";
}

// ============ ORDER ACTIONS ============

async function updateOrderStatus(newStatus) {
  if (!currentOrderData) return;

  try {
    showLoadingSpinner(true);

    // Call backend API to update order status
    const response = await fetch(`${API_BASE_URL}/${currentOrderData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Update local mock data
    const orderIndex = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (orderIndex > -1) {
      allOrders[orderIndex].status = newStatus;
      currentOrderData.status = newStatus;
    }

    // Update UI
    document.getElementById("detail-status").textContent =
      getStatusLabel(newStatus);
    updateActionButtons(newStatus);
    updateStatusCounts();
    updateRecentOrdersList();

    const statusMessages = {
      preparing: "Order marked as preparing...",
      ready: "Order marked as ready for pickup!",
      completed: "Order marked as completed!",
    };

    showNotification(statusMessages[newStatus] || "Order updated", "success");
    showLoadingSpinner(false);
  } catch (error) {
    console.error("Error updating order status:", error);
    showNotification("Failed to update order status", "error");
    showLoadingSpinner(false);

    // Still update UI optimistically
    const orderIndex = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (orderIndex > -1) {
      allOrders[orderIndex].status = newStatus;
      currentOrderData.status = newStatus;
    }
    document.getElementById("detail-status").textContent =
      getStatusLabel(newStatus);
    updateActionButtons(newStatus);
    updateStatusCounts();
    updateRecentOrdersList();
  }
}

async function cancelOrder() {
  if (!currentOrderData) return;

  if (!confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  try {
    showLoadingSpinner(true);

    const response = await fetch(`${API_BASE_URL}/${currentOrderData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelled",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Update local data
    const orderIndex = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (orderIndex > -1) {
      allOrders[orderIndex].status = "cancelled";
    }

    clearOrderDetails();
    updateStatusCounts();
    updateRecentOrdersList();
    showNotification("Order has been cancelled", "success");
    showLoadingSpinner(false);
  } catch (error) {
    console.error("Error cancelling order:", error);
    showNotification("Failed to cancel order", "error");
    showLoadingSpinner(false);
  }
}

// ============ PAYMENT MANAGEMENT ============

function handlePaymentMethodChange() {
  const paymentMethod = document.getElementById("payment-method-select").value;
  const cashUI = document.getElementById("cash-payment-ui");
  const gcashUI = document.getElementById("gcash-payment-ui");

  if (paymentMethod === "cash") {
    cashUI.style.display = "block";
    gcashUI.style.display = "none";
    document.getElementById("cash-amount").value = "";
    document.getElementById("change-display").style.display = "none";
  } else if (paymentMethod === "gcash") {
    cashUI.style.display = "none";
    gcashUI.style.display = "block";
    generateGCashQR();
  }
}

function calculateChange() {
  if (!currentOrderData) return;

  const cashAmount =
    parseFloat(document.getElementById("cash-amount").value) || 0;
  const dueAmount = parseFloat(currentOrderData.total_amount);
  const changeAmount = cashAmount - dueAmount;

  const changeDisplay = document.getElementById("change-display");

  if (cashAmount > 0) {
    document.getElementById("amount-due").textContent =
      `₱${dueAmount.toFixed(2)}`;
    document.getElementById("change-amount").textContent =
      `₱${changeAmount.toFixed(2)}`;
    changeDisplay.style.display = "block";

    if (changeAmount < 0) {
      document.getElementById("change-amount").style.color = "var(--danger)";
    } else {
      document.getElementById("change-amount").style.color = "var(--success)";
    }
  } else {
    changeDisplay.style.display = "none";
  }
}

function generateGCashQR() {
  if (!currentOrderData) return;

  const qrcodeContainer = document.getElementById("qrcode");
  const totalAmount = parseFloat(currentOrderData.total_amount) || 0;

  // Clear container
  qrcodeContainer.innerHTML = "";

  // Display your static GCash QR code image
  qrcodeContainer.innerHTML = `
    <div style="text-align: center;">
      <img src="/Assets/images/gcash-qr.png" 
           alt="GCash QR Code" 
           style="width: 250px; height: 250px; border: 2px solid #0066cc; border-radius: 8px;">
      <p style="margin-top: 15px; font-size: 16px; font-weight: bold; color: #333;">
        Scan to Pay
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">
        Please send exactly: <span style="color: #0066cc; font-weight: bold;">₱${totalAmount.toFixed(2)}</span>
      </p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">
        Reference: <strong>${currentOrderData.pickup_code}</strong>
      </p>
      <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 11px; color: #856404;">
          ⚠️ After payment, click "Payment Completed" button below
        </p>
      </div>
    </div>
  `;

  // Update amount display
  const amountEl = document.getElementById("gcash-amount-text");
  if (amountEl) {
    amountEl.textContent = `₱${totalAmount.toFixed(2)}`;
  }
}

async function processPayment(paymentMethod) {
  try {
    if (!currentOrderData) {
      showNotification("No order selected", "error");
      return;
    }

    // Convert DECIMAL string to number
    const total = parseFloat(currentOrderData.total_amount) || 0;

    if (total <= 0) {
      showNotification("Invalid total amount", "error");
      return;
    }

    // Validate cash payment
    if (paymentMethod === "cash") {
      const cashInput = document.getElementById("cash-amount");
      const cashReceived = parseFloat(cashInput?.value) || 0;

      if (cashReceived < total) {
        showNotification(
          `Amount received (₱${cashReceived.toFixed(2)}) is less than amount due (₱${total.toFixed(2)})`,
          "error",
        );
        return;
      }
    }

    showLoadingSpinner(true);

    // Use currentOrderData.id, not orderId parameter
    const response = await fetch(`${API_BASE_URL}/${currentOrderData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_status: "paid",
        payment_method: paymentMethod,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // Update local data
    const orderIndex = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (orderIndex > -1) {
      allOrders[orderIndex].payment_status = "paid";
      allOrders[orderIndex].payment_method = paymentMethod;
    }
    currentOrderData.payment_status = "paid";
    currentOrderData.payment_method = paymentMethod;

    // Update UI
    updatePaymentUI();
    updateRecentOrdersList();
    updateStatusCounts();

    // Show success with change
    if (paymentMethod === "cash") {
      const cashInput = document.getElementById("cash-amount");
      const cashReceived = parseFloat(cashInput?.value) || 0;
      const change = (cashReceived - total).toFixed(2);
      showNotification(
        `Payment of ₱${total.toFixed(2)} received. Change: ₱${change}`,
        "success",
      );
    } else {
      showNotification(
        `Payment of ₱${total.toFixed(2)} via GCash received`,
        "success",
      );
    }

    // Reset inputs
    if (paymentMethod === "cash") {
      const cashInput = document.getElementById("cash-amount");
      if (cashInput) cashInput.value = "";
      const changeDisplay = document.getElementById("change-display");
      if (changeDisplay) changeDisplay.style.display = "none";
    }
  } catch (err) {
    console.error("Payment error:", err);
    showNotification("Failed to process payment: " + err.message, "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// ✅ expose functions used by inline onclick="" in HTML
window.searchOrder = searchOrder;
window.loadOrderDetails = loadOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;

window.handlePaymentMethodChange = handlePaymentMethodChange;
window.calculateChange = calculateChange;

window.processPayment = processPayment;
window.refundPayment = refundPayment;

window.handleLogout = handleLogout;

async function refundPayment() {
  if (!currentOrderData) return;

  if (
    !confirm(
      `Are you sure you want to refund ₱${parseFloat(currentOrderData.total_amount).toFixed(2)}?`,
    )
  ) {
    return;
  }

  try {
    showLoadingSpinner(true);

    const response = await fetch(`${API_BASE_URL}/${currentOrderData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_status: "refunded",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Update local data
    const orderIndex = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (orderIndex > -1) {
      allOrders[orderIndex].payment_status = "refunded";
      currentOrderData.payment_status = "refunded";
    }

    // Update UI
    updatePaymentUI();
    showNotification(
      `Refund of ₱${parseFloat(currentOrderData.total_amount).toFixed(2)} processed`,
      "success",
    );
    showLoadingSpinner(false);
  } catch (error) {
    console.error("Error refunding payment:", error);
    showNotification("Failed to refund payment", "error");
    showLoadingSpinner(false);
  }
}

function updatePaymentUI() {
  if (!currentOrderData) return;

  // Update payment status display
  document.getElementById("detail-payment").textContent =
    currentOrderData.payment_method?.toUpperCase() || "-";

  const paymentStatusEl = document.getElementById("detail-payment-status");
  const paymentReceiptEl = document.getElementById("payment-receipt");
  const btnRefund = document.getElementById("btn-refund");
  const paymentSection = document.querySelector(".payment-section");
  const paymentMethodSelect = document.getElementById("payment-method-select");
  const cashUI = document.getElementById("cash-payment-ui");
  const gcashUI = document.getElementById("gcash-payment-ui");

  if (currentOrderData.payment_status === "paid") {
    paymentStatusEl.textContent = "✓ Paid";
    paymentStatusEl.style.background = "var(--success)";
    paymentStatusEl.style.color = "var(--white)";

    // Show payment receipt
    const now = new Date();
    document.getElementById("payment-receipt-time").textContent =
      `Paid on ${now.toLocaleString()}`;
    paymentReceiptEl.style.display = "block";

    // Hide payment method selector and UIs
    paymentMethodSelect.parentElement.style.display = "none";
    cashUI.style.display = "none";
    gcashUI.style.display = "none";

    // Show refund button
    btnRefund.style.display = "inline-block";
  } else if (currentOrderData.payment_status === "refunded") {
    paymentStatusEl.textContent = "↩ Refunded";
    paymentStatusEl.style.background = "#FF9800";
    paymentStatusEl.style.color = "var(--white)";

    paymentReceiptEl.style.display = "none";
    btnRefund.style.display = "none";
    paymentMethodSelect.parentElement.style.display = "none";
    cashUI.style.display = "none";
    gcashUI.style.display = "none";
  } else {
    // Pending payment
    paymentStatusEl.textContent = "⏳ Pending";
    paymentStatusEl.style.background = "#FFC107";
    paymentStatusEl.style.color = "var(--darker)";

    paymentReceiptEl.style.display = "none";
    btnRefund.style.display = "none";
    paymentMethodSelect.parentElement.style.display = "flex";

    // Show the selected payment method UI
    const selectedMethod = paymentMethodSelect.value;
    if (selectedMethod === "cash") {
      cashUI.style.display = "block";
      gcashUI.style.display = "none";
    } else {
      cashUI.style.display = "none";
      gcashUI.style.display = "block";
      generateGCashQR();
    }
  }
}

// ============ NOTIFICATIONS ============

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const text = document.getElementById("notification-text");
  const icon = document.getElementById("notification-icon");

  notification.classList.remove("error");
  text.textContent = message;

  if (type === "error") {
    notification.classList.add("error");
    icon.textContent = "✕";
  } else {
    icon.textContent = "✓";
  }

  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

function showLoadingSpinner(show) {
  const spinner = document.getElementById("loading-spinner");
  if (show) {
    spinner.style.display = "flex";
  } else {
    spinner.style.display = "none";
  }
}

// ============ AUTO REFRESH ============

// Refresh orders every 10 seconds
setInterval(() => {
  if (currentStaffId) {
    fetchAllOrders();
  }
}, 10000);
