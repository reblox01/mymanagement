class ClientsManager {
    constructor() {
        this.clients = [];
        this.filteredClients = [];
        this.currentPage = 1;
        this.clientsPerPage = 10;
        this.editingClientId = null;
        this.init();
    }

    async init() {
        try {
            await this.loadClients();
            this.setupEventListeners();
            this.renderClients();
        } catch (error) {
            console.error('Error initializing clients manager:', error);
            this.showError('Error loading clients data');
        }
    }

    async loadClients() {
        try {
            const savedClients = localStorage.getItem('clients');
            
            if (savedClients) {
                console.log('Found clients in localStorage');
                this.clients = JSON.parse(savedClients);
            } else {
                console.log('No clients in localStorage, creating sample data...');
                // Create sample clients
                this.clients = Array.from({ length: 15 }, (_, i) => ({
                    id: (i + 1).toString(),
                    name: `Client ${i + 1}`,
                    email: `client${i + 1}@example.com`,
                    phone: `+1 555-${String(i + 1).padStart(4, '0')}`,
                    type: i % 2 === 0 ? 'individual' : 'company',
                    address: `${i + 1} Business Street, City`,
                    status: 'active',
                    totalOrders: Math.floor(Math.random() * 50)
                }));

                localStorage.setItem('clients', JSON.stringify(this.clients));
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filteredClients = this.clients.filter(client => 
                    client.name.toLowerCase().includes(searchTerm) ||
                    client.email.toLowerCase().includes(searchTerm)
                );
                this.currentPage = 1;
                this.renderClients();
            });
        }

        // Type filter
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // Save client button
        const saveClientBtn = document.getElementById('saveClientBtn');
        if (saveClientBtn) {
            saveClientBtn.addEventListener('click', () => this.saveClient());
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeValue = document.getElementById('typeFilter').value;
        const statusValue = document.getElementById('statusFilter').value;

        this.filteredClients = this.clients.filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchTerm) ||
                                client.email.toLowerCase().includes(searchTerm);
            
            const matchesType = !typeValue || client.type === typeValue;
            const matchesStatus = !statusValue || client.status === statusValue;

            return matchesSearch && matchesType && matchesStatus;
        });

        this.currentPage = 1;
        this.renderClients();
    }

    renderClients() {
        const container = document.getElementById('clientsTable');
        if (!container) return;

        const clientsToShow = this.filteredClients.length > 0 ? this.filteredClients : this.clients;
        const startIndex = (this.currentPage - 1) * this.clientsPerPage;
        const endIndex = startIndex + this.clientsPerPage;
        const paginatedClients = clientsToShow.slice(startIndex, endIndex);

        if (paginatedClients.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No clients found matching your criteria.</td>
                </tr>
            `;
        } else {
            container.innerHTML = paginatedClients.map(client => `
                <tr>
                    <td>${client.id}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div>
                                <div class="fw-bold">${client.name}</div>
                                <div class="text-muted small">${client.address}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div>${client.email}</div>
                        <div class="text-muted small">${client.phone}</div>
                    </td>
                    <td><span class="badge bg-info">${client.type}</span></td>
                    <td>${client.totalOrders}</td>
                    <td><span class="badge bg-${this.getStatusBadgeColor(client.status)}">${client.status}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="clientsManager.editClient('${client.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm ms-1" onclick="clientsManager.deleteClient('${client.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        this.renderPagination(clientsToShow.length);
    }

    renderPagination(totalItems) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / this.clientsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <nav aria-label="Client navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="clientsManager.changePage(${this.currentPage - 1}); return false;">
                            Previous
                        </a>
                    </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="clientsManager.changePage(${i}); return false;">
                        ${i}
                    </a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="clientsManager.changePage(${this.currentPage + 1}); return false;">
                            Next
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.clients.length / this.clientsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderClients();
    }

    getStatusBadgeColor(status) {
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            default: return 'secondary';
        }
    }

    editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        this.editingClientId = clientId;
        document.getElementById('clientModalTitle').textContent = 'Edit Client';
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientEmail').value = client.email;
        document.getElementById('clientPhone').value = client.phone;
        document.getElementById('clientType').value = client.type;
        document.getElementById('clientAddress').value = client.address;
        document.getElementById('clientStatus').value = client.status;

        const modal = new bootstrap.Modal(document.getElementById('clientModal'));
        modal.show();
    }

    async saveClient() {
        const form = document.getElementById('clientForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const clientData = {
                name: document.getElementById('clientName').value,
                email: document.getElementById('clientEmail').value,
                phone: document.getElementById('clientPhone').value,
                type: document.getElementById('clientType').value,
                address: document.getElementById('clientAddress').value,
                status: document.getElementById('clientStatus').value,
                totalOrders: 0
            };

            if (this.editingClientId) {
                // Update existing client
                const index = this.clients.findIndex(c => c.id === this.editingClientId);
                if (index !== -1) {
                    this.clients[index] = {
                        ...this.clients[index],
                        ...clientData
                    };
                    this.showSuccess('Client updated successfully');
                }
            } else {
                // Add new client
                const newClient = {
                    ...clientData,
                    id: Date.now().toString(),
                    totalOrders: 0
                };
                this.clients.unshift(newClient);
                this.showSuccess('Client added successfully');
            }

            // Save to localStorage
            localStorage.setItem('clients', JSON.stringify(this.clients));

            // Close modal and refresh display
            const modal = bootstrap.Modal.getInstance(document.getElementById('clientModal'));
            modal.hide();
            
            this.renderClients();

        } catch (error) {
            console.error('Error saving client:', error);
            this.showError('Error saving client');
        }
    }

    deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client?')) return;

        const index = this.clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            this.clients.splice(index, 1);
            localStorage.setItem('clients', JSON.stringify(this.clients));
            this.showSuccess('Client deleted successfully');
            this.renderClients();
        }
    }

    resetData() {
        if (!confirm('Are you sure you want to reset all client data? This cannot be undone.')) return;
        
        localStorage.removeItem('clients');
        this.init();
        this.showSuccess('Client data has been reset');
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

// Initialize clients manager
document.addEventListener('DOMContentLoaded', () => {
    window.clientsManager = new ClientsManager();
}); 