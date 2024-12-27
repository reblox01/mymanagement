class OrdersManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.clients = [];
        this.products = [];
        this.currentPage = 1;
        this.ordersPerPage = 8;
        this.editingOrderId = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderOrders();
            this.populateClientSelect();
            this.populateProductSelects();
        } catch (error) {
            console.error('Error initializing orders manager:', error);
            this.showError('Error loading orders data');
        }
    }

    async loadData() {
        // Load clients
        const savedClients = localStorage.getItem('clients');
        this.clients = savedClients ? JSON.parse(savedClients) : [];

        // Load products
        const savedProducts = localStorage.getItem('products');
        this.products = savedProducts ? JSON.parse(savedProducts) : [];

        // Load orders
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
            this.orders = JSON.parse(savedOrders);
        } else {
            // Create sample orders if none exist
            this.orders = Array.from({ length: 15 }, (_, i) => ({
                id: (i + 1).toString(),
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                clientId: this.clients[Math.floor(Math.random() * this.clients.length)]?.id || '1',
                items: [
                    {
                        productId: this.products[Math.floor(Math.random() * this.products.length)]?.id || '1',
                        quantity: Math.floor(Math.random() * 5) + 1,
                        price: (Math.random() * 100 + 20).toFixed(2)
                    }
                ],
                status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
                paymentStatus: ['paid', 'unpaid'][Math.floor(Math.random() * 2)],
                notes: '',
                total: (Math.random() * 500 + 100).toFixed(2)
            }));

            localStorage.setItem('orders', JSON.stringify(this.orders));
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // Payment filter
        const paymentFilter = document.getElementById('paymentFilter');
        if (paymentFilter) {
            paymentFilter.addEventListener('change', () => this.applyFilters());
        }

        // Date filter
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.applyFilters());
        }

        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.addProductRow());
        }

        // Save order button
        const saveOrderBtn = document.getElementById('saveOrderBtn');
        if (saveOrderBtn) {
            saveOrderBtn.addEventListener('click', () => this.saveOrder());
        }

        // Product list events delegation
        const productsList = document.getElementById('productsList');
        if (productsList) {
            productsList.addEventListener('change', (e) => {
                if (e.target.classList.contains('product-select')) {
                    this.updateProductPrice(e.target);
                }
                if (e.target.classList.contains('product-quantity')) {
                    this.updateOrderTotal();
                }
            });

            productsList.addEventListener('click', (e) => {
                if (e.target.closest('.remove-product')) {
                    e.target.closest('.row').remove();
                    this.updateOrderTotal();
                }
            });
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusValue = document.getElementById('statusFilter').value;
        const paymentValue = document.getElementById('paymentFilter').value;
        const dateValue = document.getElementById('dateFilter').value;
        const clientValue = document.getElementById('clientFilter')?.value;

        this.filteredOrders = this.orders.filter(order => {
            const client = this.clients.find(c => c.id === order.clientId);
            
            // Search in order ID, client name, and items
            const matchesSearch = 
                order.id.toString().toLowerCase().includes(searchTerm) ||
                (client && client.name.toLowerCase().includes(searchTerm)) ||
                order.items.some(item => {
                    const product = this.products.find(p => p.id === item.productId);
                    return product && product.name.toLowerCase().includes(searchTerm);
                });
            
            // Filter by status, payment, date and client
            const matchesStatus = !statusValue || order.status === statusValue;
            const matchesPayment = !paymentValue || order.paymentStatus === paymentValue;
            const matchesDate = !dateValue || order.date === dateValue;
            const matchesClient = !clientValue || order.clientId === clientValue;

            return matchesSearch && matchesStatus && matchesPayment && matchesDate && matchesClient;
        });

        this.currentPage = 1;
        this.renderOrders();
    }

    renderOrders() {
        const container = document.getElementById('ordersTable');
        if (!container) return;

        const ordersToShow = this.filteredOrders.length > 0 ? this.filteredOrders : this.orders;
        const startIndex = (this.currentPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        const paginatedOrders = ordersToShow.slice(startIndex, endIndex);

        if (paginatedOrders.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No orders found matching your criteria.</td>
                </tr>
            `;
        } else {
            container.innerHTML = paginatedOrders.map(order => {
                const client = this.clients.find(c => c.id === order.clientId);
                return `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${order.date}</td>
                        <td>${client ? client.name : 'Unknown Client'}</td>
                        <td>${order.items.length} items</td>
                        <td>$${parseFloat(order.total).toFixed(2)}</td>
                        <td><span class="badge bg-${this.getStatusBadgeColor(order.status)}">${order.status}</span></td>
                        <td><span class="badge bg-${this.getPaymentBadgeColor(order.paymentStatus)}">${order.paymentStatus}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="ordersManager.editOrder('${order.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm ms-1" onclick="ordersManager.deleteOrder('${order.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        this.renderPagination(ordersToShow.length);
    }

    renderPagination(totalItems) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / this.ordersPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <nav aria-label="Order navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="ordersManager.changePage(${this.currentPage - 1}); return false;">
                            Previous
                        </a>
                    </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="ordersManager.changePage(${i}); return false;">
                        ${i}
                    </a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="ordersManager.changePage(${this.currentPage + 1}); return false;">
                            Next
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    populateClientSelect() {
        const select = document.getElementById('orderClient');
        if (select && this.clients.length) {
            select.innerHTML = this.clients.map(client => 
                `<option value="${client.id}">${client.name}</option>`
            ).join('');
        }
    }

    populateProductSelects() {
        const productSelects = document.querySelectorAll('.product-select');
        const options = this.products.map(product => 
            `<option value="${product.id}" data-price="${product.price}">${product.name}</option>`
        ).join('');
        
        productSelects.forEach(select => {
            select.innerHTML = `<option value="">Select a product</option>${options}`;
        });
    }

    addProductRow() {
        const productsList = document.getElementById('productsList');
        if (!productsList) return;

        const row = document.createElement('div');
        row.className = 'row mb-2';
        row.innerHTML = `
            <div class="col-md-5">
                <select class="form-select product-select" required>
                    <option value="">Select a product</option>
                    ${this.products.map(product => 
                        `<option value="${product.id}" data-price="${product.price}">${product.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control product-quantity" placeholder="Quantity" min="1" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control product-price" placeholder="Price" readonly>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm remove-product">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        productsList.appendChild(row);
    }

    updateProductPrice(select) {
        const row = select.closest('.row');
        const priceInput = row.querySelector('.product-price');
        const option = select.selectedOptions[0];
        
        if (option && option.dataset.price) {
            priceInput.value = option.dataset.price;
        } else {
            priceInput.value = '';
        }

        this.updateOrderTotal();
    }

    updateOrderTotal() {
        let total = 0;
        const rows = document.querySelectorAll('#productsList .row');
        
        rows.forEach(row => {
            const price = parseFloat(row.querySelector('.product-price').value) || 0;
            const quantity = parseInt(row.querySelector('.product-quantity').value) || 0;
            total += price * quantity;
        });

        document.getElementById('orderTotal').textContent = total.toFixed(2);
    }

    getStatusBadgeColor(status) {
        switch (status.toLowerCase()) {
            case 'delivered': return 'success';
            case 'shipped': return 'info';
            case 'processing': return 'primary';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    }

    getPaymentBadgeColor(status) {
        switch (status.toLowerCase()) {
            case 'paid': return 'success';
            case 'unpaid': return 'danger';
            case 'refunded': return 'warning';
            default: return 'secondary';
        }
    }

    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.editingOrderId = orderId;
        document.getElementById('orderModalTitle').textContent = 'Edit Order';
        document.getElementById('orderClient').value = order.clientId;
        document.getElementById('orderDate').value = order.date;
        document.getElementById('orderStatus').value = order.status;
        document.getElementById('paymentStatus').value = order.paymentStatus;
        document.getElementById('orderNotes').value = order.notes || '';

        // Clear existing product rows
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '';

        // Add product rows for each item
        order.items.forEach(item => {
            this.addProductRow();
            const lastRow = productsList.lastElementChild;
            lastRow.querySelector('.product-select').value = item.productId;
            lastRow.querySelector('.product-quantity').value = item.quantity;
            lastRow.querySelector('.product-price').value = item.price;
        });

        this.updateOrderTotal();

        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
    }

    async saveOrder() {
        const form = document.getElementById('orderForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const items = [];
            const productRows = document.querySelectorAll('#productsList .row');
            
            productRows.forEach(row => {
                const productId = row.querySelector('.product-select').value;
                const quantity = parseInt(row.querySelector('.product-quantity').value);
                const price = parseFloat(row.querySelector('.product-price').value);

                if (productId && quantity && price) {
                    items.push({ productId, quantity, price });
                }
            });

            const orderData = {
                date: document.getElementById('orderDate').value,
                clientId: document.getElementById('orderClient').value,
                items: items,
                status: document.getElementById('orderStatus').value,
                paymentStatus: document.getElementById('paymentStatus').value,
                notes: document.getElementById('orderNotes').value,
                total: parseFloat(document.getElementById('orderTotal').textContent)
            };

            if (this.editingOrderId) {
                // Update existing order
                const index = this.orders.findIndex(o => o.id === this.editingOrderId);
                if (index !== -1) {
                    this.orders[index] = {
                        ...this.orders[index],
                        ...orderData
                    };
                    this.showSuccess('Order updated successfully');
                }
            } else {
                // Add new order
                const newOrder = {
                    ...orderData,
                    id: Date.now().toString()
                };
                this.orders.unshift(newOrder);
                this.showSuccess('Order added successfully');
            }

            // Save to localStorage
            localStorage.setItem('orders', JSON.stringify(this.orders));

            // Close modal and refresh display
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            modal.hide();
            
            this.renderOrders();

        } catch (error) {
            console.error('Error saving order:', error);
            this.showError('Error saving order');
        }
    }

    deleteOrder(orderId) {
        if (!confirm('Are you sure you want to delete this order?')) return;

        const index = this.orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            this.orders.splice(index, 1);
            localStorage.setItem('orders', JSON.stringify(this.orders));
            this.showSuccess('Order deleted successfully');
            this.renderOrders();
        }
    }

    resetData() {
        if (!confirm('Are you sure you want to reset all order data? This cannot be undone.')) return;
        
        localStorage.removeItem('orders');
        this.init();
        this.showSuccess('Order data has been reset');
    }

    changePage(page) {
        const totalPages = Math.ceil(this.orders.length / this.ordersPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderOrders();
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

// Initialize orders manager
document.addEventListener('DOMContentLoaded', () => {
    window.ordersManager = new OrdersManager();
}); 