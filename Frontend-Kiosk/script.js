/* ===== STATE ===== */
let cart = [];
let orderNumber = 1;

/* ===== DATE / TIME ===== */
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

updateDateTime();
setInterval(updateDateTime, 1000);

/* ===== CART – ADD / UPDATE / REMOVE ===== */
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }

    updateCartDisplay();
    showNotification(`${name} added to order`);
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartDisplay();
        }
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartDisplay();
}

/* ===== CART – RENDER ===== */
function updateCartDisplay() {
    const cartItems    = document.getElementById('cart-items');
    const cartSummary  = document.getElementById('cart-summary');
    const checkoutBtn  = document.getElementById('checkout-btn');
    const cartBadge    = document.getElementById('cart-badge');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    /* badge */
    if (totalItems > 0) {
        cartBadge.textContent  = totalItems;
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }

    /* empty state */
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>No items in order</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Select products to begin</p>
            </div>
        `;
        cartSummary.style.display = 'none';
        checkoutBtn.disabled       = true;
        return;
    }

    /* item list */
    cartItems.innerHTML = cart.map(item => `
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
        </div>
    `).join('');

    /* totals */
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent    = `₱${subtotal.toFixed(2)}`;

    cartSummary.style.display = 'block';
    checkoutBtn.disabled       = false;
}

/* ===== CART – CLEAR & CHECKOUT ===== */
function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Clear all items from order?')) {
        cart = [];
        updateCartDisplay();
        showNotification('Order cleared');
    }
}

function checkout() {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    showNotification(`Payment processed: ₱${total.toFixed(2)}`);

    /* reset cart & bump order number */
    cart = [];
    orderNumber++;
    document.getElementById('order-number').textContent = String(orderNumber).padStart(4, '0');
    updateCartDisplay();
}

/* ===== NOTIFICATION ===== */
function showNotification(message) {
    const notification     = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');

    notificationText.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/* ===== MOBILE CART TOGGLE ===== */
function toggleCart() {
    document.getElementById('cart-section').classList.toggle('open');
}

function goBack() {
    const cartSection = document.getElementById('cart-section');

    /* mobile – close the sliding panel */
    if (cartSection.classList.contains('open')) {
        cartSection.classList.remove('open');
    }

    /* desktop – scroll to top */
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
