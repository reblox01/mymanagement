// Check if user is already logged in
function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated && window.location.href.includes('login.html')) {
        window.location.href = 'dashboard.html';
    } else if (!isAuthenticated && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Check static credentials
            if (username === 'admin' && password === 'admin') {
                localStorage.setItem('isAuthenticated', 'true');
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid credentials. Please try again.');
                loginForm.reset();
            }
        });
    }
});

// Language handling
const currentLang = localStorage.getItem('language') || 'en';
document.documentElement.lang = currentLang; 