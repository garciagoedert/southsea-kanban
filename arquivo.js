import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
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
                createModal();
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
            card.className = 'bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col';
            card.innerHTML = `
                <div>
                    <h3 class="text-lg font-bold text-white">${lead.empresa || 'Empresa não informada'}</h3>
                    <p class="text-sm text-gray-400">${lead.setor || 'Setor não informado'}</p>
                    <div class="mt-2">
                        ${lead.telefone ? `<p class="text-sm text-gray-300"><i class="fas fa-phone-alt mr-2"></i>${lead.telefone}</p>` : ''}
                        ${lead.email ? `<p class="text-sm text-gray-300"><i class="fas fa-envelope mr-2"></i>${lead.email}</p>` : ''}
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-700 text-right">
                    <button data-id="${lead.id}" class="edit-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Editar</button>
                </div>
            `;
            container.appendChild(card);
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const leadId = e.target.dataset.id;
                const leadData = leads.find(l => l.id === leadId);
                openEditModal(leadData);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar leads arquivados: ", error);
        container.innerHTML = '<p class="text-red-500">Erro ao carregar os leads. Tente novamente mais tarde.</p>';
    }
}

function createModal() {
    const modalHTML = `
    <div id="editModal" class="fixed inset-0 bg-black bg-opacity-70 z-50 hidden items-center justify-center p-4">
        <div class="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 class="text-xl font-bold">Editar Lead Arquivado</h2>
                <button id="closeModalBtn" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form id="editForm" class="p-6 overflow-y-auto custom-scrollbar">
                <input type="hidden" id="editLeadId">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="empresa" class="block text-sm font-medium text-gray-300 mb-1">Empresa *</label>
                        <input type="text" id="empresa" class="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div class="form-group">
                        <label for="setor" class="block text-sm font-medium text-gray-300 mb-1">Setor *</label>
                        <input type="text" id="setor" placeholder="Ex: Imobiliário" class="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div class="form-group">
                        <label for="endereco" class="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                        <div class="flex items-center">
                            <input type="text" id="endereco" placeholder="Rua, Número, Bairro, Cidade" class="w-full bg-gray-700 border border-gray-600 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <button type="button" id="openMapBtn" title="Abrir no Google Maps" class="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-r-lg">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                    <button type="button" id="cancelBtn" class="bg-gray-600 hover:bg-gray-500 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
                </div>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('closeModalBtn').addEventListener('click', closeEditModal);
    document.getElementById('cancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('editForm').addEventListener('submit', saveLeadChanges);
    document.getElementById('openMapBtn').addEventListener('click', () => {
        const address = document.getElementById('endereco').value;
        if (address) {
            const encodedAddress = encodeURIComponent(address);
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            window.open(mapUrl, '_blank');
        } else {
            alert('Por favor, insira um endereço.');
        }
    });
}

function openEditModal(lead) {
    document.getElementById('editLeadId').value = lead.id;
    document.getElementById('empresa').value = lead.empresa || '';
    document.getElementById('setor').value = lead.setor || '';
    document.getElementById('endereco').value = lead.endereco || '';
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveLeadChanges(e) {
    e.preventDefault();
    const leadId = document.getElementById('editLeadId').value;
    const data = {
        empresa: document.getElementById('empresa').value,
        setor: document.getElementById('setor').value,
        endereco: document.getElementById('endereco').value,
    };

    try {
        const leadRef = doc(db, 'artifacts', '1:476390177044:web:39e6597eb624006ee06a01', 'public', 'data', 'prospects', leadId);
        await updateDoc(leadRef, data);
        closeEditModal();
        loadArchivedLeads(document.getElementById('search-input').value);
    } catch (error) {
        console.error("Error updating lead:", error);
        alert("Erro ao salvar as alterações.");
    }
}
