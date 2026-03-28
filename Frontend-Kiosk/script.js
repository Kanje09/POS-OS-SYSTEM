const API_BASE_URL = "https://pos-os-system-1.onrender.com";

let cart = [];
let orderNumber = 1;
let isLocked = true;
let pendingCheckoutNote = "";

const lockscreen = document.getElementById("lockscreen");

// ===================== LOCKSCREEN =====================
function initLockscreen() {
  const logoImg = document.getElementById("lockscreen-logo");

  // ✅ Prevent infinite loop - only try once
  logoImg.onerror = () => {
    logoImg.onerror = null; // ← CRITICAL: stops the loop
    logoImg.style.display = "none"; // just hide it if missing
  };

  logoImg.src =
    "https://raw.githubusercontent.com/Kanje09/POS-OS-SYSTEM/main/Assets/images/logo.png";

  document.addEventListener("click", unlockScreen);
  document.addEventListener("touchstart", unlockScreen);
  document.addEventListener("keydown", unlockScreen);
}

function unlockScreen() {
  if (!isLocked) return;
  isLocked = false;
  lockscreen.classList.remove("lock-animation");
  lockscreen.classList.add("unlock-animation");
  setTimeout(() => {
    lockscreen.style.display = "none";
    document.removeEventListener("click", unlockScreen);
    document.removeEventListener("touchstart", unlockScreen);
    document.removeEventListener("keydown", unlockScreen);
  }, 600);
}

function lockScreen() {
  isLocked = true;
  const ls = document.getElementById("lockscreen");
  ls.style.display = "flex";
  ls.classList.remove("unlock-animation");
  ls.classList.add("lock-animation");
  document.addEventListener("click", unlockScreen);
  document.addEventListener("touchstart", unlockScreen);
  document.addEventListener("keydown", unlockScreen);
}

window.addEventListener("load", initLockscreen);

// ===================== DATE/TIME =====================
function updateDateTime() {
  const now = new Date();
  const dateEl = document.getElementById("current-date");
  const timeEl = document.getElementById("current-time");
  if (dateEl)
    dateEl.textContent = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (timeEl)
    timeEl.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
}
updateDateTime();
setInterval(updateDateTime, 1000);

// ===================== CATEGORY FILTER =====================
function filterProducts(category) {
  document.querySelectorAll(".product-item").forEach((item) => {
    item.style.display =
      category === "all" || item.dataset.category === category
        ? "block"
        : "none";
  });
  document
    .querySelectorAll(".category-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
}

// ===================== CART =====================
function addToCart(id, name, price) {
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  updateCartDisplay();
  showNotification(`${name} added to order`);
}

function updateQuantity(id, change) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) removeFromCart(id);
  else updateCartDisplay();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  updateCartDisplay();
}

function clearCart() {
  if (cart.length === 0) return;
  if (confirm("Clear all items from order?")) {
    cart = [];
    updateCartDisplay();
    showNotification("Order cleared");
  }
}

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const checkoutBtn = document.getElementById("checkout-btn");
  const cartBadge = document.getElementById("cart-badge");

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";
  }

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>No items in order</p>
        <p style="font-size:0.85rem;margin-top:0.5rem;">Select products to begin</p>
      </div>`;
    if (cartSummary) cartSummary.style.display = "none";
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-header">
        <div class="cart-item-name">${item.name}</div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">×</button>
      </div>
      <div class="cart-item-details">
        <div class="cart-item-price">₱${item.price.toFixed(2)} each</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
        </div>
      </div>
    </div>`,
    )
    .join("");

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  document.getElementById("subtotal").textContent = `₱${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `₱${subtotal.toFixed(2)}`;

  if (cartSummary) cartSummary.style.display = "block";
  if (checkoutBtn) checkoutBtn.disabled = false;
}

// ===================== CHECKOUT =====================
async function checkout() {
  if (cart.length === 0) return;

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Processing...";
  }

  try {
    const body = {
      customer_id: null,
      payment_method: "cash",
      note: note || null,
      items: cart.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        product_id: null,
      })),
    };

    const res = await fetch(`${API_BASE_URL}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {}

    if (!res.ok) {
      const msg =
        payload?.message ||
        payload?.error?.sqlMessage ||
        payload?.error?.message ||
        raw ||
        "Failed to create order";
      throw new Error(msg);
    }

    const order = payload.data;
    showReceipt(order, note);
  } catch (e) {
    showNotification(e.message || "Order failed. Please try again.", "error");
    console.error("Checkout error:", e);
  } finally {
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Process Payment";
    }
  }
}

// ===================== RECEIPT =====================
function showReceipt(order) {
  const now = new Date();
  document.getElementById("r-date-time").textContent = now.toLocaleString();
  document.getElementById("r-order-no").textContent = String(
    order.order_number,
  ).padStart(4, "0");
  document.getElementById("r-pickup-code").textContent = order.pickup_code;

  const itemsList = document.getElementById("r-items-list");
  const items = Array.isArray(order.items) ? order.items : [];
  itemsList.innerHTML = items
    .map(
      (item) => `
    <div class="receipt-line">
      <span>${item.quantity}x ${item.name}</span>
      <span>₱${Number(item.total_price ?? item.price * item.quantity).toFixed(2)}</span>
    </div>`,
    )
    .join("");

  const total = Number(order.total_amount);
  document.getElementById("r-subtotal").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("r-total").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("r-cash").textContent = `₱${total.toFixed(2)}`;
  document.getElementById("r-change").textContent = `₱0.00`;

  document.getElementById("receipt-modal").style.display = "flex";
}

function closeReceipt() {
  document.getElementById("receipt-modal").style.display = "none";
  cart = [];
  orderNumber++;
  const orderNumEl = document.getElementById("order-number");
  if (orderNumEl) orderNumEl.textContent = String(orderNumber).padStart(4, "0");
  updateCartDisplay();
  showNotification("Thank you for your order!");
  setTimeout(() => lockScreen(), 1000);
}

// ===================== UI HELPERS =====================
function showNotification(message) {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notification-text");
  if (!notification || !notificationText) return;
  notificationText.textContent = message;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
}

function toggleCart() {
  document.getElementById("cart-section")?.classList.toggle("open");
}

function goBack() {
  const cartSection = document.getElementById("cart-section");
  if (cartSection?.classList.contains("open"))
    cartSection.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
