# MyManager - Backoffice Application

A comprehensive back-office web application for managing users, products, orders, clients, and invoices.

## Features

- CRUD operations for multiple entities
- Responsive dashboard with real-time charts
- Internationalization support (English, French, Arabic)
- Authentication system
- Data export functionality
- Responsive design

## Project Structure 

```
MyManager/
├── assets/
│ ├── css/
│ │ └── styles.css
│ ├── js/
│ │ ├── main.js
│ │ ├── dashboard.js
│ │ ├── crud.js
│ │ └── api.js
│ ├── img/
│ │ └── logo.png
├── data/
│ └── mock-data.json
├── pages/
│ ├── login.html
│ ├── dashboard.html
│ ├── users.html
│ ├── products.html
│ ├── orders.html
│ ├── clients.html
│ └── invoices.html
├── index.html
└── README.md
```

## Setup

1. Clone the repository
2. Configure the API endpoint in `assets/js/api.js`
3. Open `index.html` in a web browser

## Usage

1. Login using credentials:
   - Username: admin
   - Password: admin

2. Navigate through different sections using the sidebar
3. Perform CRUD operations on entities
4. View dashboard statistics and charts
5. Export data in CSV format

## Development

- Built with vanilla JavaScript
- Uses Chart.js for data visualization
- Bootstrap for responsive design
- Mock API with JSON data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
