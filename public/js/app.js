class QALabApp {
  constructor() {
    this.state = {
      currentUser: null,
      role: null,
      token: null,
      products: [],
      cart: JSON.parse(localStorage.getItem('qa_lab_cart') || '[]'),
      currentView: 'login',
      flakyClicks: 0,
      checkoutInfo: { firstName: '', lastName: '', zipCode: '' },
      payment: { scenario: 'success', cardNumber: '' }
    };

    this.init();
  }

  init() {
    // Check saved session
    const savedUser = localStorage.getItem('qa_lab_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.state.currentUser = parsed.username;
      this.state.role = parsed.role;
      this.state.token = parsed.token;
      this.setupLoggedInNav();
    }

    this.updateCartBadge();
    this.setupDragAndDrop();

    // Check URL query view
    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view') || (this.state.currentUser ? 'products' : 'login');
    this.showView(initialView);
  }

  setupLoggedInNav() {
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('user-info-panel').style.display = 'flex';
    document.getElementById('username-display').textContent = `👤 ${this.state.currentUser}`;

    if (this.state.role === 'admin') {
      document.getElementById('nav-admin-link').style.display = 'flex';
    } else {
      document.getElementById('nav-admin-link').style.display = 'none';
    }
  }

  showView(viewName) {
    if (!this.state.currentUser && viewName !== 'login') {
      this.showToast('Please log in first', 'error');
      viewName = 'login';
    }

    this.state.currentView = viewName;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetSection = document.getElementById(`${viewName}-view`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Highlight nav link
    const navMap = { products: 'nav-products', sandbox: 'nav-sandbox', admin: 'nav-admin', cart: 'nav-cart' };
    if (navMap[viewName]) {
      const activeNav = document.querySelector(`[data-test="${navMap[viewName]}"]`);
      if (activeNav) activeNav.classList.add('active');
    }

    // Load view specific data
    if (viewName === 'products') this.fetchProducts();
    if (viewName === 'cart') this.renderCart();
    if (viewName === 'checkout-step2') this.renderOverview();
    if (viewName === 'admin') this.fetchAdminOrders();
  }

  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('theme-toggle-btn').textContent = newTheme === 'dark' ? '🌙 Theme' : '☀️ Theme';
  }

  // --- AUTHENTICATION ---
  async handleLogin(e) {
    e.preventDefault();
    const errorBanner = document.getElementById('login-error');
    errorBanner.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const submitBtn = document.getElementById('login-button');
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.state.currentUser = data.username;
      this.state.role = data.role;
      this.state.token = data.token;
      localStorage.setItem('qa_lab_user', JSON.stringify({ username: data.username, role: data.role, token: data.token }));

      this.setupLoggedInNav();
      this.showToast(`Welcome back, ${data.username}!`, 'success');
      this.showView('products');
    } catch (err) {
      errorBanner.textContent = err.message;
      errorBanner.style.display = 'block';
    } finally {
      submitBtn.textContent = 'Log In';
      submitBtn.disabled = false;
    }
  }

  toggleRegistration() {
    const form = document.getElementById('register-form');
    const visible = form.style.display !== 'none';
    form.style.display = visible ? 'none' : 'block';
    if (!visible) document.getElementById('register-username').focus();
  }

  togglePasswordReset() {
    const panel = document.getElementById('password-reset-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') document.getElementById('reset-username').focus();
  }

  async requestPasswordReset() {
    const username = document.getElementById('reset-username').value.trim();
    const message = document.getElementById('reset-message');
    const display = document.getElementById('reset-code-display');
    display.textContent = '';
    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
      });
      const data = await response.json();
      message.textContent = data.error || data.message;
      display.textContent = data.demoCode ? `Demo code: ${data.demoCode}` : '';
    } catch (error) { message.textContent = 'Unable to request a reset code'; }
  }

  async confirmPasswordReset() {
    const username = document.getElementById('reset-username').value.trim();
    const code = document.getElementById('reset-code').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const message = document.getElementById('reset-message');
    try {
      const response = await fetch('/api/password-reset/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code, newPassword })
      });
      const data = await response.json();
      message.textContent = data.error || data.message;
      if (response.ok) {
        document.getElementById('reset-code-display').textContent = '';
        document.getElementById('reset-code').value = '';
        document.getElementById('reset-new-password').value = '';
      }
    } catch (error) { message.textContent = 'Unable to change the password'; }
  }

  async handleRegister(e) {
    e.preventDefault();
    const errorBanner = document.getElementById('register-error');
    errorBanner.style.display = 'none';
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      this.state.currentUser = data.username;
      this.state.role = data.role;
      this.state.token = data.token;
      localStorage.setItem('qa_lab_user', JSON.stringify({ username: data.username, role: data.role, token: data.token }));
      this.setupLoggedInNav();
      this.showToast('Local test account registered', 'success');
      this.showView('products');
    } catch (err) {
      errorBanner.textContent = err.message;
      errorBanner.style.display = 'block';
    }
  }

  logout() {
    this.state.currentUser = null;
    this.state.role = null;
    this.state.token = null;
    localStorage.removeItem('qa_lab_user');
    document.getElementById('main-nav').style.display = 'none';
    document.getElementById('user-info-panel').style.display = 'none';
    this.showToast('Logged out successfully', 'info');
    this.showView('login');
  }

  // --- PRODUCTS & STORE ---
  async fetchProducts() {
    const category = document.getElementById('category-filter')?.value || 'All';
    const sort = document.getElementById('sort-select')?.value || 'default';
    const search = document.getElementById('search-input')?.value || '';

    const query = new URLSearchParams({ category, sort, search }).toString();
    try {
      const res = await fetch(`/api/products?${query}`);
      this.state.products = await res.json();
      this.renderProducts();
    } catch (err) {
      this.showToast('Error loading products', 'error');
    }
  }

  filterProducts() {
    this.fetchProducts();
  }

  renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (this.state.products.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">No products found matching your search.</div>`;
      return;
    }

    container.innerHTML = this.state.products.map(p => {
      const inCart = this.state.cart.some(item => item.id === p.id);
      return `
        <div class="card product-card" data-test="inventory-item" data-id="${p.id}">
          ${p.badge ? `<span class="product-badge" data-test="product-badge">${p.badge}</span>` : ''}
          <div class="product-img-wrapper">
            <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy">
          </div>
          <h3 class="product-title" data-test="inventory-item-name">${p.name}</h3>
          <p class="product-desc" data-test="inventory-item-desc">${p.description}</p>
          <div class="product-footer">
            <span class="product-price" data-test="inventory-item-price">$${p.price.toFixed(2)}</span>
            ${!p.stock ? `<button class="btn btn-secondary btn-add-cart" disabled data-test="add-to-cart-btn">Out of Stock</button>` :
              inCart ?
              `<button class="btn btn-danger btn-add-cart" data-test="remove-from-cart-btn" onclick="app.removeFromCart(${p.id})">Remove</button>` :
              `<button class="btn btn-primary btn-add-cart" data-test="add-to-cart-btn" onclick="app.addToCart(${p.id})">Add to Cart</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  // --- CART MANAGEMENT ---
  addToCart(productId) {
    const product = this.state.products.find(p => p.id === productId);
    if (!product) return;

    const existing = this.state.cart.find(i => i.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.state.cart.push({ ...product, quantity: 1 });
    }

    this.saveCart();
    this.renderProducts();
    this.showToast(`Added "${product.name}" to cart`, 'success');
  }

  removeFromCart(productId) {
    this.state.cart = this.state.cart.filter(i => i.id !== productId);
    this.saveCart();
    this.renderProducts();
    if (this.state.currentView === 'cart') this.renderCart();
    this.showToast('Item removed from cart', 'info');
  }

  updateQuantity(productId, delta) {
    const item = this.state.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.saveCart();
      this.renderCart();
    }
  }

  clearCart() {
    this.state.cart = [];
    this.saveCart();
    this.renderCart();
    this.showToast('Cart cleared', 'info');
  }

  saveCart() {
    localStorage.setItem('qa_lab_cart', JSON.stringify(this.state.cart));
    this.updateCartBadge();
  }

  updateCartBadge() {
    const totalQty = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
  }

  renderCart() {
    const list = document.getElementById('cart-items-list');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!list) return;

    if (this.state.cart.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);" data-test="cart-empty-message">Your cart is currently empty.</div>`;
      if (checkoutBtn) checkoutBtn.disabled = true;
      this.updateCartTotals(0);
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    let subtotal = 0;
    list.innerHTML = this.state.cart.map(item => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      return `
        <div class="cart-item" data-test="cart-item" data-id="${item.id}">
          <img src="${item.image}" class="cart-item-img" alt="${item.name}">
          <div class="cart-item-details">
            <div class="cart-item-title" data-test="cart-item-name">${item.name}</div>
            <div class="cart-item-price" data-test="cart-item-price">$${item.price.toFixed(2)}</div>
          </div>
          <div class="qty-controls">
            <button class="btn-qty" data-test="decrease-qty" onclick="app.updateQuantity(${item.id}, -1)">-</button>
            <span style="font-weight: 700; width: 24px; text-align: center;" data-test="cart-item-quantity">${item.quantity}</span>
            <button class="btn-qty" data-test="increase-qty" onclick="app.updateQuantity(${item.id}, 1)">+</button>
          </div>
          <button class="btn-qty" style="color: var(--danger); border-color: var(--danger);" data-test="remove-cart-item" onclick="app.removeFromCart(${item.id})">✕</button>
        </div>
      `;
    }).join('');

    this.updateCartTotals(subtotal);
  }

  updateCartTotals(subtotal) {
    const tax = subtotal * 0.08;
    const shipping = subtotal > 0 ? 4.99 : 0;
    const total = subtotal + tax + shipping;

    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;
  }

  // --- CHECKOUT ---
  handleCheckoutStep1(e) {
    e.preventDefault();
    const errorBanner = document.getElementById('checkout-error');
    errorBanner.style.display = 'none';

    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const zipCode = document.getElementById('postal-code').value.trim();

    if (!firstName || !lastName || !zipCode) {
      errorBanner.textContent = 'Error: All shipping fields are required';
      errorBanner.style.display = 'block';
      return;
    }

    this.state.checkoutInfo = { firstName, lastName, zipCode };
    this.showView('checkout-step2');
  }

  renderOverview() {
    const list = document.getElementById('overview-items-list');
    const customerInfo = document.getElementById('overview-customer-info');
    if (!list) return;

    list.innerHTML = this.state.cart.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--card-border);" data-test="overview-item">
        <div>
          <span style="font-weight: 700;">${item.quantity}x</span> ${item.name}
        </div>
        <div style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');

    const { firstName, lastName, zipCode } = this.state.checkoutInfo;
    customerInfo.textContent = `${firstName} ${lastName}, Zip: ${zipCode}`;

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax + (subtotal > 0 ? 4.99 : 0);
    document.getElementById('overview-final-total').textContent = `$${total.toFixed(2)}`;
  }

  async completeOrder() {
    const finishBtn = document.getElementById('finish-order-btn');
    finishBtn.disabled = true;
    finishBtn.textContent = 'Processing Order...';

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal * 1.08 + 4.99;
    const scenario = document.getElementById('payment-scenario')?.value || 'success';
    const cardNumber = document.getElementById('mock-card-number')?.value.replace(/\s+/g, '') || '';

    try {
      const paymentResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, cardNumber, amount: parseFloat(total.toFixed(2)) })
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(payment.error || 'Mock payment failed');
      const paymentStatus = document.getElementById('payment-status');
      if (paymentStatus) {
        paymentStatus.textContent = `Approved: ${payment.paymentReference}`;
        paymentStatus.style.color = 'var(--success)';
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.state.checkoutInfo,
          cartItems: this.state.cart,
          total: parseFloat(total.toFixed(2)),
          paymentReference: payment.paymentReference
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      document.getElementById('order-id-badge').textContent = `ORDER #${data.order.id}`;
      this.clearCart();
      this.showView('checkout-complete');
      this.showToast('Order placed successfully!', 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      finishBtn.disabled = false;
      finishBtn.textContent = 'Finish Order ✔';
    }
  }

  // --- QA SANDBOX CONTROLS ---
  triggerDelayedElement() {
    const btn = document.getElementById('trigger-delay-btn');
    const container = document.getElementById('delayed-element-container');
    btn.disabled = true;
    btn.textContent = 'Waiting (3s)...';
    container.innerHTML = `<span style="color: var(--warning); font-size: 0.85rem;">⏳ Loading dynamic element...</span>`;

    setTimeout(() => {
      container.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); padding: 0.75rem; border-radius: 6px; color: var(--success); font-weight: 600;" data-test="loaded-dynamic-element">
          ✅ Dynamic Element Successfully Loaded!
        </div>
      `;
      btn.disabled = false;
      btn.textContent = 'Start 3s Timer';
    }, 3000);
  }

  filterTable() {
    const query = document.getElementById('table-search').value.toLowerCase();
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  setupDragAndDrop() {
    const item = document.getElementById('draggable-item');
    const zone = document.getElementById('drop-target-zone');
    if (!item || !zone) return;

    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', 'dragged-item');
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      zone.innerHTML = `<span style="color: var(--success); font-weight: 700;" data-test="drop-success-msg">🎉 Drop Successful! Item Received.</span>`;
    });
  }

  handleFileUpload(e) {
    const file = e.target.files[0];
    const result = document.getElementById('file-upload-result');
    if (file) {
      result.textContent = `Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
  }

  handleFlakyClick() {
    this.state.flakyClicks += 1;
    const btn = document.getElementById('flaky-btn');
    const res = document.getElementById('flaky-result');

    btn.textContent = `Click Attempt (${this.state.flakyClicks}/3)`;

    if (this.state.flakyClicks < 3) {
      res.style.color = 'var(--warning)';
      res.textContent = `Attempt ${this.state.flakyClicks} failed (Simulating flaky behavior). Try clicking again!`;
    } else {
      res.style.color = 'var(--success)';
      res.textContent = `✅ Success on attempt ${this.state.flakyClicks}! Test pass achieved.`;
      btn.disabled = true;
    }
  }

  async triggerApiCall() {
    const box = document.getElementById('api-response-box');
    box.style.display = 'block';
    box.textContent = 'Fetching /api/slow-endpoint...';

    try {
      const res = await fetch('/api/slow-endpoint?delay=1500');
      const data = await res.json();
      box.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      box.textContent = `Error: ${err.message}`;
    }
  }

  // --- ADMIN DASHBOARD ---
  async fetchAdminOrders() {
    const container = document.getElementById('admin-orders-container');
    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();

      if (orders.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No orders placed yet.</p>`;
        return;
      }

      container.innerHTML = orders.map(o => `
        <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--card-border); font-size: 0.9rem;" data-test="admin-order-row">
          <span style="font-weight: 700; color: var(--primary);">${o.id}</span> - Customer: <strong>${o.customer}</strong> (${o.itemsCount} items) - <span style="color: var(--success); font-weight: 700;">$${o.total.toFixed(2)}</span>
        </div>
      `).join('');
    } catch (err) {
      this.showToast('Error loading admin orders', 'error');
    }
  }

  async resetAppState() {
    if (!confirm('Are you sure you want to reset all products and orders to initial state?')) return;
    try {
      await fetch('/api/reset', { method: 'POST' });
      this.clearCart();
      this.showToast('App state has been completely reset!', 'success');
      this.showView('products');
    } catch (err) {
      this.showToast('Error resetting state', 'error');
    }
  }

  // --- TOAST SYSTEM ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

const app = new QALabApp();
