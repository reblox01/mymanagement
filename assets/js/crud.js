// Utility functions
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual API URL

class CRUDManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentEntity = this.detectCurrentEntity();
        this.initializeEventListeners();
    }

    detectCurrentEntity() {
        const path = window.location.pathname;
        if (path.includes('users')) return 'users';
        if (path.includes('products')) return 'products';
        if (path.includes('orders')) return 'orders';
        if (path.includes('clients')) return 'clients';
        if (path.includes('invoices')) return 'invoices';
        return null;
    }

    initializeEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Filter functionality
        const filterSelects = document.querySelectorAll('select[id*="Filter"]');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => this.applyFilters());
        });

        // Add/Edit modal form submission
        const addForm = document.querySelector(`#add${this.capitalizeFirst(this.currentEntity)}Form`);
        if (addForm) {
            addForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Export buttons
        const exportBtn = document.querySelector('.btn-success');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    async fetchData(filters = {}) {
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...filters
            });

            const response = await fetch(`${API_BASE_URL}/${this.currentEntity}?${queryParams}`);
            const data = await response.json();
            this.renderTable(data);
            this.updatePagination(data.total);
        } catch (error) {
            console.error('Error fetching data:', error);
            this.showNotification('Error loading data', 'error');
        }
    }

    renderTable(data) {
        const tbody = document.querySelector(`#${this.currentEntity}TableBody`);
        if (!tbody || !data.items) return;

        tbody.innerHTML = '';
        data.items.forEach(item => {
            const row = this.createTableRow(item);
            tbody.appendChild(row);
        });
    }

    createTableRow(item) {
        const row = document.createElement('tr');
        
        // Create cells based on entity type
        switch(this.currentEntity) {
            case 'products':
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td><img src="${item.image}" alt="${item.name}" width="50"></td>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>$${item.price}</td>
                    <td>${item.stock}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="crudManager.editItem(${item.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="crudManager.deleteItem(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                break;
            // Add cases for other entities...
        }

        return row;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/${this.currentEntity}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showNotification('Item created successfully', 'success');
                this.fetchData();
                // Close modal
                bootstrap.Modal.getInstance(document.querySelector('.modal')).hide();
            }
        } catch (error) {
            console.error('Error creating item:', error);
            this.showNotification('Error creating item', 'error');
        }
    }

    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${this.currentEntity}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Item deleted successfully', 'success');
                this.fetchData();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showNotification('Error deleting item', 'error');
        }
    }

    async exportData() {
        try {
            const response = await fetch(`${API_BASE_URL}/${this.currentEntity}/export`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentEntity}_export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Error exporting data', 'error');
        }
    }

    showNotification(message, type) {
        // Implementation depends on your preferred notification system
        alert(message);
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize CRUD manager
const crudManager = new CRUDManager();
document.addEventListener('DOMContentLoaded', () => crudManager.fetchData()); 