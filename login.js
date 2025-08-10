// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKTAVsJKQISRYamsX7SMmh9uCJ6d2bMEs",
    authDomain: "kanban-652ba.firebaseapp.com",
    projectId: "kanban-652ba",
    storageBucket: "kanban-652ba.firebasestorage.app",
    messagingSenderId: "476390177044",
    appId: "1:476390177044:web:39e6597eb624006ee06a01",
    measurementId: "G-KRW331FL5F"
};

// --- INITIALIZATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- AUTHENTICATION ---
// This is handled in index.html now

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    if (email === 'marketing@southsea.com.br' && password === 'Southsea@!') {
        sessionStorage.setItem('isLoggedIn', 'true');
        errorEl.classList.add('hidden');
        window.location.href = 'index.html';
    } else {
        errorEl.classList.remove('hidden');
    }
}

// --- UI LISTENERS ---
document.getElementById('login-form').addEventListener('submit', handleLogin);
