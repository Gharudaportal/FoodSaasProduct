// ==========================================
// Homemade Delights - Admin JavaScript
// ==========================================

// Admin State
let adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
let adminMenuData = [];
let adminCategoriesData = [];
let adminOrdersData = [];
let adminCustomersData = [];
let adminSettingsData = {};

// Demo credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// ==========================================
// Authentication
// ==========================================
function checkAuth() {
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html') || path.endsWith('/login');
    if (!adminLoggedIn && !isLoginPage) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function login(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('adminLoggedIn', 'true');
        adminLoggedIn = true;
        showToast('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } else {
        showToast('Invalid username or password', 'error');
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    adminLoggedIn = false;
    window.location.href = 'login.html';
}

// ==========================================
// Data Loading
// ==========================================
async function loadAdminData() {
    try {
        const [menuRes, catRes, ordersRes, customersRes, settingsRes] = await Promise.all([
            fetch('../data/menu.json'),
            fetch('../data/categories.json'),
            fetch('../data/orders.json'),
            fetch('../data/customers.json'),
            fetch('../data/settings.json')
        ]);

        const jsonMenuData = await menuRes.json();
        const jsonCatData = await catRes.json();
        const jsonOrdersData = await ordersRes.json();
        const jsonCustomersData = await customersRes.json();
        const jsonSettingsData = await settingsRes.json();

        // Load from localStorage first (live data from frontend), fallback to JSON
        const localOrders = JSON.parse(localStorage.getItem('homemadeOrders')) || [];
        adminOrdersData = localOrders.length > 0 ? localOrders : jsonOrdersData;

        const localCustomers = JSON.parse(localStorage.getItem('homemadeCustomers')) || [];
        adminCustomersData = localCustomers.length > 0 ? localCustomers : jsonCustomersData;

        // Settings from localStorage first
        const localSettings = JSON.parse(localStorage.getItem('homemadeSettings'));
        adminSettingsData = localSettings || jsonSettingsData;

        // Menu and categories always from JSON (managed in admin)
        adminMenuData = JSON.parse(localStorage.getItem('adminMenu')) || jsonMenuData;
        adminCategoriesData = JSON.parse(localStorage.getItem('adminCategories')) || jsonCatData;

        renderDashboard();
        renderCategoriesTable();
        renderMenuTable();
        renderOrdersTable();
        renderCustomersTable();
        loadSettingsForm();
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// ==========================================
// Dashboard
// ==========================================
function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = adminOrdersData.filter(o => o.date === today);
    const pendingOrders = adminOrdersData.filter(o => o.status !== 'Delivered');
    const deliveredOrders = adminOrdersData.filter(o => o.status === 'Delivered');
    const revenue = adminOrdersData.reduce((sum, o) => sum + o.total, 0);

    const stats = [
        { id: 'todayOrders', value: todayOrders.length, icon: 'fa-shopping-bag', color: 'primary' },
        { id: 'revenue', value: '₹' + revenue.toLocaleString(), icon: 'fa-rupee-sign', color: 'success' },
        { id: 'pendingOrders', value: pendingOrders.length, icon: 'fa-clock', color: 'warning' },
        { id: 'deliveredOrders', value: deliveredOrders.length, icon: 'fa-check-circle', color: 'danger' }
    ];

    stats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (el) el.textContent = stat.value;
    });

    // Recent orders table
    const recentOrdersContainer = document.getElementById('recentOrders');
    if (recentOrdersContainer) {
        const recent = adminOrdersData.slice(-5).reverse();
        recentOrdersContainer.innerHTML = recent.map(order => `
            <tr>
                <td>${order.orderId}</td>
                <td>${order.customerName}</td>
                <td>₹${order.total}</td>
                <td><span class="badge-status ${order.status.toLowerCase().replace(/\s/g, '-')}">${order.status}</span></td>
                <td>${order.date}</td>
            </tr>
        `).join('');
    }
}

// ==========================================
// Categories Management
// ==========================================
function renderCategoriesTable() {
    const container = document.getElementById('categoriesTable');
    if (!container) return;

    container.innerHTML = adminCategoriesData.map((cat, i) => `
        <tr>
            <td>${cat.id}</td>
            <td><i class="fas ${cat.icon} me-2"></i>${cat.name}</td>
            <td>${cat.description}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editCategory(${i})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${i})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function showAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryIndex').value = '';
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
}

function editCategory(index) {
    const cat = adminCategoriesData[index];
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryIndex').value = index;
    document.getElementById('categoryName').value = cat.name;
    document.getElementById('categoryIcon').value = cat.icon;
    document.getElementById('categoryDesc').value = cat.description;
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
}

function saveCategory(e) {
    e.preventDefault();
    const index = document.getElementById('categoryIndex').value;
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value.trim();
    const desc = document.getElementById('categoryDesc').value.trim();

    if (index !== '') {
        adminCategoriesData[parseInt(index)] = {
            ...adminCategoriesData[parseInt(index)],
            name, icon, description: desc
        };
    } else {
        const newId = Math.max(...adminCategoriesData.map(c => c.id), 0) + 1;
        adminCategoriesData.push({ id: newId, name, icon, description: desc });
    }

    saveToLocalStorage('adminCategories', adminCategoriesData);
    renderCategoriesTable();
    bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
    showToast('Category saved successfully!', 'success');
}

function deleteCategory(index) {
    if (confirm('Are you sure you want to delete this category?')) {
        adminCategoriesData.splice(index, 1);
        saveToLocalStorage('adminCategories', adminCategoriesData);
        renderCategoriesTable();
        showToast('Category deleted successfully!', 'success');
    }
}

// ==========================================
// Menu Management
// ==========================================
function renderMenuTable() {
    const container = document.getElementById('menuTable');
    if (!container) return;

    container.innerHTML = adminMenuData.map((item, i) => `
        <tr>
            <td>${item.id}</td>
            <td><img src="../${item.image}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></td>
            <td>${item.name}</td>
            <td>₹${item.price}</td>
            <td>${item.category}</td>
            <td><span class="badge ${item.isVeg ? 'bg-success' : 'bg-danger'}">${item.isVeg ? 'Veg' : 'Non-Veg'}</span></td>
            <td><span class="badge ${item.isAvailable ? 'bg-success' : 'bg-secondary'}">${item.isAvailable ? 'Available' : 'Sold Out'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editMenuItem(${i})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${i})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function showAddMenuModal() {
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuForm').reset();
    document.getElementById('menuIndex').value = '';

    const catSelect = document.getElementById('menuCategory');
    catSelect.innerHTML = adminCategoriesData.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    new bootstrap.Modal(document.getElementById('menuModal')).show();
}

function editMenuItem(index) {
    const item = adminMenuData[index];
    document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuIndex').value = index;
    document.getElementById('menuName').value = item.name;
    document.getElementById('menuDesc').value = item.description;
    document.getElementById('menuPrice').value = item.price;
    document.getElementById('menuCategory').value = item.category;
    document.getElementById('menuVeg').value = item.isVeg ? '1' : '0';
    document.getElementById('menuAvailable').value = item.isAvailable ? '1' : '0';

    const catSelect = document.getElementById('menuCategory');
    catSelect.innerHTML = adminCategoriesData.map(c => `<option value="${c.name}" ${c.name === item.category ? 'selected' : ''}>${c.name}</option>`).join('');

    new bootstrap.Modal(document.getElementById('menuModal')).show();
}

function saveMenuItem(e) {
    e.preventDefault();
    const index = document.getElementById('menuIndex').value;
    const name = document.getElementById('menuName').value.trim();
    const description = document.getElementById('menuDesc').value.trim();
    const price = parseFloat(document.getElementById('menuPrice').value);
    const category = document.getElementById('menuCategory').value;
    const isVeg = document.getElementById('menuVeg').value === '1';
    const isAvailable = document.getElementById('menuAvailable').value === '1';

    if (index !== '') {
        adminMenuData[parseInt(index)] = {
            ...adminMenuData[parseInt(index)],
            name, description, price, category, isVeg, isAvailable
        };
    } else {
        const newId = Math.max(...adminMenuData.map(m => m.id), 0) + 1;
        adminMenuData.push({
            id: newId, name, description, price, category,
            isVeg, isAvailable, image: 'images/food-default.jpg', rating: 4.0
        });
    }

    saveToLocalStorage('adminMenu', adminMenuData);
    renderMenuTable();
    bootstrap.Modal.getInstance(document.getElementById('menuModal')).hide();
    showToast('Menu item saved successfully!', 'success');
}

function deleteMenuItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        adminMenuData.splice(index, 1);
        saveToLocalStorage('adminMenu', adminMenuData);
        renderMenuTable();
        showToast('Menu item deleted successfully!', 'success');
    }
}

// ==========================================
// Order Management
// ==========================================
function renderOrdersTable() {
    const container = document.getElementById('ordersTable');
    if (!container) return;

    const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';
    let filtered = adminOrdersData;

    if (statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === statusFilter);
    }

    container.innerHTML = filtered.map(order => `
        <tr>
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.mobile}</td>
            <td>₹${order.total}</td>
            <td>
                <select class="form-select form-select-sm" onchange="updateOrderStatus('${order.orderId}', this.value)">
                    <option value="New" ${order.status === 'New' ? 'selected' : ''}>New</option>
                    <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
                    <option value="Out For Delivery" ${order.status === 'Out For Delivery' ? 'selected' : ''}>Out For Delivery</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td>${order.date}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewOrder('${order.orderId}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-secondary" onclick="printOrder('${order.orderId}')"><i class="fas fa-print"></i></button>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, status) {
    const order = adminOrdersData.find(o => o.orderId === orderId);
    if (order) {
        order.status = status;
        localStorage.setItem('homemadeOrders', JSON.stringify(adminOrdersData));
        showToast(`Order ${orderId} status updated to ${status}`, 'success');
        renderOrdersTable();
        renderDashboard();
    }
}

function viewOrder(orderId) {
    const order = adminOrdersData.find(o => o.orderId === orderId);
    if (!order) return;

    document.getElementById('viewOrderContent').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Mobile:</strong> ${order.mobile}</p>
                <p><strong>Address:</strong> ${order.address}</p>
                <p><strong>Landmark:</strong> ${order.landmark || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Payment:</strong> ${order.paymentMethod}</p>
                <p><strong>Status:</strong> <span class="badge-status ${order.status.toLowerCase().replace(/\s/g, '-')}">${order.status}</span></p>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Time:</strong> ${order.time}</p>
                <p><strong>Notes:</strong> ${order.notes || 'N/A'}</p>
            </div>
        </div>
        <hr>
        <h6>Order Items</h6>
        <table class="table table-sm">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
                ${order.items.map(item => `
                    <tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price}</td><td>₹${item.price * item.quantity}</td></tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr class="fw-bold"><td colspan="3">Total</td><td>₹${order.total}</td></tr>
            </tfoot>
        </table>
    `;

    new bootstrap.Modal(document.getElementById('viewOrderModal')).show();
}

function printOrder(orderId) {
    const order = adminOrdersData.find(o => o.orderId === orderId);
    if (!order) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Order ${orderId}</title>
        <style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}</style>
        </head><body>
        <h2>Order Receipt - ${orderId}</h2>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Mobile:</strong> ${order.mobile}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Date:</strong> ${order.date} ${order.time}</p>
        <hr>
        <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
                ${order.items.map(item => `
                    <tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price}</td><td>₹${item.price * item.quantity}</td></tr>
                `).join('')}
            </tbody>
        </table>
        <h3 style="text-align:right">Total: ₹${order.total}</h3>
        </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function searchOrders() {
    const query = document.getElementById('searchOrders').value.toLowerCase();
    const container = document.getElementById('ordersTable');
    if (!container) return;

    const filtered = adminOrdersData.filter(o =>
        o.orderId.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.mobile.includes(query)
    );

    container.innerHTML = filtered.map(order => `
        <tr>
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.mobile}</td>
            <td>₹${order.total}</td>
            <td>
                <select class="form-select form-select-sm" onchange="updateOrderStatus('${order.orderId}', this.value)">
                    <option value="New" ${order.status === 'New' ? 'selected' : ''}>New</option>
                    <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
                    <option value="Out For Delivery" ${order.status === 'Out For Delivery' ? 'selected' : ''}>Out For Delivery</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td>${order.date}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewOrder('${order.orderId}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-secondary" onclick="printOrder('${order.orderId}')"><i class="fas fa-print"></i></button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// Customer Management
// ==========================================
function renderCustomersTable() {
    const container = document.getElementById('customersTable');
    if (!container) return;

    container.innerHTML = adminCustomersData.map((customer, i) => {
        const orderCount = Array.isArray(customer.orders) ? customer.orders.length : (customer.orders || 0);
        return `
        <tr>
            <td>${customer.id || 'N/A'}</td>
            <td>${customer.name || 'N/A'}</td>
            <td>${customer.mobile || 'N/A'}</td>
            <td>${customer.email || '-'}</td>
            <td>${orderCount}</td>
            <td>${customer.joinedDate || customer.createdAt || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewCustomerOrders(${i})"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `}).join('');
}

function viewCustomerOrders(index) {
    const customer = adminCustomersData[index];
    const customerOrders = adminOrdersData.filter(o => o.mobile === customer.mobile);

    const modalContent = document.getElementById('viewCustomerContent');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <h6>${customer.name || 'Customer'}'s Order History</h6>
        ${customerOrders.length === 0 ? '<p>No orders found.</p>' : `
            <table class="table table-sm">
                <thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                    ${customerOrders.map(o => `
                        <tr><td>${o.orderId}</td><td>${o.date}</td><td>₹${o.total}</td>
                        <td><span class="badge-status ${o.status.toLowerCase().replace(/\s/g, '-')}">${o.status}</span></td></tr>
                    `).join('')}
                </tbody>
            </table>
        `}
    `;

    const modalEl = document.getElementById('viewCustomerModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
}

// ==========================================
// Settings
// ==========================================
function loadSettingsForm() {
    if (!adminSettingsData.businessName) return;

    const form = document.getElementById('settingsForm');
    if (!form) return;

    document.getElementById('settingBusinessName').value = adminSettingsData.businessName;
    document.getElementById('settingTagline').value = adminSettingsData.tagline;
    document.getElementById('settingContact').value = adminSettingsData.contactNumber;
    document.getElementById('settingWhatsApp').value = adminSettingsData.whatsappNumber;
    document.getElementById('settingAddress').value = adminSettingsData.address;
    document.getElementById('settingEmail').value = adminSettingsData.email;
    document.getElementById('settingFacebook').value = adminSettingsData.socialMedia?.facebook || '';
    document.getElementById('settingInstagram').value = adminSettingsData.socialMedia?.instagram || '';
    document.getElementById('settingTwitter').value = adminSettingsData.socialMedia?.twitter || '';
}

function saveSettings(e) {
    e.preventDefault();
    adminSettingsData.businessName = document.getElementById('settingBusinessName').value.trim();
    adminSettingsData.tagline = document.getElementById('settingTagline').value.trim();
    adminSettingsData.contactNumber = document.getElementById('settingContact').value.trim();
    adminSettingsData.whatsappNumber = document.getElementById('settingWhatsApp').value.trim();
    adminSettingsData.address = document.getElementById('settingAddress').value.trim();
    adminSettingsData.email = document.getElementById('settingEmail').value.trim();
    adminSettingsData.socialMedia = {
        facebook: document.getElementById('settingFacebook').value.trim(),
        instagram: document.getElementById('settingInstagram').value.trim(),
        twitter: document.getElementById('settingTwitter').value.trim()
    };

    localStorage.setItem('homemadeSettings', JSON.stringify(adminSettingsData));
    showToast('Settings saved successfully!', 'success');
}

// ==========================================
// Utilities
// ==========================================
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function toggleSidebar() {
    document.querySelector('.admin-sidebar')?.classList.toggle('show');
}

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check auth on all admin pages except login
    if (!window.location.pathname.includes('login.html')) {
        checkAuth();
    }

    // Load admin data
    loadAdminData();

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }

    // Category form
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', saveCategory);
    }

    // Menu form
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', saveMenuItem);
    }

    // Settings form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }

    // Order status filter
    const statusFilter = document.getElementById('orderStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', renderOrdersTable);
    }

    // Search orders
    const searchOrdersInput = document.getElementById('searchOrders');
    if (searchOrdersInput) {
        searchOrdersInput.addEventListener('input', searchOrders);
    }
});
