class ProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.categories = new Set();
        this.currentPage = 1;
        this.productsPerPage = 8;
        this.editingProductId = null;
        this.init();
    }

    async init() {
        try {
            await this.loadProducts();
            this.setupEventListeners();
            this.renderProducts();
        } catch (error) {
            console.error('Error initializing products manager:', error);
            this.showError('Error loading products data');
        }
    }

    async loadProducts() {
        try {
            // Check localStorage first
            const savedProducts = localStorage.getItem('products');
            
            if (savedProducts) {
                this.products = JSON.parse(savedProducts);
            } else {
                // Fetch from API if no saved data
                const response = await fetch('https://jsonplaceholder.typicode.com/posts');
                const posts = await response.json();
                
                // Convert posts to products
                this.products = posts.map(post => ({
                    id: post.id,
                    name: `Product ${post.id}`,
                    description: post.title,
                    longDescription: post.body,
                    price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
                    category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][post.id % 5],
                    stock: Math.floor(Math.random() * 100),
                    image: `https://picsum.photos/seed/${post.id}/400/300`
                }));

                // Save to localStorage
                this.saveToLocalStorage();
            }

            // Update categories
            this.categories = new Set(this.products.map(p => p.category));
            this.populateCategories();
            this.renderProducts();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading products:', error);
            throw error;
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('products', JSON.stringify(this.products));
    }

    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        const productsToShow = this.filteredProducts.length > 0 ? this.filteredProducts : this.products;
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const paginatedProducts = productsToShow.slice(startIndex, endIndex);

        if (paginatedProducts.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">No products found matching your criteria.</div>
                </div>
            `;
        } else {
            container.innerHTML = paginatedProducts.map(product => `
                <div class="col-md-3 mb-4">
                    <div class="card h-100">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-truncate">${product.description}</p>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="h5 mb-0">$${product.price.toFixed(2)}</span>
                                <span class="badge bg-${this.getStockBadgeColor(product.stock)}">
                                    Stock: ${product.stock}
                                </span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <button class="btn btn-primary btn-sm" onclick="productsManager.editProduct('${product.id}')">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="productsManager.deleteProduct('${product.id}')">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        this.renderPagination(productsToShow.length);
    }

    renderPagination(totalItems) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / this.productsPerPage);
        
        let paginationHTML = `
            <nav aria-label="Product navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="productsManager.changePage(${this.currentPage - 1}); return false;">
                            Previous
                        </a>
                    </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="productsManager.changePage(${i}); return false;">
                        ${i}
                    </a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="productsManager.changePage(${this.currentPage + 1}); return false;">
                            Next
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.products.length / this.productsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderProducts();
    }

    getStockBadgeColor(stock) {
        if (stock <= 0) return 'danger';
        if (stock < 10) return 'warning';
        return 'success';
    }

    filterProducts(searchTerm = '') {
        const categoryFilter = document.getElementById('categoryFilter');
        const stockFilter = document.getElementById('stockFilter');
        
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

        // Apply stock filter
        if (stockFilter && stockFilter.value) {
            switch (stockFilter.value) {
                case 'in-stock':
                    filtered = filtered.filter(product => product.stock > 0);
                    break;
                case 'low-stock':
                    filtered = filtered.filter(product => product.stock > 0 && product.stock < 10);
                    break;
                case 'out-of-stock':
                    filtered = filtered.filter(product => product.stock <= 0);
                    break;
            }
        }

        // Reset to first page when filtering
        this.currentPage = 1;
        this.renderFilteredProducts(filtered);
    }

    renderFilteredProducts(products) {
        this.filteredProducts = products;
        this.renderProducts();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filteredProducts = this.products.filter(product => 
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm)
                );
                this.currentPage = 1; // Reset to first page
                this.renderProducts();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }

        // Stock filter
        const stockFilter = document.getElementById('stockFilter');
        if (stockFilter) {
            stockFilter.addEventListener('change', () => this.applyFilters());
        }

        // Add product button
        const addProductBtn = document.querySelector('[data-bs-target="#productModal"]');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.editingProductId = null;
                document.getElementById('productModalTitle').textContent = 'Add Product';
                document.getElementById('productForm').reset();
            });
        }

        // Save product button
        const saveProductBtn = document.getElementById('saveProductBtn');
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', () => this.saveProduct());
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryValue = document.getElementById('categoryFilter').value;
        const stockValue = document.getElementById('stockFilter').value;

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.description.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryValue || product.category === categoryValue;
            
            let matchesStock = true;
            if (stockValue === 'in') {
                matchesStock = product.stock > 10;
            } else if (stockValue === 'low') {
                matchesStock = product.stock > 0 && product.stock <= 10;
            } else if (stockValue === 'out') {
                matchesStock = product.stock <= 0;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });

        this.currentPage = 1; // Reset to first page
        this.renderProducts();
    }

    async saveProduct() {
        const form = document.getElementById('productForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const productData = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                longDescription: document.getElementById('productDescription').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                category: document.getElementById('productCategory').value,
                image: document.getElementById('productImage').value || `https://picsum.photos/seed/${Date.now()}/400/300`,
                status: 'active'
            };

            if (this.editingProductId) {
                // Update existing product
                const index = this.products.findIndex(p => p.id === this.editingProductId);
                if (index !== -1) {
                    this.products[index] = {
                        ...this.products[index],
                        ...productData
                    };
                    this.showSuccess('Product updated successfully');
                }
            } else {
                // Add new product
                const newProduct = {
                    ...productData,
                    id: Date.now().toString(),
                    longDescription: productData.description,
                    status: 'active'
                };
                this.products.unshift(newProduct);
                this.showSuccess('Product added successfully');
            }

            // Save to localStorage
            localStorage.setItem('products', JSON.stringify(this.products));

            // Close modal and refresh display
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
            
            this.renderProducts();

        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('Error saving product');
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id.toString() === productId.toString());
        if (!product) return;

        this.editingProductId = product.id;
        
        // Populate form
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productImage').value = product.image;

        // Update modal title
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            // Remove product from local array
            this.products = this.products.filter(product => product.id.toString() !== productId.toString());
            
            // Save to localStorage
            this.saveToLocalStorage();
            
            this.showSuccess('Product deleted successfully');
            
            // Recalculate pagination if necessary
            const filteredProducts = this.getFilteredProducts();
            const totalPages = Math.ceil(filteredProducts.length / this.productsPerPage);
            if (this.currentPage > totalPages) {
                this.currentPage = totalPages || 1;
            }
            
            this.renderProducts();
            this.renderPagination();
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Error deleting product');
        }
    }

    resetData() {
        if (confirm('Are you sure you want to reset all data? This will remove all changes.')) {
            localStorage.removeItem('products');
            location.reload();
        }
    }

    populateCategories() {
        const select = document.getElementById('categoryFilter');
        if (!select) return;

        select.innerHTML = `
            <option value="">All Categories</option>
            ${[...this.categories].map(category => `
                <option value="${category}">${category}</option>
            `).join('')}
        `;
    }

    showSuccess(message) {
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

    showError(message) {
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
}

// Initialize products manager
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
}); 