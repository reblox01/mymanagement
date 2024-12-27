class InvoicesManager {
    constructor() {
        this.invoices = [];
        this.filteredInvoices = [];
        this.clients = [];
        this.orders = [];
        this.currentPage = 1;
        this.invoicesPerPage = 8;
        this.editingInvoiceId = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderInvoices();
            this.populateClientSelect();
            this.populateOrderSelect();
        } catch (error) {
            console.error('Error initializing invoices manager:', error);
            this.showError('Error loading invoices data');
        }
    }

    async loadData() {
        try {
            // Load clients from API
            const clientsResponse = await api.get('/clients');
            this.clients = clientsResponse.data || [];

            // Load orders from API
            const ordersResponse = await api.get('/orders');
            this.orders = ordersResponse.data || [];

            // Load invoices
            const invoicesResponse = await api.get('/invoices');
            if (invoicesResponse.data) {
                this.invoices = invoicesResponse.data;
            } else {
                // Create sample invoices if API returns no data
                this.invoices = Array.from({ length: 15 }, (_, i) => ({
                    id: (i + 1).toString(),
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    clientId: this.clients[Math.floor(Math.random() * this.clients.length)]?.id || '1',
                    orderId: this.orders[Math.floor(Math.random() * this.orders.length)]?.id || null,
                    items: [
                        {
                            description: 'Sample Item',
                            quantity: Math.floor(Math.random() * 5) + 1,
                            price: (Math.random() * 100 + 20).toFixed(2)
                        }
                    ],
                    status: ['paid', 'unpaid', 'overdue'][Math.floor(Math.random() * 3)],
                    notes: '',
                    total: (Math.random() * 500 + 100).toFixed(2)
                }));

                // Save sample data to API
                await api.post('/invoices', this.invoices);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to localStorage if API fails
            const savedClients = localStorage.getItem('clients');
            this.clients = savedClients ? JSON.parse(savedClients) : [];

            const savedOrders = localStorage.getItem('orders');
            this.orders = savedOrders ? JSON.parse(savedOrders) : [];

            const savedInvoices = localStorage.getItem('invoices');
            this.invoices = savedInvoices ? JSON.parse(savedInvoices) : [];
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

        // Date filter
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.applyFilters());
        }

        // Client filter
        const clientFilter = document.getElementById('clientFilter');
        if (clientFilter) {
            clientFilter.addEventListener('change', () => this.applyFilters());
        }

        // Add item button
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addItemRow());
        }

        // Save invoice button
        const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
        if (saveInvoiceBtn) {
            saveInvoiceBtn.addEventListener('click', () => this.saveInvoice());
        }

        // Items list events delegation
        const itemsList = document.getElementById('itemsList');
        if (itemsList) {
            itemsList.addEventListener('input', (e) => {
                if (e.target.classList.contains('item-quantity') || 
                    e.target.classList.contains('item-price')) {
                    this.updateItemTotal(e.target.closest('.row'));
                }
            });

            itemsList.addEventListener('click', (e) => {
                if (e.target.closest('.remove-item')) {
                    e.target.closest('.row').remove();
                    this.updateInvoiceTotal();
                }
            });
        }

        // Order select change
        const invoiceOrder = document.getElementById('invoiceOrder');
        if (invoiceOrder) {
            invoiceOrder.addEventListener('change', () => this.populateFromOrder());
        }

        // Add client select change event
        const clientSelect = document.getElementById('invoiceClient');
        if (clientSelect) {
            clientSelect.addEventListener('change', () => {
                this.populateOrderSelect();  // Refresh orders when client changes
            });
        }

        // Add order select change event
        const orderSelect = document.getElementById('invoiceOrder');
        if (orderSelect) {
            orderSelect.addEventListener('change', () => {
                if (orderSelect.value) {
                    this.populateFromOrder(orderSelect.value);
                }
            });
        }
    }

    populateClientSelect() {
        const clientSelect = document.getElementById('invoiceClient');
        const clientFilter = document.getElementById('clientFilter');
        
        // Create client options HTML
        const clientOptions = this.clients.length > 0 
            ? this.clients.map(client => 
                `<option value="${client.id}">${client.name || 'Unnamed Client'}</option>`
            ).join('')
            : '<option value="">No clients available</option>';

        // Update the create/edit form client select
        if (clientSelect) {
            clientSelect.innerHTML = `
                <option value="">Select Client</option>
                ${clientOptions}
            `;
            // Remove the "Please select an item in the list" message
            clientSelect.setAttribute('placeholder', 'Select Client');
        }

        // Update the filter client select
        if (clientFilter) {
            clientFilter.innerHTML = `
                <option value="">All Clients</option>
                ${clientOptions}
            `;
        }
    }

    populateOrderSelect() {
        const orderSelect = document.getElementById('invoiceOrder');
        if (!orderSelect) return;

        const selectedClientId = document.getElementById('invoiceClient').value;
        
        if (!selectedClientId) {
            orderSelect.innerHTML = '<option value="">Select Client First</option>';
            return;
        }
        
        // Filter orders by selected client and not already invoiced
        const clientOrders = this.orders.filter(order => 
            order.clientId === selectedClientId && 
            !this.invoices.some(inv => inv.orderId === order.id)
        );

        if (clientOrders.length === 0) {
            orderSelect.innerHTML = '<option value="">No orders available</option>';
            return;
        }

        orderSelect.innerHTML = `
            <option value="">Select Order (Optional)</option>
            ${clientOrders.map(order => 
                `<option value="${order.id}">Order #${order.id} - $${parseFloat(order.total).toFixed(2)}</option>`
            ).join('')}
        `;
    }

    populateFromOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Clear existing items
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = '';

        // Add items from order
        order.items.forEach(item => {
            this.addItemRow();
            const lastRow = itemsList.lastElementChild;
            const product = this.products?.find(p => p.id === item.productId);
            lastRow.querySelector('.item-description').value = product?.name || 'Product';
            lastRow.querySelector('.item-quantity').value = item.quantity;
            lastRow.querySelector('.item-price').value = item.price;
            this.updateItemTotal(lastRow);
        });

        this.updateInvoiceTotal();
    }

    addItemRow() {
        const itemsList = document.getElementById('itemsList');
        const newRow = document.createElement('div');
        newRow.className = 'row mb-2';
        newRow.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control item-description" placeholder="Description" required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-quantity" placeholder="Qty" min="1" required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-price" placeholder="Price" step="0.01" required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-total" placeholder="Total" readonly>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm remove-item">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        itemsList.appendChild(newRow);
    }

    updateItemTotal(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        row.querySelector('.item-total').value = total.toFixed(2);
        this.updateInvoiceTotal();
    }

    updateInvoiceTotal() {
        const totals = Array.from(document.getElementsByClassName('item-total'))
            .map(input => parseFloat(input.value) || 0);
        const total = totals.reduce((sum, value) => sum + value, 0);
        document.getElementById('invoiceTotal').textContent = total.toFixed(2);
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusValue = document.getElementById('statusFilter').value;
        const dateValue = document.getElementById('dateFilter').value;
        const clientValue = document.getElementById('clientFilter').value;

        this.filteredInvoices = this.invoices.filter(invoice => {
            const client = this.clients.find(c => c.id === invoice.clientId);
            
            // Search in invoice ID, client name, and items descriptions
            const matchesSearch = 
                invoice.id.toString().toLowerCase().includes(searchTerm) ||
                (client && client.name.toLowerCase().includes(searchTerm)) ||
                invoice.items.some(item => 
                    item.description.toLowerCase().includes(searchTerm)
                );
            
            // Filter by status, date and client
            const matchesStatus = !statusValue || invoice.status === statusValue;
            const matchesDate = !dateValue || invoice.date === dateValue;
            const matchesClient = !clientValue || invoice.clientId === clientValue;

            return matchesSearch && matchesStatus && matchesDate && matchesClient;
        });

        this.currentPage = 1;
        this.renderInvoices();
    }

    renderInvoices() {
        const container = document.getElementById('invoicesTable');
        if (!container) return;

        const invoicesToShow = this.filteredInvoices.length > 0 ? this.filteredInvoices : this.invoices;
        const startIndex = (this.currentPage - 1) * this.invoicesPerPage;
        const endIndex = startIndex + this.invoicesPerPage;
        const paginatedInvoices = invoicesToShow.slice(startIndex, endIndex);

        if (paginatedInvoices.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No invoices found matching your criteria.</td>
                </tr>
            `;
        } else {
            container.innerHTML = paginatedInvoices.map(invoice => {
                const client = this.clients.find(c => c.id === invoice.clientId);
                return `
                    <tr>
                        <td>#${invoice.id}</td>
                        <td>${invoice.date}</td>
                        <td>${invoice.dueDate}</td>
                        <td>${client ? client.name : 'Unknown Client'}</td>
                        <td>$${parseFloat(invoice.total).toFixed(2)}</td>
                        <td><span class="badge bg-${this.getStatusBadgeColor(invoice.status)}">${invoice.status}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="invoicesManager.editInvoice('${invoice.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm ms-1" onclick="invoicesManager.deleteInvoice('${invoice.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                            <button class="btn btn-info btn-sm ms-1" onclick="invoicesManager.printInvoice('${invoice.id}')">
                                <i class="bi bi-printer"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        this.renderPagination(invoicesToShow.length);
    }

    renderPagination(totalItems) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.invoicesPerPage);
        
        let paginationHTML = `
            <nav>
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="invoicesManager.changePage(${this.currentPage - 1}); return false;">
                            Previous
                        </a>
                    </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="invoicesManager.changePage(${i}); return false;">
                        ${i}
                    </a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="invoicesManager.changePage(${this.currentPage + 1}); return false;">
                            Next
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        container.innerHTML = paginationHTML;
    }

    getStatusBadgeColor(status) {
        switch (status.toLowerCase()) {
            case 'paid': return 'success';
            case 'unpaid': return 'warning';
            case 'overdue': return 'danger';
            case 'cancelled': return 'secondary';
            default: return 'primary';
        }
    }

    editInvoice(invoiceId) {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (!invoice) return;

        this.editingInvoiceId = invoiceId;
        document.getElementById('invoiceModalTitle').textContent = 'Edit Invoice';
        document.getElementById('invoiceClient').value = invoice.clientId;
        document.getElementById('invoiceOrder').value = invoice.orderId || '';
        document.getElementById('invoiceDate').value = invoice.date;
        document.getElementById('invoiceDueDate').value = invoice.dueDate;
        document.getElementById('invoiceStatus').value = invoice.status;
        document.getElementById('invoiceNotes').value = invoice.notes || '';

        // Clear existing item rows
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = '';

        // Add item rows for each item
        invoice.items.forEach(item => {
            this.addItemRow();
            const lastRow = itemsList.lastElementChild;
            lastRow.querySelector('.item-description').value = item.description;
            lastRow.querySelector('.item-quantity').value = item.quantity;
            lastRow.querySelector('.item-price').value = item.price;
            this.updateItemTotal(lastRow);
        });

        const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
        modal.show();
    }

    async saveInvoice() {
        const form = document.getElementById('invoiceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const items = [];
            const itemRows = document.querySelectorAll('#itemsList .row');
            
            itemRows.forEach(row => {
                const description = row.querySelector('.item-description').value;
                const quantity = parseInt(row.querySelector('.item-quantity').value);
                const price = parseFloat(row.querySelector('.item-price').value);

                if (description && quantity && price) {
                    items.push({ description, quantity, price });
                }
            });

            const invoiceData = {
                date: document.getElementById('invoiceDate').value,
                dueDate: document.getElementById('invoiceDueDate').value,
                clientId: document.getElementById('invoiceClient').value,
                orderId: document.getElementById('invoiceOrder').value || null,
                items: items,
                status: document.getElementById('invoiceStatus').value,
                notes: document.getElementById('invoiceNotes').value,
                total: parseFloat(document.getElementById('invoiceTotal').textContent)
            };

            if (this.editingInvoiceId) {
                // Update existing invoice
                await api.put(`/invoices/${this.editingInvoiceId}`, invoiceData);
                const index = this.invoices.findIndex(i => i.id === this.editingInvoiceId);
                if (index !== -1) {
                    this.invoices[index] = {
                        ...this.invoices[index],
                        ...invoiceData
                    };
                }
                this.showSuccess('Invoice updated successfully');
            } else {
                // Add new invoice
                const response = await api.post('/invoices', {
                    ...invoiceData,
                    id: Date.now().toString()
                });
                this.invoices.unshift(response.data);
                this.showSuccess('Invoice added successfully');
            }

            // Close modal and refresh display
            const modal = bootstrap.Modal.getInstance(document.getElementById('invoiceModal'));
            modal.hide();
            
            this.renderInvoices();

        } catch (error) {
            console.error('Error saving invoice:', error);
            this.showError('Error saving invoice. Falling back to localStorage.');
            
            // Fallback to localStorage
            if (this.editingInvoiceId) {
                const index = this.invoices.findIndex(i => i.id === this.editingInvoiceId);
                if (index !== -1) {
                    this.invoices[index] = {
                        ...this.invoices[index],
                        ...invoiceData
                    };
                }
            } else {
                const newInvoice = {
                    ...invoiceData,
                    id: Date.now().toString()
                };
                this.invoices.unshift(newInvoice);
            }
            localStorage.setItem('invoices', JSON.stringify(this.invoices));
        }
    }

    async deleteInvoice(invoiceId) {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        try {
            await api.delete(`/invoices/${invoiceId}`);
            const index = this.invoices.findIndex(i => i.id === invoiceId);
            if (index !== -1) {
                this.invoices.splice(index, 1);
                this.showSuccess('Invoice deleted successfully');
                this.renderInvoices();
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            this.showError('Error deleting invoice. Falling back to localStorage.');
            
            // Fallback to localStorage
            const index = this.invoices.findIndex(i => i.id === invoiceId);
            if (index !== -1) {
                this.invoices.splice(index, 1);
                localStorage.setItem('invoices', JSON.stringify(this.invoices));
                this.renderInvoices();
            }
        }
    }

    printInvoice(invoiceId) {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (!invoice) return;

        const client = this.clients.find(c => c.id === invoice.clientId);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice #${invoice.id}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { padding: 20px; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="row mb-4">
                            <div class="col">
                                <h1>INVOICE</h1>
                                <h4>#${invoice.id}</h4>
                            </div>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-6">
                                <h5>Bill To:</h5>
                                <p>
                                    ${client ? client.name : 'Unknown Client'}<br>
                                    ${client ? client.address : ''}<br>
                                    ${client ? client.email : ''}
                                </p>
                            </div>
                            <div class="col-6 text-end">
                                <p>
                                    <strong>Issue Date:</strong> ${invoice.date}<br>
                                    <strong>Due Date:</strong> ${invoice.dueDate}<br>
                                    <strong>Status:</strong> ${invoice.status}
                                </p>
                            </div>
                        </div>

                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th class="text-end">Quantity</th>
                                    <th class="text-end">Price</th>
                                    <th class="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td class="text-end">${item.quantity}</td>
                                        <td class="text-end">$${parseFloat(item.price).toFixed(2)}</td>
                                        <td class="text-end">$${(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colspan="3" class="text-end">Total:</th>
                                    <th class="text-end">$${parseFloat(invoice.total).toFixed(2)}</th>
                                </tr>
                            </tfoot>
                        </table>

                        ${invoice.notes ? `
                            <div class="row mt-4">
                                <div class="col">
                                    <h5>Notes:</h5>
                                    <p>${invoice.notes}</p>
                                </div>
                            </div>
                        ` : ''}

                        <div class="row mt-4 no-print">
                            <div class="col text-center">
                                <button class="btn btn-primary" onclick="window.print()">Print Invoice</button>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    resetData() {
        if (!confirm('Are you sure you want to reset all invoice data? This cannot be undone.')) return;
        
        localStorage.removeItem('invoices');
        this.init();
        this.showSuccess('Invoice data has been reset');
    }

    changePage(page) {
        const totalPages = Math.ceil(this.invoices.length / this.invoicesPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderInvoices();
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

// Initialize invoices manager
document.addEventListener('DOMContentLoaded', () => {
    window.invoicesManager = new InvoicesManager();
}); 