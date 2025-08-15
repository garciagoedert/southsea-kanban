import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { loadComponents, setupUIListeners } from './common-ui.js';

let db;
let auth;

// Função para inicializar o Firebase e a página
export function initializeAppWithFirebase(firebaseConfig) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (sessionStorage.getItem('isLoggedIn') === 'true') {
                loadComponents(() => {
                    setupUIListeners({}); // Setup sidebar interactivity
                    loadArchivedLeads();
                    const searchInput = document.getElementById('search-input');
                    searchInput.addEventListener('input', () => loadArchivedLeads(searchInput.value));
                });
            } else {
                window.location.href = 'login.html';
            }
        } else {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.error("Authentication Error:", error);
                document.body.innerHTML = `<div class="flex items-center justify-center h-screen text-red-500">Erro de autenticação. Tente novamente mais tarde.</div>`;
            }
        }
    });
}

// Função para carregar os leads arquivados
async function loadArchivedLeads(searchTerm = '') {
    const container = document.getElementById('archived-leads-container');
    container.innerHTML = ''; // Limpa o container

    try {
        const leadsRef = collection(db, 'artifacts', '1:476390177044:web:39e6597eb624006ee06a01', 'public', 'data', 'prospects');
        const q = query(leadsRef, where('pagina', '==', 'Arquivo'));
        const querySnapshot = await getDocs(q);

        let leads = [];
        querySnapshot.forEach(doc => {
            leads.push({ id: doc.id, ...doc.data() });
        });

        // Filtra os leads com base no termo de busca
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            leads = leads.filter(lead => {
                return (
                    lead.empresa?.toLowerCase().includes(lowercasedFilter) ||
                    lead.setor?.toLowerCase().includes(lowercasedFilter) ||
                    lead.telefone?.toLowerCase().includes(lowercasedFilter) ||
                    lead.email?.toLowerCase().includes(lowercasedFilter)
                );
            });
        }

        if (leads.length === 0) {
            container.innerHTML = '<p class="text-gray-400">Nenhum lead arquivado encontrado.</p>';
            return;
        }

        // Renderiza os cards dos leads
        leads.forEach(lead => {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 p-4 rounded-lg shadow-lg';
            card.innerHTML = `
                <h3 class="text-lg font-bold text-white">${lead.empresa || 'Empresa não informada'}</h3>
                <p class="text-sm text-gray-400">${lead.setor || 'Setor não informado'}</p>
                <div class="mt-2">
                    ${lead.telefone ? `<p class="text-sm text-gray-300"><i class="fas fa-phone-alt mr-2"></i>${lead.telefone}</p>` : ''}
                    ${lead.email ? `<p class="text-sm text-gray-300"><i class="fas fa-envelope mr-2"></i>${lead.email}</p>` : ''}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao carregar leads arquivados: ", error);
        container.innerHTML = '<p class="text-red-500">Erro ao carregar os leads. Tente novamente mais tarde.</p>';
    }
}
