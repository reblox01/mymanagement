class StoreManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.cart = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderCategories();
            this.renderProducts();
            this.updateCartCount();
        } catch (error) {
            console.error('Error initializing store:', error);
        }
    }

    async loadData() {
        try {
            // Load products from API
            const productsResponse = await api.get('/products');
            this.products = productsResponse.data || [];

            // Extract unique categories from products
            this.categories = [...new Set(this.products.map(product => product.category))];

            // If no data, generate sample data
            if (this.products.length === 0) {
                this.generateSampleData();
            }

            // Load cart from localStorage
            const savedCart = localStorage.getItem('cart');
            this.cart = savedCart ? JSON.parse(savedCart) : [];

        } catch (error) {
            console.error('Error loading data:', error);
            this.generateSampleData();
        }
    }

    generateSampleData() {
        // Sample categories
        this.categories = ['Electronics', 'Clothing', 'Books', 'Food', 'Sports'];

        // Generate sample products
        this.products = Array.from({ length: 20 }, (_, i) => ({
            id: (i + 1).toString(),
            name: `Product ${i + 1}`,
            description: `Description for Product ${i + 1}`,
            price: (Math.random() * 100 + 20).toFixed(2),
            category: this.categories[Math.floor(Math.random() * this.categories.length)],
            image: `https://picsum.photos/seed/product${i + 1}/300/200`,
            stock: Math.floor(Math.random() * 100) + 1
        }));

        localStorage.setItem('products', JSON.stringify(this.products));
    }

    setupEventListeners() {
        // Search input
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterProducts();
        });

        // Category filter
        document.getElementById('categoryFilter')?.addEventListener('change', () => {
            this.filterProducts();
        });

        // Sort filter
        document.getElementById('sortFilter')?.addEventListener('change', () => {
            this.filterProducts();
        });

        // Load more button
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            this.currentPage++;
            this.renderProducts(false);
        });

        // Checkout button
        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            this.checkout();
        });
    }

    renderCategories() {
        // Render category cards
        const categoriesList = document.getElementById('categoriesList');
        if (categoriesList) {
            categoriesList.innerHTML = this.categories.map(category => `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <img src="https://picsum.photos/seed/${category}/300/200" class="card-img-top" alt="${category}">
                        <div class="card-body">
                            <h5 class="card-title">${category}</h5>
                            <a href="#products" class="btn btn-primary" 
                               onclick="storeManager.filterByCategory('${category}')">
                                View Products
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = `
                <option value="">All Categories</option>
                ${this.categories.map(category => 
                    `<option value="${category}">${category}</option>`
                ).join('')}
            `;
        }
    }

    filterByCategory(category) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = category;
            this.filterProducts();
        }
    }

    filterProducts() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const sortFilter = document.getElementById('sortFilter')?.value || 'name';

        let filtered = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        // Sort products
        filtered.sort((a, b) => {
            switch (sortFilter) {
                case 'price-asc':
                    return parseFloat(a.price) - parseFloat(b.price);
                case 'price-desc':
                    return parseFloat(b.price) - parseFloat(a.price);
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        this.currentPage = 1;
        this.renderProducts(true, filtered);
    }

    renderProducts(reset = true, filteredProducts = null) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        const products = filteredProducts || this.products;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProducts = products.slice(0, endIndex);

        if (reset) {
            productsGrid.innerHTML = '';
        }

        paginatedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'col-md-3 mb-4';
            productCard.innerHTML = `
                <div class="card h-100">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="card-text"><strong>$${product.price}</strong></p>
                        <button class="btn btn-primary" onclick="storeManager.addToCart('${product.id}')">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });

        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = endIndex < products.length ? 'inline-block' : 'none';
        }
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const cartItem = this.cart.find(item => item.productId === productId);
        if (cartItem) {
            cartItem.quantity++;
        } else {
            this.cart.push({
                productId,
                quantity: 1,
                price: product.price
            });
        }

        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.renderCart();
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    renderCart() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center">Your cart is empty</p>';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => {
            const product = this.products.find(p => p.id === item.productId);
            return `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h6 class="mb-0">${product.name}</h6>
                        <small class="text-muted">$${product.price} x ${item.quantity}</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-primary me-2" 
                                onclick="storeManager.updateCartItem('${item.productId}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-primary ms-2" 
                                onclick="storeManager.updateCartItem('${item.productId}', ${item.quantity + 1})">+</button>
                        <button class="btn btn-sm btn-outline-danger ms-3" 
                                onclick="storeManager.removeFromCart('${item.productId}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.updateCartTotal();
    }

    updateCartItem(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        const cartItem = this.cart.find(item => item.productId === productId);
        if (cartItem) {
            cartItem.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateCartCount();
            this.renderCart();
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.renderCart();
    }

    updateCartTotal() {
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            const total = this.cart.reduce((sum, item) => {
                const product = this.products.find(p => p.id === item.productId);
                return sum + (parseFloat(product.price) * item.quantity);
            }, 0);
            cartTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    async checkout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        try {
            // Get existing orders
            let existingOrders = [];
            try {
                const savedOrders = localStorage.getItem('orders');
                existingOrders = savedOrders ? JSON.parse(savedOrders) : [];
            } catch (error) {
                console.warn('Error loading existing orders:', error);
                existingOrders = [];
            }

            // Create order items from cart
            const orderItems = this.cart.map(item => {
                const product = this.products.find(p => p.id === item.productId);
                return {
                    productId: item.productId,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.price
                };
            });

            // Calculate total
            const total = this.cart.reduce((sum, item) => {
                const product = this.products.find(p => p.id === item.productId);
                return sum + (parseFloat(product.price) * item.quantity);
            }, 0);

            // Create new order
            const newOrder = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                clientId: "guest",
                clientName: "Guest User",
                items: orderItems,
                status: "pending",
                total: total.toFixed(2),
                paymentStatus: "unpaid"
            };

            // Add new order to existing orders
            existingOrders.unshift(newOrder);

            // Save updated orders
            localStorage.setItem('orders', JSON.stringify(existingOrders));

            // Clear cart
            this.cart = [];
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateCartCount();
            this.renderCart();

            // Show success message
            alert('Order placed successfully! Check the dashboard orders section.');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (modal) {
                modal.hide();
            }

        } catch (error) {
            console.error('Error during checkout:', error);
            alert('There was an error processing your order. Please try again.');
        }
    }
}

// Initialize store
document.addEventListener('DOMContentLoaded', () => {
    window.storeManager = new StoreManager();
});