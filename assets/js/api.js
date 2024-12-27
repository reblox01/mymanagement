class ApiService {
    constructor() {
        this.baseUrl = 'https://jsonplaceholder.typicode.com';
        this.mockData = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Initializing API service...');
            const response = await fetch(`${this.baseUrl}/posts`);
            const posts = await response.json();
            
            // Transform posts into products
            this.mockData = {
                products: posts.map(post => ({
                    id: post.id,
                    name: `Product ${post.id}`,
                    description: post.title,
                    price: 29.99 + (post.id % 50), // Create varying prices
                    category: ['Electronics', 'Clothing', 'Books', 'Home'][post.id % 4],
                    image: `https://picsum.photos/seed/${post.id}/400/300`,
                    stock: 10 + (post.id % 90)
                }))
            };

            this.isInitialized = true;
            console.log('API Service initialized with', this.mockData.products.length, 'products');
            return true;
        } catch (error) {
            console.error('Failed to initialize API service:', error);
            throw error;
        }
    }

    async request(endpoint) {
        if (!this.isInitialized) {
            await this.init();
        }

        const entity = endpoint.split('/')[1];
        return {
            items: this.mockData[entity] || [],
            total: this.mockData[entity]?.length || 0
        };
    }
}

// Initialize API service
const apiService = new ApiService(); 