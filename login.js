// This script handles the login functionality.

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    // Hardcoded credentials for simplicity
    if (email === 'marketing@southsea.com.br' && password === 'Southsea@!') {
        sessionStorage.setItem('isLoggedIn', 'true');
        errorEl.classList.add('hidden');
        window.location.href = 'index.html';
    } else {
        errorEl.textContent = 'Email ou senha inválidos.';
        errorEl.classList.remove('hidden');
    }
}

// --- UI LISTENERS ---
document.getElementById('login-form').addEventListener('submit', handleLogin);
