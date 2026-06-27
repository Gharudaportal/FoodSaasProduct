// ==========================================
// Homemade Delights - Main JavaScript
// ==========================================

// Global Variables
let menuData = [];
let categoriesData = [];
let settingsData = {};
let cart = JSON.parse(localStorage.getItem('homemadeCart')) || [];

// Clear old orders from localStorage - only keep today's orders
function cleanupOldOrders() {
    const today = new Date().toISOString().split('T')[0];
    let orders = JSON.parse(localStorage.getItem('homemadeOrders')) || [];
    const todaysOrders = orders.filter(o => o.date === today);
    localStorage.setItem('homemadeOrders', JSON.stringify(todaysOrders));
}
cleanupOldOrders();

// ==========================================
// Loading Screen
// ==========================================
function hideLoadingScreen() {
    const loader = document.querySelector('.loading-screen');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 500);
    }
}

// ==========================================
// Data Loading
// ==========================================
async function loadSettings() {
    try {
        // Check localStorage first (updated from admin panel)
        const localSettings = localStorage.getItem('homemadeSettings');
        if (localSettings) {
            settingsData = JSON.parse(localSettings);
            applySettings();
            return;
        }

        // Fallback to JSON file
        const response = await fetch('data/settings.json');
        settingsData = await response.json();
        applySettings();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function loadMenu() {
    try {
        const response = await fetch('data/menu.json');
        menuData = await response.json();
        renderMenu(menuData);
        renderFeaturedMenu();
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch('data/categories.json');
        categoriesData = await response.json();
        renderCategoryFilters();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ==========================================
// Apply Settings
// ==========================================
function applySettings() {
    if (!settingsData.businessName) return;

    // Update page title
    document.title = settingsData.businessName + ' - ' + settingsData.tagline;

    // Update brand names
    document.querySelectorAll('.brand-name').forEach(el => {
        el.textContent = settingsData.businessName;
    });

    // Update contact info
    document.querySelectorAll('.contact-number').forEach(el => {
        el.textContent = settingsData.contactNumber;
        if (el.tagName === 'A') el.href = 'tel:' + settingsData.contactNumber;
    });

    document.querySelectorAll('.whatsapp-number').forEach(el => {
        el.textContent = settingsData.whatsappNumber;
        if (el.tagName === 'A') el.href = 'https://wa.me/' + settingsData.whatsappNumber.replace(/\D/g, '');
    });

    document.querySelectorAll('.business-address').forEach(el => {
        el.textContent = settingsData.address;
    });

    // Update hero section
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && settingsData.hero) {
        heroTitle.innerHTML = settingsData.hero.title.replace('Delivered Daily', '<span>Delivered Daily</span>');
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && settingsData.hero) {
        heroSubtitle.textContent = settingsData.hero.subtitle;
    }

    // Update about section
    const aboutTitle = document.querySelector('.about-title');
    if (aboutTitle && settingsData.about) {
        aboutTitle.textContent = settingsData.about.title;
    }

    const aboutDesc = document.querySelector('.about-description');
    if (aboutDesc && settingsData.about) {
        aboutDesc.textContent = settingsData.about.description;
    }

    // Render about features
    const featuresContainer = document.querySelector('.about-features');
    if (featuresContainer && settingsData.about && settingsData.about.features) {
        featuresContainer.innerHTML = settingsData.about.features.map(feature => `
            <div class="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="100">
                <div class="feature-box">
                    <div class="icon"><i class="fas ${feature.icon}"></i></div>
                    <h4>${feature.title}</h4>
                    <p>${feature.description}</p>
                </div>
            </div>
        `).join('');
    }

    // Render testimonials
    const testimonialsContainer = document.querySelector('.testimonials-container');
    if (testimonialsContainer && settingsData.testimonials) {
        testimonialsContainer.innerHTML = settingsData.testimonials.map((t, i) => `
            <div class="col-lg-3 col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${i * 100}">
                <div class="testimonial-card">
                    <div class="quote-icon"><i class="fas fa-quote-left"></i></div>
                    <p class="text">${t.text}</p>
                    <div class="stars">
                        ${Array(t.rating).fill('<i class="fas fa-star"></i>').join('')}
                        ${Array(5 - t.rating).fill('<i class="far fa-star"></i>').join('')}
                    </div>
                    <div class="author">
                        <img src="${t.image}" alt="${t.name}" loading="lazy">
                        <div>
                            <p class="author-name">${t.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render gallery
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer && settingsData.gallery) {
        galleryContainer.innerHTML = settingsData.gallery.map((img, i) => `
            <div class="col-lg-4 col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${i * 100}">
                <div class="gallery-item" onclick="openLightbox('${img}')">
                    <img src="${img}" alt="Gallery Image" loading="lazy">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update hero stats
    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer && settingsData.hero && settingsData.hero.stats) {
        statsContainer.innerHTML = settingsData.hero.stats.map((stat, i) => `
            <div class="col-6 col-md-3" data-aos="fade-up" data-aos-delay="${i * 150}">
                <div class="stat-item">
                    <span class="stat-number" data-target="${stat.value}">0</span>
                    <span class="stat-label">${stat.label}</span>
                </div>
            </div>
        `).join('');
        animateCounters();
    }
}

// ==========================================
// Menu Rendering
// ==========================================
function renderMenu(items) {
    const container = document.getElementById('menuContainer');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-400);"></i>
                <p class="mt-3 text-muted">No items found matching your criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map((item, i) => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4" data-aos="fade-up" data-aos-delay="${i % 4 * 100}">
            <div class="food-card">
                <div class="card-img-wrapper">
                    <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'">
                    <span class="badge-${item.isVeg ? 'veg' : 'nonveg'}">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                    ${!item.isAvailable ? '<span class="badge-soldout">Sold Out</span>' : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">${item.description}</p>
                    <div class="card-footer-custom">
                        <span class="price">₹${item.price}</span>
                        <button class="btn-add-cart" onclick="addToCart(${item.id})" ${!item.isAvailable ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus me-1"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderFeaturedMenu() {
    const container = document.getElementById('featuredMenuContainer');
    if (!container || !menuData.length) return;

    const featured = menuData.slice(0, 8);
    container.innerHTML = featured.map((item, i) => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4" data-aos="fade-up" data-aos-delay="${i % 4 * 100}">
            <div class="food-card">
                <div class="card-img-wrapper">
                    <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'">
                    <span class="badge-${item.isVeg ? 'veg' : 'nonveg'}">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                    ${!item.isAvailable ? '<span class="badge-soldout">Sold Out</span>' : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">${item.description}</p>
                    <div class="card-footer-custom">
                        <span class="price">₹${item.price}</span>
                        <button class="btn-add-cart" onclick="addToCart(${item.id})" ${!item.isAvailable ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus me-1"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container || !categoriesData.length) return;

    container.innerHTML = `
        <button class="filter-btn active" data-category="all" onclick="filterByCategory('all')">All</button>
        ${categoriesData.map(cat => `
            <button class="filter-btn" data-category="${cat.name}" onclick="filterByCategory('${cat.name}')">${cat.name}</button>
        `).join('')}
    `;
}

// ==========================================
// Filters
// ==========================================
let currentCategory = 'all';
let currentVegFilter = 'all';
let currentSearch = '';

function filterByCategory(category) {
    currentCategory = category;
    applyFilters();

    document.querySelectorAll('#categoryFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
}

function filterByVeg(type) {
    currentVegFilter = type;
    applyFilters();

    document.querySelectorAll('#vegFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.veg === type);
    });
}

function searchFood(query) {
    currentSearch = query.toLowerCase();
    applyFilters();
}

function applyFilters() {
    let filtered = menuData;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategory);
    }

    if (currentVegFilter !== 'all') {
        filtered = filtered.filter(item => item.isVeg === (currentVegFilter === 'veg'));
    }

    if (currentSearch) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(currentSearch) ||
            item.description.toLowerCase().includes(currentSearch)
        );
    }

    renderMenu(filtered);
}

// ==========================================
// Cart Functions
// ==========================================
function addToCart(itemId) {
    const item = menuData.find(i => i.id === itemId);
    if (!item || !item.isAvailable) return;

    const existingItem = cart.find(c => c.id === itemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    showToast(`${item.name} added to cart!`, 'success');
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    saveCart();
    updateCartUI();
    renderCartPage();
}

function updateQuantity(itemId, change) {
    const item = cart.find(c => c.id === itemId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(itemId);
        return;
    }

    saveCart();
    updateCartUI();
    renderCartPage();
}

function saveCart() {
    localStorage.setItem('homemadeCart', JSON.stringify(cart));
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function renderCartPage() {
    const container = document.getElementById('cartItemsContainer');
    const summaryContainer = document.getElementById('cartSummary');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p class="text-muted">Browse our menu and add some delicious items!</p>
                <a href="menu.html" class="btn btn-primary-custom mt-3">Browse Menu</a>
            </div>
        `;
        if (summaryContainer) summaryContainer.style.display = 'none';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="row align-items-center">
                <div class="col-3 col-md-2">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="col-5 col-md-4">
                    <p class="item-name mb-1">${item.name}</p>
                    <p class="item-price mb-0">₹${item.price}</p>
                </div>
                <div class="col-4 col-md-3">
                    <div class="quantity-control">
                        <button onclick="updateQuantity(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                        <span class="quantity">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div class="col-md-2 text-md-end mt-2 mt-md-0">
                    <span class="fw-bold">₹${item.price * item.quantity}</span>
                </div>
                <div class="col-md-1 text-md-end mt-2 mt-md-0">
                    <button class="btn btn-link text-danger" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    if (summaryContainer) {
        summaryContainer.style.display = 'block';
        const subtotal = getCartTotal();
        const delivery = subtotal > 500 ? 0 : 40;
        const total = subtotal + delivery;

        document.getElementById('cartSubtotal').textContent = '₹' + subtotal;
        document.getElementById('cartDelivery').textContent = delivery === 0 ? 'Free' : '₹' + delivery;
        document.getElementById('cartTotal').textContent = '₹' + total;
    }
}

// ==========================================
// Checkout
// ==========================================
function renderCheckoutSummary() {
    const container = document.getElementById('checkoutItems');
    if (!container) return;

    container.innerHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
        </div>
    `).join('');

    const subtotal = getCartTotal();
    const delivery = subtotal > 500 ? 0 : 40;
    const total = subtotal + delivery;

    document.getElementById('checkoutSubtotal').textContent = '₹' + subtotal;
    document.getElementById('checkoutDelivery').textContent = delivery === 0 ? 'Free' : '₹' + delivery;
    document.getElementById('checkoutTotal').textContent = '₹' + total;
}

function selectPayment(method) {
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    document.getElementById('payment_' + method).closest('.payment-method').classList.add('selected');
}

function placeOrder() {
    const name = document.getElementById('customerName').value.trim();
    const mobile = document.getElementById('customerMobile').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();

    if (!name || !mobile || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const orderId = 'HD' + (1000 + Math.floor(Math.random() * 9000));
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash On Delivery';
    const landmark = document.getElementById('landmark')?.value || '';
    const notes = document.getElementById('orderNotes')?.value || '';

    const order = {
        orderId: orderId,
        customerName: name,
        mobile: mobile,
        address: address,
        landmark: landmark,
        notes: notes,
        paymentMethod: paymentMethod,
        status: 'New',
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: getCartTotal(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    // Save to localStorage orders
    let orders = JSON.parse(localStorage.getItem('homemadeOrders')) || [];
    orders.push(order);
    localStorage.setItem('homemadeOrders', JSON.stringify(orders));

    // Save/update customer details
    saveCustomerDetails({
        name: name,
        mobile: mobile,
        address: address,
        landmark: landmark
    });

    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();

    // Redirect to success page
    window.location.href = 'order-success.html?orderId=' + orderId;
}

function saveCustomerDetails(customer) {
    let customers = JSON.parse(localStorage.getItem('homemadeCustomers')) || [];
    const existingIndex = customers.findIndex(c => c.mobile === customer.mobile);
    if (existingIndex >= 0) {
        // Update existing customer if any details changed
        const existing = customers[existingIndex];
        customers[existingIndex] = {
            ...existing,
            name: customer.name,
            mobile: customer.mobile,
            address: customer.address,
            landmark: customer.landmark,
            orders: existing.orders ? [...existing.orders, ''] : [''],
            joinedDate: existing.joinedDate || new Date().toISOString().split('T')[0]
        };
    } else {
        // Add new customer
        customers.push({
            id: 'C' + (100 + customers.length + 1),
            name: customer.name,
            mobile: customer.mobile,
            address: customer.address,
            landmark: customer.landmark,
            email: '',
            orders: [''],
            joinedDate: new Date().toISOString().split('T')[0]
        });
    }
    localStorage.setItem('homemadeCustomers', JSON.stringify(customers));
}

// ==========================================
// Order Tracking
// ==========================================
function trackOrder() {
    const orderId = document.getElementById('trackOrderId').value.trim().toUpperCase();
    if (!orderId) {
        showToast('Please enter an order number', 'warning');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('homemadeOrders')) || [];
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
        showToast('Order not found. Please check the order number.', 'error');
        return;
    }

    renderOrderStatus(order);
}

function renderOrderStatus(order) {
    const container = document.getElementById('trackingResult');
    if (!container) return;

    const statuses = ['New', 'Accepted', 'Preparing', 'Ready', 'Out For Delivery', 'Delivered'];
    const currentIndex = statuses.indexOf(order.status);

    container.innerHTML = `
        <div class="tracking-card mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="mb-1">Order #${order.orderId}</h4>
                    <p class="text-muted mb-0">Placed on ${order.date} at ${order.time}</p>
                </div>
                <span class="badge-status ${order.status.toLowerCase().replace(/\s/g, '-')}">${order.status}</span>
            </div>
            <div class="status-timeline">
                ${statuses.map((status, i) => `
                    <div class="timeline-item ${i <= currentIndex ? 'active' : ''} ${i < currentIndex ? 'completed' : ''}">
                        <div class="dot"></div>
                        <div class="status-label">${status}</div>
                        <div class="status-time">${i <= currentIndex ? 'Completed' : 'Pending'}</div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-4 pt-4 border-top">
                <h5>Order Items</h5>
                ${order.items.map(item => `
                    <div class="d-flex justify-content-between py-2">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>₹${item.price * item.quantity}</span>
                    </div>
                `).join('')}
                <div class="d-flex justify-content-between pt-3 border-top fw-bold">
                    <span>Total</span>
                    <span>₹${order.total}</span>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// Lightbox
// ==========================================
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ==========================================
// Counter Animation
// ==========================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString();
            }
        };

        updateCounter();
    });
}

// ==========================================
// Toast Notifications
// ==========================================
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

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

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

// ==========================================
// Navbar Scroll Effect
// ==========================================
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

// ==========================================
// Back to Top
// ==========================================
function handleBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (btn) {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// Contact Form
// ==========================================
function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email || !message) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    showToast('Message sent successfully! We will get back to you soon.', 'success');
    form.reset();
}

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    hideLoadingScreen();
    loadSettings();
    loadMenu();
    loadCategories();
    updateCartUI();

    // Navbar scroll
    window.addEventListener('scroll', () => {
        handleNavbarScroll();
        handleBackToTop();
    });

    // Search input
    const searchInput = document.getElementById('searchFood');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchFood(e.target.value));
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Lightbox close
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    // Render cart page if on cart page
    renderCartPage();

    // Render checkout if on checkout page
    renderCheckoutSummary();

    // Check for order success
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId && document.getElementById('successOrderId')) {
        document.getElementById('successOrderId').textContent = orderId;
    }

    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }
});
