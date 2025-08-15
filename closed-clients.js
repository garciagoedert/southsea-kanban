// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, where, doc, deleteDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const db = getFirestore(app);
const appId = firebaseConfig.appId || 'default-kanban-app';

// --- GLOBAL STATE ---
let closedClientsListener = null;
let allClosedClients = [];
let filteredClosedClients = [];

// --- UI ELEMENTS ---
const closedClientsGrid = document.getElementById('closed-clients-grid');
const searchInput = document.getElementById('searchInput');
const confirmModal = document.getElementById('confirmModal');
const editClientModal = document.getElementById('editClientModal');
const editClientForm = document.getElementById('editClientForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const cancelEditFormBtn = document.getElementById('cancelEditFormBtn');


// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            document.getElementById('main-container').classList.remove('hidden');
            setupClosedClientsListener();
        } else {
            window.location.href = 'login.html';
        }
    } else {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Anonymous Authentication Error:", error);
            document.body.innerHTML = `<div class="flex items-center justify-center h-screen text-red-500">Erro de autenticação com o servidor. Tente novamente mais tarde.</div>`;
        }
    }
});

// --- DATA HANDLING (FIRESTORE) ---
function setupClosedClientsListener() {
    if (closedClientsListener) closedClientsListener();

    const prospectsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'prospects');
    const q = query(prospectsCollection, where("status", "==", "Concluído"));
    
    closedClientsListener = onSnapshot(q, (snapshot) => {
        allClosedClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilters();
    }, (error) => {
        console.error("Error fetching closed clients:", error);
        closedClientsGrid.innerHTML = `<p class="text-red-500 text-center col-span-full">Não foi possível carregar os clientes. Verifique sua conexão e as regras do Firestore.</p>`;
    });
}

// --- FILTERING ---
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    filteredClosedClients = allClosedClients.filter(client => {
        const matchesSearch = !searchTerm ||
            client.empresa.toLowerCase().includes(searchTerm) ||
            (client.setor && client.setor.toLowerCase().includes(searchTerm));
        return matchesSearch;
    });
    renderClosedClients();
}

// --- RENDERING ---
function renderClosedClients() {
    closedClientsGrid.innerHTML = '';

    const clientsToRender = filteredClosedClients;

    if (clientsToRender.length === 0) {
        const searchTerm = searchInput.value;
        if (searchTerm) {
            closedClientsGrid.innerHTML = `<div class="text-center text-gray-500 p-4 text-sm col-span-full">Nenhum cliente encontrado para "${searchTerm}".</div>`;
        } else {
            closedClientsGrid.innerHTML = '<div class="text-center text-gray-500 p-4 text-sm col-span-full">Nenhum cliente concluído ainda.</div>';
        }
        return;
    }

    clientsToRender
        .sort((a, b) => (b.updatedAt?.toDate() || 0) - (a.updatedAt?.toDate() || 0)) // Sort by most recently updated
        .forEach(client => {
            closedClientsGrid.appendChild(createClientCard(client));
        });
}


function createClientCard(client) {
    const card = document.createElement('div');
    card.className = `bg-gray-800 p-4 rounded-lg shadow-md border-l-4 flex flex-col`;
    card.style.borderLeftColor = getPriorityColor(client.prioridade);

    const sectorColor = getSectorColor(client.setor);

    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold text-lg flex-grow pr-2">${client.empresa}</h4>
            <div class="relative">
                <button data-action="toggle-menu" class="text-gray-500 hover:text-white text-xs"><i class="fas fa-ellipsis-v"></i></button>
                <div data-menu class="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 hidden">
                    <a href="#" data-action="edit" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Editar</a>
                    <a href="#" data-action="archive" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Arquivar</a>
                    <a href="#" data-action="delete" class="block px-4 py-2 text-sm text-red-400 hover:bg-gray-600">Excluir</a>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${sectorColor.bg} ${sectorColor.text}">${client.setor}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">P${client.prioridade}</span>
        </div>
        <p class="text-sm text-green-400 font-semibold mb-2">R$ ${client.ticketEstimado?.toLocaleString('pt-BR') || 'N/A'}</p>
        <div class="flex-grow"></div>
        <p class="text-xs text-gray-400 mt-auto">Concluído em: ${client.updatedAt ? new Date(client.updatedAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Data não disponível'}</p>
    `;

    card.addEventListener('click', (e) => {
        const actionTarget = e.target.closest('[data-action]');
        if (!actionTarget) return;

        e.stopPropagation();
        const action = actionTarget.dataset.action;
        const clientId = client.id;

        if (action === 'toggle-menu') {
            const menu = card.querySelector('[data-menu]');
            menu.classList.toggle('hidden');
        } else if (action === 'delete') {
            const clientToDelete = allClosedClients.find(c => c.id === clientId);
            if (clientToDelete) {
                showConfirmModal(`Deseja realmente excluir "${clientToDelete.empresa}"?`, () => {
                    deleteClient(clientId);
                });
            }
        } else if (action === 'edit') {
            const clientToEdit = allClosedClients.find(c => c.id === clientId);
            if (clientToEdit) {
                openEditModal(clientToEdit);
            }
        } else if (action === 'archive') {
            const clientToArchive = allClosedClients.find(c => c.id === clientId);
            if (clientToArchive) {
                showConfirmModal(`Deseja arquivar "${clientToArchive.empresa}"?`, () => {
                    archiveClient(clientId);
                });
            }
        }
    });
    
    return card;
}

// --- EDIT MODAL ---
function openEditModal(client) {
    document.getElementById('editClientId').value = client.id;
    document.getElementById('editClientEmpresa').value = client.empresa || '';
    document.getElementById('editClientSetor').value = client.setor || '';
    document.getElementById('editClientPrioridade').value = client.prioridade || '';
    document.getElementById('editClientTicket').value = client.ticketEstimado || '';
    document.getElementById('editClientTelefone').value = client.telefone || '';
    document.getElementById('editClientEmail').value = client.email || '';
    document.getElementById('editClientCpf').value = client.cpf || '';
    document.getElementById('editClientCnpj').value = client.cnpj || '';
    document.getElementById('editClientEndereco').value = client.endereco || '';
    document.getElementById('editClientRedesSociais').value = client.redesSociais || '';
    document.getElementById('editClientSiteAtual').value = client.siteAtual || '';
    document.getElementById('editClientObservacoes').value = client.observacoes || '';
    editClientModal.style.display = 'flex';
}

function closeEditModal() {
    editClientModal.style.display = 'none';
}

async function handleUpdateClient(e) {
    e.preventDefault();
    const clientId = document.getElementById('editClientId').value;
    const updatedData = {
        empresa: document.getElementById('editClientEmpresa').value,
        setor: document.getElementById('editClientSetor').value,
        prioridade: parseInt(document.getElementById('editClientPrioridade').value, 10),
        ticketEstimado: parseFloat(document.getElementById('editClientTicket').value) || 0,
        telefone: document.getElementById('editClientTelefone').value,
        email: document.getElementById('editClientEmail').value,
        cpf: document.getElementById('editClientCpf').value,
        cnpj: document.getElementById('editClientCnpj').value,
        endereco: document.getElementById('editClientEndereco').value,
        redesSociais: document.getElementById('editClientRedesSociais').value,
        siteAtual: document.getElementById('editClientSiteAtual').value,
        observacoes: document.getElementById('editClientObservacoes').value,
        updatedAt: Timestamp.now()
    };

    try {
        const clientRef = doc(db, 'artifacts', appId, 'public', 'data', 'prospects', clientId);
        await updateDoc(clientRef, updatedData);
        closeEditModal();
    } catch (error) {
        console.error("Error updating client:", error);
        alert("Erro ao atualizar o cliente. Tente novamente.");
    }
}

// --- CRUD OPERATIONS ---
async function deleteClient(clientId) {
    try {
        const clientRef = doc(db, 'artifacts', appId, 'public', 'data', 'prospects', clientId);
        await deleteDoc(clientRef);
        // The onSnapshot listener will automatically update the UI
    } catch (error) {
        console.error("Error deleting client:", error);
        alert("Erro ao excluir o cliente. Tente novamente.");
    }
}

async function archiveClient(clientId) {
    try {
        const clientRef = doc(db, 'artifacts', appId, 'public', 'data', 'prospects', clientId);
        await updateDoc(clientRef, {
            pagina: 'Arquivo',
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error archiving client:", error);
        alert("Erro ao arquivar o cliente. Tente novamente.");
    }
}

// --- MODAL HANDLING ---
function showConfirmModal(message, onConfirm) {
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmActionBtn');
    const cancelBtn = document.getElementById('cancelConfirmBtn');

    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex';

    const confirmHandler = () => {
        onConfirm();
        closeConfirmModal();
        cleanup();
    };
    
    const cancelHandler = () => {
        closeConfirmModal();
        cleanup();
    };

    function cleanup() {
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
    }

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
}

function closeConfirmModal() {
    confirmModal.style.display = 'none';
}

// --- UTILITY ---
function getPriorityColor(priority) {
    const colors = {
        5: '#ef4444', 4: '#f97316', 3: '#eab308', 2: '#3b82f6', 1: '#8b5cf6',
    };
    return colors[priority] || '#6b7280';
}

function stringToColorIndex(str, colorArrayLength) {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % colorArrayLength);
}

function getSectorColor(sector) {
    const colorPalette = [
        { bg: 'bg-blue-900/50', text: 'text-blue-200' },
        { bg: 'bg-purple-900/50', text: 'text-purple-200' },
        { bg: 'bg-teal-900/50', text: 'text-teal-200' },
        { bg: 'bg-red-900/50', text: 'text-red-200' },
        { bg: 'bg-cyan-900/50', text: 'text-cyan-200' },
        { bg: 'bg-green-900/50', text: 'text-green-200' },
        { bg: 'bg-amber-900/50', text: 'text-amber-200' },
        { bg: 'bg-pink-900/50', text: 'text-pink-200' },
        { bg: 'bg-indigo-900/50', text: 'text-indigo-200' },
        { bg: 'bg-lime-900/50', text: 'text-lime-200' }
    ];
    
    const index = stringToColorIndex(sector, colorPalette.length);
    return colorPalette[index] || { bg: 'bg-gray-700', text: 'text-gray-200' };
}

// --- UI LISTENERS ---
window.setupUIListeners = function() {
    // Search listener
    searchInput.addEventListener('keyup', applyFilters);

    // Edit modal listeners
    editClientForm.addEventListener('submit', handleUpdateClient);
    cancelEditBtn.addEventListener('click', closeEditModal);
    cancelEditFormBtn.addEventListener('click', closeEditModal);

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (sidebar && menuToggle && sidebarCloseBtn && backdrop) {
        const toggleSidebar = () => {
            const isHidden = sidebar.classList.contains('-translate-x-full');
            if (isHidden) {
                sidebar.classList.remove('-translate-x-full');
                backdrop.classList.remove('hidden');
                if (window.innerWidth >= 768) { 
                     mainContent.classList.add('md:ml-64');
                }
            } else {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.add('hidden');
                if (window.innerWidth >= 768) {
                    mainContent.classList.remove('md:ml-64');
                }
            }
        };
        menuToggle.addEventListener('click', toggleSidebar);
        sidebarCloseBtn.addEventListener('click', toggleSidebar);
        backdrop.addEventListener('click', toggleSidebar);
    }
}

// --- INITIALIZE APP ---
async function loadComponents() {
    const headerContainer = document.getElementById('header-container');
    const sidebarContainer = document.getElementById('sidebar-container');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    try {
        const [headerRes, sidebarRes] = await Promise.all([
            fetch('header.html'),
            fetch('sidebar.html')
        ]);

        if (!headerRes.ok || !sidebarRes.ok) {
            throw new Error('Failed to fetch components');
        }

        headerContainer.innerHTML = await headerRes.text();
        sidebarContainer.innerHTML = await sidebarRes.text();

        // Set active link in sidebar
        const sidebarLinks = sidebarContainer.querySelectorAll('nav a');
        sidebarLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage) {
                link.classList.add('bg-blue-500', 'text-white');
                link.classList.remove('bg-gray-700', 'hover:bg-gray-600');
            }
        });
        
        // Re-initialize UI listeners that depend on the loaded components
        setupUIListeners();

    } catch (error) {
        console.error('Error loading components:', error);
        headerContainer.innerHTML = '<p class="text-red-500 p-4">Error loading header.</p>';
        sidebarContainer.innerHTML = '<p class="text-red-500 p-4">Error loading sidebar.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponents();
});
