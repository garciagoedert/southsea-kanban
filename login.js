// This script handles the login functionality.

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    const users = [
        { name: 'Marketing', email: 'marketing@southsea.com.br', password: 'Southsea@!' },
        { name: 'Paulo', email: 'paulo@southsea.com.br', password: 'Pg1308@!' },
        { name: 'Alefy', email: 'alefy@southsea.com.br', password: 'Ams_1308@!' },
        { name: 'Bruno', email: 'bruno@southsea.com.br', password: 'Bruno2025@!' }
    ];

    const foundUser = users.find(user => user.email === email && user.password === password);

    if (foundUser) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userName', foundUser.name); // Salva o nome do usuário
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
