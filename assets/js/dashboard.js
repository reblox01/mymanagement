class DashboardManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupCharts();
            this.updateAnalytics();
            this.updateRecentActivity();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    async loadData() {
        try {
            // Load data from API
            const [ordersRes, productsRes, clientsRes, invoicesRes] = await Promise.all([
                api.get('/orders'),
                api.get('/products'),
                api.get('/clients'),
                api.get('/invoices')
            ]);

            this.orders = ordersRes.data || [];
            this.products = productsRes.data || [];
            this.clients = clientsRes.data || [];
            this.invoices = invoicesRes.data || [];

            // If no data from API, try localStorage
            if (this.orders.length === 0) {
                const savedOrders = localStorage.getItem('orders');
                this.orders = savedOrders ? JSON.parse(savedOrders) : [];
            }
            
            if (this.products.length === 0) {
                const savedProducts = localStorage.getItem('products');
                this.products = savedProducts ? JSON.parse(savedProducts) : [];
            }
            
            if (this.clients.length === 0) {
                const savedClients = localStorage.getItem('clients');
                this.clients = savedClients ? JSON.parse(savedClients) : [];
            }
            
            if (this.invoices.length === 0) {
                const savedInvoices = localStorage.getItem('invoices');
                this.invoices = savedInvoices ? JSON.parse(savedInvoices) : [];
            }

            // Generate sample data if no data exists
            if (this.orders.length === 0) {
                this.orders = Array.from({ length: 15 }, (_, i) => ({
                    id: (i + 1).toString(),
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    clientId: (Math.floor(Math.random() * 5) + 1).toString(),
                    items: [
                        {
                            productId: (Math.floor(Math.random() * 5) + 1).toString(),
                            quantity: Math.floor(Math.random() * 5) + 1,
                            price: (Math.random() * 100 + 20).toFixed(2)
                        }
                    ],
                    status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
                    total: (Math.random() * 500 + 100).toFixed(2)
                }));
                localStorage.setItem('orders', JSON.stringify(this.orders));
            }

            if (this.products.length === 0) {
                this.products = Array.from({ length: 5 }, (_, i) => ({
                    id: (i + 1).toString(),
                    name: `Product ${i + 1}`,
                    price: (Math.random() * 100 + 20).toFixed(2)
                }));
                localStorage.setItem('products', JSON.stringify(this.products));
            }

            if (this.clients.length === 0) {
                this.clients = Array.from({ length: 5 }, (_, i) => ({
                    id: (i + 1).toString(),
                    name: `Client ${i + 1}`,
                    email: `client${i + 1}@example.com`
                }));
                localStorage.setItem('clients', JSON.stringify(this.clients));
            }

            if (this.invoices.length === 0) {
                this.invoices = Array.from({ length: 10 }, (_, i) => ({
                    id: (i + 1).toString(),
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    client: this.clients[Math.floor(Math.random() * this.clients.length)],
                    total: (Math.random() * 500 + 100).toFixed(2),
                    status: ['paid', 'unpaid', 'overdue'][Math.floor(Math.random() * 3)]
                }));
                localStorage.setItem('invoices', JSON.stringify(this.invoices));
            }

        } catch (error) {
            console.error('Error loading data:', error);
            // Load from localStorage as fallback
            const savedOrders = localStorage.getItem('orders');
            this.orders = savedOrders ? JSON.parse(savedOrders) : [];
            
            const savedProducts = localStorage.getItem('products');
            this.products = savedProducts ? JSON.parse(savedProducts) : [];
            
            const savedClients = localStorage.getItem('clients');
            this.clients = savedClients ? JSON.parse(savedClients) : [];
            
            const savedInvoices = localStorage.getItem('invoices');
            this.invoices = savedInvoices ? JSON.parse(savedInvoices) : [];
        }
    }

    updateAnalytics() {
        // Calculate total revenue
        const totalRevenue = this.orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;

        // Calculate revenue change
        const lastMonthRevenue = this.calculateLastMonthRevenue();
        const revenueChange = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100) || 0;
        document.getElementById('revenueChange').textContent = 
            `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% from last month`;

        // Update other analytics
        document.getElementById('totalOrders').textContent = this.orders.length;
        document.getElementById('totalClients').textContent = this.clients.length;
        document.getElementById('pendingInvoices').textContent = 
            this.invoices.filter(inv => inv.status === 'unpaid').length;
    }

    setupCharts() {
        // Revenue & Orders Trend Chart
        this.charts.revenue = new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: this.getRevenueChartData(),
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Order Status Chart
        this.charts.orderStatus = new Chart(document.getElementById('orderStatusChart'), {
            type: 'doughnut',
            data: this.getOrderStatusChartData(),
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Top Products Chart
        this.charts.topProducts = new Chart(document.getElementById('topProductsChart'), {
            type: 'bar',
            data: this.getTopProductsChartData(),
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Client Activity Chart
        this.charts.clientActivity = new Chart(document.getElementById('clientActivityChart'), {
            type: 'line',
            data: this.getClientActivityChartData(),
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    getRevenueChartData() {
        const last12Months = this.getLast12Months();
        const monthlyRevenue = this.calculateMonthlyRevenue(last12Months);
        const monthlyOrders = this.calculateMonthlyOrders(last12Months);

        return {
            labels: last12Months.map(date => date.toLocaleDateString('default', { month: 'short' })),
            datasets: [
                {
                    label: 'Revenue',
                    data: monthlyRevenue,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    label: 'Orders',
                    data: monthlyOrders,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                    yAxisID: 'y1'
                }
            ]
        };
    }

    getOrderStatusChartData() {
        const statusCounts = this.orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        return {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)',
                    'rgb(54, 162, 235)'
                ]
            }]
        };
    }

    getTopProductsChartData() {
        const productSales = this.calculateProductSales();
        const topProducts = Object.entries(productSales)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            labels: topProducts.map(([name]) => name),
            datasets: [{
                data: topProducts.map(([,value]) => value),
                backgroundColor: 'rgb(75, 192, 192)'
            }]
        };
    }

    getClientActivityChartData() {
        const last6Months = this.getLast6Months();
        const monthlyNewClients = this.calculateMonthlyNewClients(last6Months);
        const monthlyActiveClients = this.calculateMonthlyActiveClients(last6Months);

        return {
            labels: last6Months.map(date => date.toLocaleDateString('default', { month: 'short' })),
            datasets: [
                {
                    label: 'New Clients',
                    data: monthlyNewClients,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Active Clients',
                    data: monthlyActiveClients,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        };
    }

    updateRecentActivity() {
        const recentActivity = [
            ...this.orders.map(order => ({
                date: order.date,
                type: 'Order',
                description: `New order from ${this.getClientName(order.clientId)}`,
                status: order.status,
                amount: order.total
            })),
            ...this.invoices.map(invoice => ({
                date: invoice.date,
                type: 'Invoice',
                description: `Invoice for ${invoice.client.name}`,
                status: invoice.status,
                amount: invoice.total
            }))
        ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

        const tbody = document.getElementById('recentActivityTable');
        tbody.innerHTML = recentActivity.map(activity => `
            <tr>
                <td>${new Date(activity.date).toLocaleDateString()}</td>
                <td>${activity.type}</td>
                <td>${activity.description}</td>
                <td><span class="badge bg-${this.getStatusBadgeColor(activity.status)}">${activity.status}</span></td>
                <td>$${parseFloat(activity.amount).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    // Helper methods
    getLast12Months() {
        return Array.from({length: 12}, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date;
        }).reverse();
    }

    getLast6Months() {
        return Array.from({length: 6}, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date;
        }).reverse();
    }

    calculateLastMonthRevenue() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return this.orders
            .filter(order => new Date(order.date).getMonth() === lastMonth.getMonth())
            .reduce((sum, order) => sum + parseFloat(order.total), 0);
    }

    getClientName(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        return client ? client.name : 'Unknown Client';
    }

    getStatusBadgeColor(status) {
        const colors = {
            'pending': 'warning',
            'processing': 'info',
            'shipped': 'primary',
            'delivered': 'success',
            'paid': 'success',
            'unpaid': 'danger',
            'overdue': 'danger'
        };
        return colors[status.toLowerCase()] || 'secondary';
    }

    calculateMonthlyRevenue(months) {
        return months.map(date => {
            const monthRevenue = this.orders
                .filter(order => new Date(order.date).getMonth() === date.getMonth())
                .reduce((sum, order) => sum + parseFloat(order.total), 0);
            return monthRevenue;
        });
    }

    calculateMonthlyOrders(months) {
        return months.map(date => {
            return this.orders.filter(order => 
                new Date(order.date).getMonth() === date.getMonth()
            ).length;
        });
    }

    calculateProductSales() {
        const sales = {};
        this.orders.forEach(order => {
            order.items.forEach(item => {
                const product = this.products.find(p => p.id === item.productId);
                if (product) {
                    sales[product.name] = (sales[product.name] || 0) + (item.quantity * item.price);
                }
            });
        });
        return sales;
    }

    calculateMonthlyNewClients(months) {
        return months.map(date => {
            return this.clients.filter(client => 
                new Date(client.createdAt || client.date).getMonth() === date.getMonth()
            ).length;
        });
    }

    calculateMonthlyActiveClients(months) {
        return months.map(date => {
            const activeClients = new Set(
                this.orders
                    .filter(order => new Date(order.date).getMonth() === date.getMonth())
                    .map(order => order.clientId)
            );
            return activeClients.size;
        });
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});