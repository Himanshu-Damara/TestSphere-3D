const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createExecutionRuntime } = require('./execution');

const app = express();
const PORT = process.env.PORT || 3000;
const execution = createExecutionRuntime({ projectRoot: __dirname });

app.use(express.json());

// TestSphere execution API. Targets and browser flows are selected from the
// approved catalog; the API never accepts arbitrary URLs or shell commands.
app.use('/api/execution', execution.router);

// The local cart-total fault is opt-in and is applied only to the response
// served to a local browser. The checked-in frontend file remains unchanged.
app.get('/js/app.js', (req, res, next) => {
  if (!execution.faults.get().localQaLab.cartTotal.enabled) return next();
  try {
    const source = fs.readFileSync(path.join(__dirname, 'public', 'js', 'app.js'), 'utf8');
    res.type('application/javascript').send(execution.faults.transformLocalAppScript(source));
  } catch (error) {
    res.status(500).json({ error: 'Unable to apply local test fault', details: error.message });
  }
});
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Database state
let initialProducts = [
  {
    id: 1,
    name: 'Velox Tech Backpack',
    category: 'Gear',
    price: 49.99,
    rating: 4.8,
    image: '/images/backpack.jpg',
    description: 'Sleek, water-resistant minimalist laptop backpack with dedicated tech compartments and USB charging port.',
    stock: true,
    badge: 'Best Seller'
  },
  {
    id: 2,
    name: 'Aurora Wireless Headphones',
    category: 'Electronics',
    price: 129.99,
    rating: 4.9,
    image: '/images/headphones.jpg',
    description: 'Active noise-canceling bluetooth over-ear headphones with 40-hour battery life and high-fidelity sound.',
    stock: true,
    badge: 'Popular'
  },
  {
    id: 3,
    name: 'CyberPulse Smartwatch v2',
    category: 'Electronics',
    price: 199.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    description: 'Fitness tracker smartwatch featuring AMOLED display, heart rate monitor, GPS, and sleep analysis.',
    stock: true,
    badge: 'New'
  },
  {
    id: 4,
    name: 'Urban Runner Sneakers',
    category: 'Apparel',
    price: 89.99,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
    description: 'Lightweight cushioned performance running shoes designed for urban runners and daily comfort.',
    stock: true,
    badge: 'Sale'
  },
  {
    id: 5,
    name: 'NeonRGB Mechanical Keyboard',
    category: 'Electronics',
    price: 74.99,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    description: 'Customizable RGB backlit mechanical gaming keyboard with tactile blue switches and aluminum frame.',
    stock: true
  },
  {
    id: 6,
    name: 'HydraTech Smart Water Bottle',
    category: 'Gear',
    price: 34.99,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80',
    description: 'Insulated stainless steel water bottle with UV-C self-cleaning technology and hydration reminders.',
    stock: false,
    badge: 'Out of Stock'
  }
];

let products = JSON.parse(JSON.stringify(initialProducts));
let orders = [];
const users = new Map([
  ['standard_user', { username: 'standard_user', password: 'secret_sauce', role: 'user' }],
  ['locked_out_user', { username: 'locked_out_user', password: 'secret_sauce', role: 'user', locked: true }],
  ['glitch_user', { username: 'glitch_user', password: 'secret_sauce', role: 'user', delayed: true }],
  ['admin_user', { username: 'admin_user', password: 'secret_sauce', role: 'admin' }],
]);
const passwordResetCodes = new Map();

// API Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = users.get(username);
  if (user && user.locked) {
    return res.status(403).json({ error: 'Epic sadface: Sorry, this user has been locked out.' });
  }

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Epic sadface: Username and password do not match any user in this service' });
  }

  if (user.delayed) {
    setTimeout(() => {
      res.json({ token: 'mock-jwt-glitch-token', username, role: 'user', message: 'Login successful (delayed)' });
    }, 3000);
    return;
  }

  return res.json({ token: `mock-jwt-${username}-token`, username, role: user.role, message: 'Login successful' });
});

app.post('/api/register', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) return res.status(400).json({ error: 'Username must be 4-32 letters, numbers, or underscores' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must contain at least 6 characters' });
  if (users.has(username)) return res.status(409).json({ error: 'Username is already registered' });
  users.set(username, { username, password, role: 'user' });
  return res.status(201).json({ username, role: 'user', token: `mock-jwt-${username}-token`, message: 'Registration successful' });
});

// Local QA demonstration only: the one-time code is returned to the browser
// because this sandbox has no email service. Never use this pattern for real accounts.
app.post('/api/password-reset/request', (req, res) => {
  const username = String(req.body?.username || '').trim();
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!users.has(username)) return res.json({ message: 'If this demo account exists, a reset code is available.', demoCode: null });
  const code = String(crypto.randomInt(100000, 1000000));
  passwordResetCodes.set(username, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
  return res.json({ message: 'Demo reset code generated. It expires in 10 minutes.', demoCode: code });
});

app.post('/api/password-reset/confirm', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const code = String(req.body?.code || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must contain at least 8 characters' });
  const reset = passwordResetCodes.get(username);
  if (!reset || reset.code !== code || reset.expiresAt < Date.now()) return res.status(400).json({ error: 'Invalid or expired reset code' });
  const user = users.get(username);
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset code' });
  user.password = newPassword;
  passwordResetCodes.delete(username);
  return res.json({ message: 'Password changed. Sign in with the new password.' });
});

app.get('/api/products', (req, res) => {
  const { category, sort, search } = req.query;
  let result = [...products];

  if (category && category !== 'All') {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  if (sort === 'price-low') {
    result.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    result.sort((a, b) => b.price - a.price);
  } else if (sort === 'name-az') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'name-za') {
    result.sort((a, b) => b.name.localeCompare(a.name));
  }

  res.json(result);
});

app.post('/api/orders', (req, res) => {
  const { firstName, lastName, zipCode, cartItems, total, paymentReference } = req.body;

  if (!firstName || !lastName || !zipCode) {
    return res.status(400).json({ error: 'Error: First Name, Last Name, and Zip Code are required' });
  }

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'Error: Cart is empty' });
  }

  const serverSubtotal = cartItems.reduce((sum, item) => {
    const product = products.find(candidate => candidate.id === Number(item.id));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity <= 0) return sum;
    return sum + product.price * quantity;
  }, 0);
  if (serverSubtotal <= 0) return res.status(400).json({ error: 'Error: Cart contains no valid products' });
  const serverTotal = Number((serverSubtotal * 1.08 + 4.99).toFixed(2));
  const clientTotal = Number(total);
  if (!Number.isFinite(clientTotal) || Math.abs(clientTotal - serverTotal) > 0.01) {
    return res.status(422).json({ error: 'Error: Order total does not match the server calculation', expectedTotal: serverTotal, actualTotal: clientTotal });
  }

  const order = {
    id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    customer: `${firstName} ${lastName}`,
    zipCode,
    itemsCount: cartItems.reduce((acc, i) => acc + i.quantity, 0),
    total: serverTotal,
    paymentReference: paymentReference || 'MOCK-APPROVED',
    date: new Date().toISOString()
  };

  orders.push(order);
  res.status(201).json({ success: true, order });
});

app.post('/api/payment', (req, res) => {
  const scenario = String(req.body?.scenario || 'success');
  const cardNumber = String(req.body?.cardNumber || '');
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'A valid mock payment amount is required' });
  if (scenario === 'cancel') return res.status(409).json({ error: 'Payment cancelled by the customer', code: 'PAYMENT_CANCELLED' });
  if (scenario === 'failure') return res.status(402).json({ error: 'Mock payment was declined by the simulated gateway', code: 'PAYMENT_DECLINED' });
  if (scenario === 'invalid' || (cardNumber && !/^\d{4,19}$/.test(cardNumber))) return res.status(400).json({ error: 'Mock payment details are invalid', code: 'PAYMENT_INVALID' });
  return res.json({ success: true, paymentReference: `MOCK-${Date.now().toString(36).toUpperCase()}`, status: 'approved', amount: Number(amount.toFixed(2)) });
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/reset', (req, res) => {
  products = JSON.parse(JSON.stringify(initialProducts));
  orders = [];
  res.json({ message: 'App state reset successfully' });
});

// QA Sandbox API simulation endpoint
app.get('/api/slow-endpoint', (req, res) => {
  const delay = parseInt(req.query.delay) || 3000;
  setTimeout(() => {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      message: `Response returned after ${delay}ms delay`
    });
  }, delay);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`QA Web Application Server running at http://localhost:${PORT}`);
  });
}

module.exports = { app, execution };
