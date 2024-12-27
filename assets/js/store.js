class Store {
    constructor() {
        this.products = [];
        this.cart = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing store...');
            await this.loadProducts();
            this.setupEventListeners();
            this.renderProducts();
            this.renderCart();
            this.updateCartCount();
            console.log('Store initialized successfully');
        } catch (error) {
            console.error('Error initializing store:', error);
            const productsContainer = document.getElementById('productsGrid');
            if (productsContainer) {
                productsContainer.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger" role="alert">
                            Failed to load products. Please refresh the page.
                        </div>
                    </div>
                `;
            }
        }
    }

    async loadProducts() {
        try {
            // Get products from localStorage (same as products manager)
            const savedProducts = localStorage.getItem('products');
            
            if (savedProducts) {
                console.log('Found products in localStorage');
                this.products = JSON.parse(savedProducts);
            } else {
                // If no products exist, create default ones
                const response = await fetch('https://jsonplaceholder.typicode.com/posts');
                const posts = await response.json();
                
                this.products = posts.slice(0, 50).map(post => ({
                    id: post.id.toString(),
                    name: `Product ${post.id}`,
                    description: post.title,
                    longDescription: post.body,
                    price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
                    category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][post.id % 5],
                    stock: Math.floor(Math.random() * 100),
                    image: `https://picsum.photos/seed/${post.id}/400/300`
                }));

                localStorage.setItem('products', JSON.stringify(this.products));
            }

            // Load cart data
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }

            console.log('Loaded products:', this.products.length);
        } catch (error) {
            console.error('Error in loadProducts:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Add search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterProducts(e.target.value));
        }

        // Add category filter functionality
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterProducts());
        }

        // Add sort functionality
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.filterProducts());
        }
    }

    filterProducts(searchTerm = '') {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        let filtered = this.products;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (categoryFilter && categoryFilter.value) {
            filtered = filtered.filter(product => product.category === categoryFilter.value);
        }

        // Apply sorting
        if (sortFilter) {
            switch (sortFilter.value) {
                case 'price-low':
                    filtered.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filtered.sort((a, b) => b.price - a.price);
                    break;
                default:
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
            }
        }

        this.renderFilteredProducts(filtered);
    }

    renderFilteredProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">No products found.</div>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProducts = products.slice(startIndex, endIndex);

        productsGrid.innerHTML = paginatedProducts.map(product => `
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="h5 mb-0">$${product.price.toFixed(2)}</span>
                            <span class="badge bg-${this.getStockBadgeColor(product.stock)}">
                                Stock: ${product.stock}
                            </span>
                        </div>
                        <button class="btn btn-primary w-100" onclick="store.addToCart('${product.id}')" 
                                ${product.stock <= 0 ? 'disabled' : ''}>
                            ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.renderPagination(products.length);
    }

    getStockBadgeColor(stock) {
        if (stock <= 0) return 'danger';
        if (stock < 10) return 'warning';
        return 'success';
    }

    renderProducts() {
        this.renderFilteredProducts(this.products);
    }

    renderPagination(totalItems) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        let paginationHTML = `
            <ul class="pagination justify-content-center">
                <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="store.changePage(${this.currentPage - 1}); return false;">Previous</a>
                </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="store.changePage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
                <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="store.changePage(${this.currentPage + 1}); return false;">Next</a>
                </li>
            </ul>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.products.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderProducts();
    }

    renderCart() {
        console.log('Rendering cart...');
        const cartContainer = document.getElementById('cartItems');
        if (!cartContainer) {
            console.log('Cart container not found - might be on a different page');
            return;
        }

        try {
            if (this.cart.length === 0) {
                cartContainer.innerHTML = '<li class="list-group-item">Your cart is empty</li>';
                return;
            }

            cartContainer.innerHTML = this.cart.map(item => `
                <li class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${item.name}</h6>
                            <small class="text-muted">$${item.price.toFixed(2)} x ${item.quantity}</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <input type="number" class="form-control form-control-sm me-2" 
                                style="width: 60px;" value="${item.quantity}" min="1"
                                onchange="store.updateCartQuantity('${item.id}', this.value)">
                            <button class="btn btn-danger btn-sm" onclick="store.removeFromCart('${item.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </li>
            `).join('');

            this.updateCartTotal();
            console.log('Cart rendered successfully');
        } catch (error) {
            console.error('Error rendering cart:', error);
            cartContainer.innerHTML = '<li class="list-group-item">Error loading cart</li>';
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    updateCartTotal() {
        const totalElement = document.getElementById('cartTotal');
        if (totalElement) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        console.log('Cart saved to localStorage');
    }

    showError(message) {
        console.error('Error:', message);
        const content = document.querySelector('.container-fluid');
        if (content) {
            content.insertAdjacentHTML('afterbegin', `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `);
        }
    }

    showSuccess(message) {
        console.log('Success:', message);
        const content = document.querySelector('.container-fluid');
        if (content) {
            content.insertAdjacentHTML('afterbegin', `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `);
        }
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id.toString() === productId.toString());
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        if (product.stock <= 0) {
            this.showError('Sorry, this product is out of stock.');
            return;
        }

        const cartItem = this.cart.find(item => item.id.toString() === productId.toString());
        if (cartItem) {
            if (cartItem.quantity >= product.stock) {
                this.showError('Sorry, no more stock available for this product.');
                return;
            }
            cartItem.quantity++;
        } else {
            this.cart.push({
                id: product.id.toString(),
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        this.saveCart();
        this.renderCart();
        this.updateCartCount();
        this.showSuccess('Product added to cart');
    }
}

// Initialize store when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.store = new Store();
}); 