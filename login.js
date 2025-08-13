// This script handles the login functionality.

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    const foundUser = findUser(email, password);

    if (foundUser) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userName', foundUser.name);
        sessionStorage.setItem('isAdmin', foundUser.isAdmin);
        generalLog.add(foundUser.name, 'Login', 'User logged in successfully');
        errorEl.classList.add('hidden');
        window.location.href = 'index.html';
    } else {
        errorEl.textContent = 'Email ou senha inválidos.';
        errorEl.classList.remove('hidden');
    }
}

// --- UI LISTENERS ---
document.getElementById('login-form').addEventListener('submit', handleLogin);
