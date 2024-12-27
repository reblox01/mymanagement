class MockDataGenerator {
    constructor() {
        // Check if faker is available
        if (typeof faker === 'undefined') {
            console.error('Faker.js is not loaded');
            return;
        }
    }

    generateProducts(count = 100) {
        return Array.from({ length: count }, (_, index) => ({
            id: index + 1,
            name: faker.commerce.productName(),
            description: faker.lorem.sentence(),
            price: parseFloat(faker.commerce.price()),
            category: faker.commerce.department(),
            stock: faker.random.number({ min: 0, max: 1000 }),
            image: `https://picsum.photos/seed/${index + 1}/400/300`,
            createdAt: faker.date.past()
        }));
    }

    generateUsers(count = 50) {
        return Array.from({ length: count }, () => ({
            id: faker.random.uuid(),
            name: faker.name.findName(),
            email: faker.internet.email(),
            role: faker.random.arrayElement(['admin', 'user', 'manager']),
            status: faker.random.arrayElement(['active', 'inactive']),
            avatar: faker.internet.avatar(),
            createdAt: faker.date.past()
        }));
    }

    generateOrders(count = 200) {
        return Array.from({ length: count }, () => ({
            id: faker.random.uuid(),
            customerName: faker.name.findName(),
            products: Array.from(
                { length: faker.random.number({ min: 1, max: 5 }) },
                () => ({
                    name: faker.commerce.productName(),
                    price: parseFloat(faker.commerce.price()),
                    quantity: faker.random.number({ min: 1, max: 10 })
                })
            ),
            total: faker.commerce.price(),
            status: faker.random.arrayElement(['pending', 'processing', 'completed', 'cancelled']),
            createdAt: faker.date.recent()
        }));
    }

    generateInvoices(count = 150) {
        return Array.from({ length: count }, () => ({
            id: faker.random.uuid(),
            customerName: faker.name.findName(),
            amount: parseFloat(faker.commerce.price()),
            status: faker.random.arrayElement(['paid', 'pending', 'overdue']),
            dueDate: faker.date.future(),
            createdAt: faker.date.recent()
        }));
    }

    generateAllData() {
        return {
            products: this.generateProducts(),
            users: this.generateUsers(),
            orders: this.generateOrders(),
            invoices: this.generateInvoices()
        };
    }
}

// Initialize mock data generator
const mockGenerator = new MockDataGenerator(); 