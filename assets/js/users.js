class UsersManager {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.usersPerPage = 8;
        this.editingUserId = null;
        this.init();
    }

    async init() {
        try {
            await this.loadUsers();
            this.setupEventListeners();
            this.renderUsers();
        } catch (error) {
            console.error('Error initializing users manager:', error);
            this.showError('Error loading users data');
        }
    }

    async loadUsers() {
        try {
            // First check localStorage for existing data
            const savedUsers = localStorage.getItem('users');
            
            if (savedUsers) {
                console.log('Found users in localStorage');
                this.users = JSON.parse(savedUsers);
            } else {
                console.log('No users in localStorage, fetching from API...');
                // Fetch from API if no saved data
                const response = await fetch('https://jsonplaceholder.typicode.com/users');
                const users = await response.json();
                
                this.users = users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    phone: user.phone,
                    website: user.website,
                    company: user.company.name,
                    role: user.id === 1 ? 'admin' : 'user',
                    status: 'active',
                    avatar: `https://i.pravatar.cc/150?img=${user.id}`,
                    address: `${user.address.street}, ${user.address.city}`
                }));

                // Save to localStorage
                localStorage.setItem('users', JSON.stringify(this.users));
            }

            console.log('Loaded users:', this.users.length);
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    renderUsers() {
        const container = document.getElementById('usersTable');
        if (!container) return;

        const usersToShow = this.filteredUsers.length > 0 ? this.filteredUsers : this.users;
        const startIndex = (this.currentPage - 1) * this.usersPerPage;
        const endIndex = startIndex + this.usersPerPage;
        const paginatedUsers = usersToShow.slice(startIndex, endIndex);

        if (paginatedUsers.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No users found matching your criteria.</td>
                </tr>
            `;
        } else {
            container.innerHTML = paginatedUsers.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${user.avatar}" class="rounded-circle me-2" width="40" height="40">
                            <div>
                                <div class="fw-bold">${user.name}</div>
                                <div class="text-muted small">${user.username}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div>${user.email}</div>
                        <div class="text-muted small">${user.phone}</div>
                    </td>
                    <td>${user.company}</td>
                    <td>${user.address}</td>
                    <td><span class="badge bg-primary">${user.role}</span></td>
                    <td><span class="badge bg-${this.getStatusBadgeColor(user.status)}">${user.status}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="usersManager.editUser('${user.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm ms-1" onclick="usersManager.deleteUser('${user.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        this.renderPagination(usersToShow.length);
    }

    getStatusBadgeColor(status) {
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            case 'suspended': return 'danger';
            default: return 'secondary';
        }
    }

    renderPagination(totalItems) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / this.usersPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <nav aria-label="User navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="usersManager.changePage(${this.currentPage - 1}); return false;">
                            Previous
                        </a>
                    </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="usersManager.changePage(${i}); return false;">
                        ${i}
                    </a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="usersManager.changePage(${this.currentPage + 1}); return false;">
                            Next
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.users.length / this.usersPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderUsers();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filteredUsers = this.users.filter(user => 
                    user.name.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm) ||
                    user.role.toLowerCase().includes(searchTerm)
                );
                this.currentPage = 1; // Reset to first page
                this.renderUsers();
            });
        }

        // Role filter
        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', () => this.applyFilters());
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // Add user button
        const addUserBtn = document.querySelector('[data-bs-target="#userModal"]');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.editingUserId = null;
                document.getElementById('userModalTitle').textContent = 'Add User';
                document.getElementById('userForm').reset();
            });
        }

        // Save user button
        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', () => this.saveUser());
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const roleValue = document.getElementById('roleFilter').value;
        const statusValue = document.getElementById('statusFilter').value;

        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                                user.email.toLowerCase().includes(searchTerm) ||
                                user.role.toLowerCase().includes(searchTerm);
            
            const matchesRole = !roleValue || user.role === roleValue;
            const matchesStatus = !statusValue || user.status === statusValue;

            return matchesSearch && matchesRole && matchesStatus;
        });

        this.currentPage = 1; // Reset to first page
        this.renderUsers();
    }

    async saveUser() {
        try {
            const userData = {
                name: document.getElementById('userName').value,
                username: document.getElementById('userUsername').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                website: document.getElementById('userWebsite').value,
                company: document.getElementById('userCompany').value,
                address: document.getElementById('userAddress').value,
                role: document.getElementById('userRole').value,
                status: document.getElementById('userStatus').value
            };

            if (this.editingUserId) {
                // Update existing user
                const index = this.users.findIndex(u => u.id === this.editingUserId);
                if (index !== -1) {
                    this.users[index] = {
                        ...this.users[index],
                        ...userData
                    };
                    this.showSuccess('User updated successfully');
                }
            } else {
                // Add new user
                const newUser = {
                    ...userData,
                    id: this.users.length + 1,
                    avatar: `https://i.pravatar.cc/150?img=${this.users.length + 1}`,
                };
                this.users.unshift(newUser);
                this.showSuccess('User added successfully');
            }

            // Save changes to localStorage
            this.saveToLocalStorage();

            // Close modal and refresh display
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            this.renderUsers();
            this.renderPagination();

        } catch (error) {
            console.error('Error saving user:', error);
            this.showError('Error saving user');
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id.toString() === userId.toString());
        if (!user) return;

        this.editingUserId = user.id;
        
        // Populate form
        document.getElementById('userName').value = user.name;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone;
        document.getElementById('userWebsite').value = user.website;
        document.getElementById('userCompany').value = user.company;
        document.getElementById('userAddress').value = user.address;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userStatus').value = user.status;

        // Update modal title
        document.getElementById('userModalTitle').textContent = 'Edit User';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            // Remove user from local array
            this.users = this.users.filter(user => user.id.toString() !== userId.toString());
            
            // Save changes to localStorage
            this.saveToLocalStorage();
            
            this.showSuccess('User deleted successfully');
            
            // Recalculate pagination if necessary
            const totalPages = Math.ceil(this.users.length / this.usersPerPage);
            if (this.currentPage > totalPages) {
                this.currentPage = totalPages || 1;
            }
            
            this.renderUsers();
            this.renderPagination();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('Error deleting user');
        }
    }

    // Add a reset data method
    resetData() {
        if (confirm('Are you sure you want to reset all data? This will remove all changes.')) {
            localStorage.removeItem('users');
            location.reload();
        }
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

// Initialize users manager
document.addEventListener('DOMContentLoaded', () => {
    window.usersManager = new UsersManager();
}); 