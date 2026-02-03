const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();
    setupForms();
});

// --- Auth Handling ---
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLogin(true);
    } else {
        showLogin(false);
        loadDashboardData();
    }
}

function showLogin(show) {
    const overlay = document.getElementById('login-overlay');
    overlay.style.display = show ? 'flex' : 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.auth) {
            localStorage.setItem('adminToken', data.token);
            showLogin(false);
            loadDashboardData();
        } else {
            errorEl.textContent = 'Invalid credentials';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Server connection failed';
        errorEl.style.display = 'block';
    }
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    location.reload();
});

// --- Navigation ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const section = item.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                switchSection(section);
            }
        });
    });
}

function switchSection(sectionId) {
    // Nav UI
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    // Section UI
    document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');

    // Update Title
    document.getElementById('section-title').textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    // Load content
    if (sectionId === 'products') loadProducts();
    if (sectionId === 'messages') loadMessages();
}

// --- Data Loading ---
async function loadDashboardData() {
    try {
        const products = await fetchAPI('/products');
        const messages = await fetchAPI('/contact');

        document.getElementById('stat-products').textContent = products.length;
        document.getElementById('stat-messages').textContent = messages.length;
    } catch (err) {
        console.error('Data load error', err);
    }
}

async function loadProducts() {
    const tableBody = document.getElementById('products-table-body');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading products...</td></tr>';

    try {
        const products = await fetchAPI('/products');
        tableBody.innerHTML = '';
        products.forEach(p => {
            const row = `
                <tr>
                    <td><img src="${p.image || 'images/placeholder.jpg'}" class="product-img-mini"></td>
                    <td>${p.name}</td>
                    <td>${p.category}</td>
                    <td>$${p.price}</td>
                    <td>${p.stock}</td>
                    <td class="action-btns">
                        <button class="btn-small" onclick="deleteProduct(${p.id})">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load.</td></tr>';
    }
}

async function loadMessages() {
    const tableBody = document.getElementById('messages-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading messages...</td></tr>';

    try {
        const messages = await fetchAPI('/contact');
        tableBody.innerHTML = '';
        messages.forEach(m => {
            const date = new Date(m.created_at).toLocaleDateString();
            const row = `
                <tr>
                    <td>${date}</td>
                    <td>${m.name}</td>
                    <td>${m.email}</td>
                    <td>${m.subject}</td>
                    <td>${m.message}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load.</td></tr>';
    }
}

// --- Product Actions ---
function openAddProductModal() {
    document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await fetchAPI(`/products/${id}`, 'DELETE');
            loadProducts();
            loadDashboardData();
        } catch (err) {
            alert('Delete failed');
        }
    }
}

// --- Utils ---
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('adminToken');
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        location.reload();
        throw new Error('Unauthorized');
    }
    return response.json();
}

function setupForms() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pData = {
            name: document.getElementById('p-name').value,
            price: document.getElementById('p-price').value,
            category: document.getElementById('p-category').value,
            description: document.getElementById('p-desc').value,
            image: document.getElementById('p-image').value,
            stock: 10
        };

        try {
            await fetchAPI('/products', 'POST', pData);
            closeProductModal();
            loadProducts();
            loadDashboardData();
        } catch (err) {
            alert('Save failed');
        }
    });
}
