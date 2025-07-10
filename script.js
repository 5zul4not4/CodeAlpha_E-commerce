// Helper functions for auth and cart
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

function isLoggedIn() {
  return !!getToken();
}

function updateNavLinks() {
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const logoutLink = document.getElementById('logout-link');
  const settingsLink = document.getElementById('settings-link');
  if (isLoggedIn()) {
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = '';
    if (settingsLink) settingsLink.style.display = '';
  } else {
    if (loginLink) loginLink.style.display = '';
    if (registerLink) registerLink.style.display = '';
    if (logoutLink) logoutLink.style.display = 'none';
    if (settingsLink) settingsLink.style.display = 'none';
  }
}

function updateCartCount() {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  let count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  let cartCount = document.getElementById('cart-count');
  if (cartCount) cartCount.textContent = count;
}

function addToCart(product, quantity = 1) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  if (cart[product._id]) {
    cart[product._id].quantity += quantity;
  } else {
    cart[product._id] = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    };
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  delete cart[productId];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function setCartQuantity(productId, quantity) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  if (cart[productId]) {
    cart[productId].quantity = quantity;
    if (quantity <= 0) delete cart[productId];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
  }
}

// Product listing
async function loadProducts() {
  updateNavLinks();
  updateCartCount();
  const res = await fetch('/api/products');
  const products = await res.json();
  const list = document.getElementById('products-list');
  list.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <a href="product.html?id=${product._id}">
        <img src="${product.image}" alt="${product.name}">
      </a>
      <h2>${product.name}</h2>
      <div class="price">$${product.price.toFixed(2)}</div>
      <p>${product.description.substring(0, 80)}...</p>
      <button class="btn" data-id="${product._id}">Add to Cart</button>
    `;
    card.querySelector('.btn').onclick = async () => {
      addToCart(product, 1);
      alert('Added to cart!');
    };
    list.appendChild(card);
  });
}

// Product detail
async function loadProductDetail() {
  updateNavLinks();
  updateCartCount();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) {
    document.getElementById('product-detail').innerHTML = '<p>Product not found.</p>';
    return;
  }
  const product = await res.json();
  const container = document.getElementById('product-detail');
  container.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <div class="details">
      <h2>${product.name}</h2>
      <div class="price">$${product.price.toFixed(2)}</div>
      <p>${product.description}</p>
      <label>Quantity: <input type="number" id="qty" value="1" min="1" style="width:60px;"></label>
      <button class="btn" id="add-to-cart-btn">Add to Cart</button>
    </div>
  `;
  document.getElementById('add-to-cart-btn').onclick = () => {
    const qty = parseInt(document.getElementById('qty').value) || 1;
    addToCart(product, qty);
    alert('Added to cart!');
  };
}

// Cart page
async function loadCartPage() {
  updateNavLinks();
  updateCartCount();
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const itemsDiv = document.getElementById('cart-items');
  const summaryDiv = document.getElementById('cart-summary');
  let total = 0;
  itemsDiv.innerHTML = '';
  let hasItems = false;
  for (let id in cart) {
    hasItems = true;
    let item = cart[id];
    total += item.price * item.quantity;
    let div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-info">
        <div><strong>${item.name}</strong></div>
        <div>$${item.price.toFixed(2)}</div>
      </div>
      <div class="cart-actions">
        <input type="number" min="1" value="${item.quantity}" data-id="${item._id}">
        <button class="btn-remove" data-id="${item._id}">Remove</button>
      </div>
    `;
    div.querySelector('input').onchange = (e) => {
      let val = parseInt(e.target.value) || 1;
      setCartQuantity(item._id, val);
      loadCartPage();
    };
    div.querySelector('.btn-remove').onclick = () => {
      removeFromCart(item._id);
      loadCartPage();
    };
    itemsDiv.appendChild(div);
  }
  if (!hasItems) {
    itemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    summaryDiv.innerHTML = '';
    document.getElementById('checkout-btn').style.display = 'none';
    return;
  }
  summaryDiv.innerHTML = `Total: $${total.toFixed(2)}`;
  document.getElementById('checkout-btn').style.display = '';
  document.getElementById('checkout-btn').onclick = async () => {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }
    // Place order
    let orderItems = [];
    for (let id in cart) {
      orderItems.push({ productId: id, quantity: cart[id].quantity });
    }
    let res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ items: orderItems })
    });
    if (res.ok) {
      localStorage.removeItem('cart');
      updateCartCount();
      window.location.href = 'confirmation.html';
    } else {
      alert('Order failed. Please try again.');
    }
  };
}

// Auth forms
function setupLoginForm() {
  updateNavLinks();
  updateCartCount();
  document.getElementById('login-form').onsubmit = async function(e) {
    e.preventDefault();
    const email = this.email.value;
    const password = this.password.value;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      window.location.href = 'index.html';
    } else {
      document.getElementById('login-error').textContent = 'Invalid credentials.';
    }
  };
}

function setupRegisterForm() {
  updateNavLinks();
  updateCartCount();
  document.getElementById('register-form').onsubmit = async function(e) {
    e.preventDefault();
    const username = this.username.value;
    const email = this.email.value;
    const password = this.password.value;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (res.ok) {
      window.location.href = 'login.html';
    } else {
      document.getElementById('register-error').textContent = 'Registration failed.';
    }
  };
}

// Settings
async function setupSettingsForm() {
  updateNavLinks();
  updateCartCount();
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  // Fetch user info
  const res = await fetch('/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + getToken() }
  });
  if (res.ok) {
    const user = await res.json();
    document.getElementById('settings-username').value = user.username;
    document.getElementById('settings-email').value = user.email;
  }
  document.getElementById('settings-form').onsubmit = async function(e) {
    e.preventDefault();
    const username = this.username.value;
    const email = this.email.value;
    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ username, email })
    });
    if (res.ok) {
      document.getElementById('settings-success').textContent = 'Profile updated!';
    } else {
      document.getElementById('settings-success').textContent = 'Update failed.';
    }
  };
}

// Contact
function setupContactForm() {
  updateNavLinks();
  updateCartCount();
  document.getElementById('contact-form').onsubmit = function(e) {
    e.preventDefault();
    document.getElementById('contact-success').textContent = 'Message sent! We will reply soon.';
    this.reset();
  };
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
  updateNavLinks();
  updateCartCount();
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.onclick = (e) => {
      e.preventDefault();
      removeToken();
      updateNavLinks();
      window.location.href = 'index.html';
    };
  }
});