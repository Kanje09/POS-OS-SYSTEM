import { apiCall, CONFIG } from "./config.js";

// ===================== CONFIG =====================
const API_BASE_URL = "https://pos-os-system-1.onrender.com/api";

let currentStaffId = null;
let currentOrderCode = null;
let currentOrderData = null;
let allOrders = [];

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  initializeServerStatus();
  setupEventListeners();

  // Auto-login if token exists
  const token = localStorage.getItem("pos_token");
  const userRaw = localStorage.getItem("pos_user");

  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw);
      currentStaffId = user.staff_id;
      showLoginSuccess(user.name);
    } catch (e) {
      localStorage.removeItem("pos_token");
      localStorage.removeItem("pos_user");
    }
  }
});

function setupEventListeners() {
  // LOGIN
  document
    .getElementById("login-form")
    ?.addEventListener("submit", handleLogin);

  // SEARCH ON ENTER
  document.getElementById("pickup-code")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchOrder();
  });

  // SEARCH BUTTON
  document.querySelector(".btn-search")?.addEventListener("click", searchOrder);

  // RECENT ORDERS CLICK (event delegation)
  document
    .getElementById("recent-orders-list")
    ?.addEventListener("click", (e) => {
      const item = e.target.closest(".order-item");
      if (!item) return;

      const code = item.dataset.code;
      if (!code) return;

      loadOrderDetails(code);
    });

  // LOGOUT
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);

  // CANCEL ORDER
  document.getElementById("btn-cancel")?.addEventListener("click", cancelOrder);

  // STATUS UPDATE BUTTONS
  document.getElementById("btn-preparing")?.addEventListener("click", () => {
    updateOrderStatus("preparing");
  });

  document.getElementById("btn-ready")?.addEventListener("click", () => {
    updateOrderStatus("ready");
  });

  document.getElementById("btn-completed")?.addEventListener("click", () => {
    updateOrderStatus("completed");
  });

  // PAYMENT BUTTONS
  document
    .getElementById("btn-pay-cash")
    ?.addEventListener("click", () => processPayment("cash"));

  document
    .getElementById("btn-pay-gcash")
    ?.addEventListener("click", () => processPayment("gcash"));

  // PAYMENT METHOD CHANGE
  document
    .getElementById("payment-method-select")
    ?.addEventListener("change", handlePaymentMethodChange);

  // CASH INPUT
  document
    .getElementById("cash-amount")
    ?.addEventListener("input", calculateChange);

  // REFUND BUTTON
  document
    .getElementById("btn-refund")
    ?.addEventListener("click", refundPayment);
}

// ===================== AUTH =====================
async function handleLogin(event) {
  event.preventDefault();

  const staff_id = document
    .getElementById("staff-id")
    ?.value.trim()
    .toUpperCase();
  const password = document.getElementById("password")?.value;

  if (!staff_id || !password) {
    showLoginError("Please enter Staff ID and password");
    return;
  }

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
    showLoginError(err?.message || "Login failed");
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
  if (!errorEl) return;

  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => (errorEl.style.display = "none"), 3000);
}

function handleLogout() {
  if (!confirm("Are you sure you want to logout?")) return;

  currentStaffId = null;
  currentOrderCode = null;
  currentOrderData = null;
  allOrders = [];

  localStorage.removeItem("pos_token");
  localStorage.removeItem("pos_user");

  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("pos-interface").style.display = "none";

  const staffIdEl = document.getElementById("staff-id");
  const passEl = document.getElementById("password");
  const pickupEl = document.getElementById("pickup-code");

  if (staffIdEl) staffIdEl.value = "";
  if (passEl) passEl.value = "";
  if (pickupEl) pickupEl.value = "";

  // Reset UI
  const list = document.getElementById("recent-orders-list");
  if (list) list.innerHTML = '<p class="empty-state">No orders available</p>';

  clearOrderDetails();
  showNotification("Logged out successfully", "success");
}

// ===================== SERVER STATUS =====================
function initializeServerStatus() {
  checkServerStatus();
  setInterval(checkServerStatus, 5000);
}

async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/ping`);
    updateServerStatus(response.ok);
  } catch {
    updateServerStatus(false);
  }
}

function updateServerStatus(isConnected) {
  const indicator = document.getElementById("server-status");
  const statusText = document.getElementById("server-status-text");
  if (!indicator || !statusText) return;

  indicator.classList.toggle("connected", isConnected);
  indicator.classList.toggle("disconnected", !isConnected);
  statusText.textContent = isConnected ? "Connected" : "Disconnected";
}

// ===================== FETCH ORDERS =====================
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
  } finally {
    showLoadingSpinner(false);
  }
}

function updateRecentOrdersList() {
  const list = document.getElementById("recent-orders-list");
  if (!list) return;

  if (allOrders.length === 0) {
    list.innerHTML = '<p class="empty-state">No orders available</p>';
    return;
  }

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  list.innerHTML = recentOrders
    .map(
      (order) => `
      <div class="order-item" data-code="${order.pickup_code}">
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
  const counts = { pending: 0, preparing: 0, ready: 0, completed: 0 };

  allOrders.forEach((order) => {
    if (Object.prototype.hasOwnProperty.call(counts, order.status)) {
      counts[order.status]++;
    }
  });

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v);
  };

  setText("count-pending", counts.pending);
  setText("count-preparing", counts.preparing);
  setText("count-ready", counts.ready);
  setText("count-completed", counts.completed);
}

// ===================== SEARCH ORDER =====================
async function searchOrder() {
  const code = document.getElementById("pickup-code")?.value.trim();

  if (!code || code.length !== 4) {
    showNotification("Please enter a valid 4-digit code", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/search/${code}`);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Unknown error" }));
      showNotification(
        data.message || `Pickup code ${code} not found`,
        "error",
      );
      clearOrderDetails();
      return;
    }

    const data = await res.json();
    const found = data?.data;

    if (!found) {
      showNotification(`Pickup code ${code} not found`, "error");
      clearOrderDetails();
      return;
    }

    const idx = allOrders.findIndex((o) => o.id === found.id);
    if (idx === -1) allOrders.unshift(found);
    else allOrders[idx] = found;

    updateRecentOrdersList();
    updateStatusCounts();
    loadOrderDetails(found.pickup_code);
    showNotification(`Order #${found.pickup_code} loaded`, "success");
  } catch (error) {
    console.error("Search error:", error);
    showNotification("Search failed. Please try again.", "error");
    clearOrderDetails();
  }
}

// ===================== LOAD DETAILS =====================
function loadOrderDetails(code) {
  const order = allOrders.find((o) => o.pickup_code === code);

  if (!order) {
    showNotification(`Pickup code ${code} not found`, "error");
    clearOrderDetails();
    return;
  }

  currentOrderCode = code;
  currentOrderData = order;

  document.getElementById("no-order-selected").style.display = "none";
  document.getElementById("order-details-container").style.display = "block";

  setText("detail-pickup-code", order.pickup_code);
  setText("detail-order-number", `#${order.order_number}`);
  setText("detail-status", getStatusLabel(order.status));
  setText("detail-customer", order.customer_name || "N/A");
  setText("detail-time", order.created_at);

  const totalAmount = parseFloat(order.total_amount) || 0;
  setText("detail-total", `₱${totalAmount.toFixed(2)}`);
  setText("detail-payment", (order.payment_method || "-").toUpperCase());

  setText(
    "detail-payment-status",
    order.payment_status === "paid" ? "✓ Paid" : "Pending",
  );

  // SAFE items
  const itemsList = document.getElementById("order-items-list");
  const items = Array.isArray(order.items) ? order.items : [];

  if (itemsList) {
    if (items.length === 0) {
      itemsList.innerHTML = '<p class="empty-state">No items found</p>';
    } else {
      itemsList.innerHTML = items
        .map((item) => {
          const itemPrice = parseFloat(item.price) || 0;
          const qty = parseInt(item.quantity) || 0;
          const itemTotal = itemPrice * qty;

          return `
            <div class="item-entry">
              <span class="item-name">${qty}x ${item.name}</span>
              <span class="item-price">₱${itemTotal.toFixed(2)}</span>
            </div>
          `;
        })
        .join("");
    }
  }

  updateActionButtons(order.status);
  updatePaymentUI();

  // highlight selected
  document
    .querySelectorAll(".order-item")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelector(`.order-item[data-code="${code}"]`)
    ?.classList.add("active");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function clearOrderDetails() {
  currentOrderCode = null;
  currentOrderData = null;

  document.getElementById("order-details-container").style.display = "none";
  document.getElementById("no-order-selected").style.display = "flex";

  const pickup = document.getElementById("pickup-code");
  if (pickup) pickup.value = "";
}

function updateActionButtons(status) {
  const btnPreparing = document.getElementById("btn-preparing");
  const btnReady = document.getElementById("btn-ready");
  const btnCompleted = document.getElementById("btn-completed");

  if (!btnPreparing || !btnReady || !btnCompleted) return;

  btnPreparing.style.display = "none";
  btnReady.style.display = "none";
  btnCompleted.style.display = "none";

  if (status === "pending") {
    btnPreparing.style.display = "inline-block";
  } else if (status === "preparing") {
    btnReady.style.display = "inline-block";
  } else if (status === "ready") {
    btnCompleted.style.display = "inline-block";
  }
}

// ===================== ORDER ACTIONS =====================
async function cancelOrder() {
  if (!currentOrderData) {
    showNotification("No order selected", "error");
    return;
  }

  if (!confirm("Are you sure you want to cancel this order?")) return;

  try {
    showLoadingSpinner(true);

    const response = await fetch(`${API_BASE_URL}/${currentOrderData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // update local
    const idx = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (idx > -1) allOrders[idx].status = "cancelled";
    currentOrderData.status = "cancelled";

    updateRecentOrdersList();
    updateStatusCounts();
    loadOrderDetails(currentOrderData.pickup_code);

    showNotification("Order cancelled", "success");
  } catch (error) {
    console.error("Cancel error:", error);
    showNotification("Failed to cancel order", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

async function updateOrderStatus(newStatus) {
  if (!currentOrderData) {
    showNotification("No order selected", "error");
    return;
  }

  try {
    showLoadingSpinner(true);

    const response = await fetch(`${API_BASE_URL}/${currentOrderData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const idx = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (idx > -1) allOrders[idx].status = newStatus;
    currentOrderData.status = newStatus;

    updateRecentOrdersList();
    updateStatusCounts();
    loadOrderDetails(currentOrderData.pickup_code);

    showNotification("Order status updated", "success");
  } catch (error) {
    console.error("Status error:", error);
    showNotification("Failed to update order status", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// ===================== PAYMENT =====================
function handlePaymentMethodChange() {
  const paymentMethod = document.getElementById("payment-method-select")?.value;
  const cashUI = document.getElementById("cash-payment-ui");
  const gcashUI = document.getElementById("gcash-payment-ui");

  if (!cashUI || !gcashUI) return;

  if (paymentMethod === "cash") {
    cashUI.style.display = "block";
    gcashUI.style.display = "none";
    const cashAmount = document.getElementById("cash-amount");
    if (cashAmount) cashAmount.value = "";
    const changeDisplay = document.getElementById("change-display");
    if (changeDisplay) changeDisplay.style.display = "none";
  } else {
    cashUI.style.display = "none";
    gcashUI.style.display = "block";
    generateGCashQR();
  }
}

function calculateChange() {
  if (!currentOrderData) return;

  const cash = parseFloat(document.getElementById("cash-amount")?.value) || 0;
  const due = parseFloat(currentOrderData.total_amount) || 0;
  const change = cash - due;

  const changeDisplay = document.getElementById("change-display");
  if (!changeDisplay) return;

  if (cash > 0) {
    setText("amount-due", `₱${due.toFixed(2)}`);
    setText("change-amount", `₱${change.toFixed(2)}`);
    changeDisplay.style.display = "block";
  } else {
    changeDisplay.style.display = "none";
  }
}

function generateGCashQR() {
  if (!currentOrderData) return;

  const qrcodeContainer = document.getElementById("qrcode");
  if (!qrcodeContainer) return;

  const total = parseFloat(currentOrderData.total_amount) || 0;

  qrcodeContainer.innerHTML = `
    <div style="text-align: center;">
      <img src="./Assets/images/gcash-qr.png"
           alt="GCash QR Code"
           style="width: 250px; height: 250px; border-radius: 8px;"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/250/0066cc/ffffff?text=GCash+QR';">
      <p style="margin-top: 10px; font-weight: bold;">Scan to Pay</p>
      <p>Amount: <strong>₱${total.toFixed(2)}</strong></p>
      <p style="font-size: 12px; color: #777;">Reference: <strong>${currentOrderData.pickup_code}</strong></p>
    </div>
  `;

  const amountEl = document.getElementById("gcash-amount-text");
  if (amountEl) amountEl.textContent = `₱${total.toFixed(2)}`;
}

async function processPayment(paymentMethod) {
  try {
    if (!currentOrderData) {
      showNotification("No order selected", "error");
      return;
    }

    const total = parseFloat(currentOrderData.total_amount) || 0;
    if (total <= 0) {
      showNotification("Invalid total amount", "error");
      return;
    }

    if (paymentMethod === "cash") {
      const cashReceived =
        parseFloat(document.getElementById("cash-amount")?.value) || 0;
      if (cashReceived < total) {
        showNotification("Cash received is less than amount due", "error");
        return;
      }
    }

    showLoadingSpinner(true);

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

    // update local
    const idx = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (idx > -1) {
      allOrders[idx].payment_status = "paid";
      allOrders[idx].payment_method = paymentMethod;
    }
    currentOrderData.payment_status = "paid";
    currentOrderData.payment_method = paymentMethod;

    updatePaymentUI();
    updateRecentOrdersList();
    updateStatusCounts();
    loadOrderDetails(currentOrderData.pickup_code);

    showNotification("Payment completed successfully!", "success");
  } catch (err) {
    console.error("Payment error:", err);
    showNotification(
      `Payment failed: ${err?.message || "Unknown error"}`,
      "error",
    );
  } finally {
    showLoadingSpinner(false);
  }
}

async function refundPayment() {
  if (!currentOrderData) {
    showNotification("No order selected", "error");
    return;
  }

  if (currentOrderData.payment_status !== "paid") {
    showNotification("Order has not been paid yet", "error");
    return;
  }

  if (!confirm("Are you sure you want to refund this payment?")) return;

  try {
    showLoadingSpinner(true);

    const response = await fetch(`${API_BASE_URL}/${currentOrderData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_status: "pending",
        payment_method: null,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // update local
    const idx = allOrders.findIndex((o) => o.id === currentOrderData.id);
    if (idx > -1) {
      allOrders[idx].payment_status = "pending";
      allOrders[idx].payment_method = null;
    }
    currentOrderData.payment_status = "pending";
    currentOrderData.payment_method = null;

    updatePaymentUI();
    updateRecentOrdersList();
    updateStatusCounts();
    loadOrderDetails(currentOrderData.pickup_code);

    showNotification("Payment refunded successfully", "success");
  } catch (err) {
    console.error("Refund error:", err);
    showNotification(
      `Refund failed: ${err?.message || "Unknown error"}`,
      "error",
    );
  } finally {
    showLoadingSpinner(false);
  }
}

function updatePaymentUI() {
  if (!currentOrderData) return;

  const paymentStatusEl = document.getElementById("detail-payment-status");
  const paymentReceiptEl = document.getElementById("payment-receipt");
  const btnRefund = document.getElementById("btn-refund");
  const paymentMethodSelect = document.getElementById("payment-method-select");
  const cashUI = document.getElementById("cash-payment-ui");
  const gcashUI = document.getElementById("gcash-payment-ui");

  if (
    !paymentStatusEl ||
    !paymentReceiptEl ||
    !btnRefund ||
    !paymentMethodSelect ||
    !cashUI ||
    !gcashUI
  )
    return;

  if (currentOrderData.payment_status === "paid") {
    paymentStatusEl.textContent = "✓ Paid";
    paymentReceiptEl.style.display = "block";

    paymentMethodSelect.parentElement.style.display = "none";
    cashUI.style.display = "none";
    gcashUI.style.display = "none";

    btnRefund.style.display = "inline-block";
  } else {
    paymentStatusEl.textContent = "⏳ Pending";
    paymentReceiptEl.style.display = "none";
    btnRefund.style.display = "none";

    paymentMethodSelect.parentElement.style.display = "flex";

    if (paymentMethodSelect.value === "cash") {
      cashUI.style.display = "block";
      gcashUI.style.display = "none";
    } else {
      cashUI.style.display = "none";
      gcashUI.style.display = "block";
      generateGCashQR();
    }
  }
}

// ===================== UI HELPERS =====================
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const text = document.getElementById("notification-text");
  const icon = document.getElementById("notification-icon");
  if (!notification || !text || !icon) return;

  notification.classList.remove("error");
  text.textContent = message;

  if (type === "error") {
    notification.classList.add("error");
    icon.textContent = "✕";
  } else {
    icon.textContent = "✓";
  }

  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
}

function showLoadingSpinner(show) {
  const spinner = document.getElementById("loading-spinner");
  if (!spinner) return;
  spinner.style.display = show ? "flex" : "none";
}

// ===================== AUTO REFRESH =====================
setInterval(() => {
  if (currentStaffId) fetchAllOrders();
}, 10000);