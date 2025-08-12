import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

let revenueChart = null;
let sectorChart = null;

async function fetchData() {
    const prospectsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'prospects');
    const prospectsSnapshot = await getDocs(prospectsCollection);
    const prospects = prospectsSnapshot.docs.map(doc => doc.data());
    console.log("Fetched Prospects Data:", prospects);
    return prospects;
}

function processData(prospects) {
    const productionClients = prospects.filter(p => p.status && p.status.startsWith('Produção'));
    const closedClients = prospects.filter(p => p.status === 'Concluído');
    
    // Stats
    const totalClients = new Set(prospects.map(c => c.empresa)).size;
    const totalRevenue = closedClients.reduce((sum, p) => sum + (p.ticketEstimado || 0), 0);
    const avgTicket = totalClients > 0 ? totalRevenue / totalClients : 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newClientsThisMonth = prospects.filter(c => {
        if (c.createdAt && c.createdAt.toDate) {
            const createdAt = c.createdAt.toDate();
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
        }
        return false;
    }).length;

    // Chart Data
    const monthlyRevenue = {};
    closedClients.forEach(c => {
        if (c.updatedAt && c.updatedAt.toDate) {
            const date = c.updatedAt.toDate();
            const month = date.toLocaleString('default', { month: 'long' });
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (c.ticketEstimado || 0);
        }
    });

    const clientsBySector = {};
    const productionAndClosedClients = [...productionClients, ...closedClients];
    console.log("Combined Production and Closed Clients:", productionAndClosedClients);
    productionAndClosedClients.forEach(c => {
        const sector = c.setor || 'Não especificado';
        clientsBySector[sector] = (clientsBySector[sector] || 0) + 1;
    });
    console.log("Processed Clients by Sector:", clientsBySector);

    return {
        totalClients,
        totalRevenue,
        avgTicket,
        newClientsThisMonth,
        monthlyRevenue,
        clientsBySector
    };
}

function updateUI(processedData) {
    // Update stats
    document.querySelector('#stats').innerHTML = `
        <div class="bg-gray-800 p-4 rounded-lg flex items-center gap-4 shadow-md">
            <div class="bg-gray-700 p-3 rounded-full"><i class="fas fa-users fa-lg text-gray-300"></i></div>
            <div>
                <div class="text-2xl font-bold">${processedData.totalClients}</div>
                <div class="text-sm text-gray-400">Total de Clientes</div>
            </div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg flex items-center gap-4 shadow-md">
            <div class="bg-gray-700 p-3 rounded-full"><i class="fas fa-dollar-sign fa-lg text-green-500"></i></div>
            <div>
                <div class="text-2xl font-bold">R$ ${processedData.totalRevenue.toLocaleString('pt-BR')}</div>
                <div class="text-sm text-gray-400">Receita Total</div>
            </div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg flex items-center gap-4 shadow-md">
            <div class="bg-gray-700 p-3 rounded-full"><i class="fas fa-chart-pie fa-lg text-blue-500"></i></div>
            <div>
                <div class="text-2xl font-bold">R$ ${Math.round(processedData.avgTicket).toLocaleString('pt-BR')}</div>
                <div class="text-sm text-gray-400">Ticket Médio</div>
            </div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg flex items-center gap-4 shadow-md">
            <div class="bg-gray-700 p-3 rounded-full"><i class="fas fa-star fa-lg text-yellow-400"></i></div>
            <div>
                <div class="text-2xl font-bold">${processedData.newClientsThisMonth}</div>
                <div class="text-sm text-gray-400">Novos Clientes (Mês)</div>
            </div>
        </div>
    `;

    // Update charts
    if (revenueChart) revenueChart.destroy();
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(processedData.monthlyRevenue),
            datasets: [{
                label: 'Receita',
                data: Object.values(processedData.monthlyRevenue),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { callback: value => 'R$ ' + value / 1000 + 'k' } } },
            plugins: { legend: { display: false } }
        }
    });

    if (sectorChart) sectorChart.destroy();
    const sectorCtx = document.getElementById('sectorChart').getContext('2d');
    sectorChart = new Chart(sectorCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(processedData.clientsBySector),
            datasets: [{
                label: 'Clientes por Setor',
                data: Object.values(processedData.clientsBySector),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(234, 179, 8, 0.7)',
                    'rgba(239, 68, 68, 0.7)', 'rgba(107, 114, 128, 0.7)', 'rgba(139, 92, 246, 0.7)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.error("Anonymous Authentication Error:", error);
                document.body.innerHTML = `<div class="flex items-center justify-center h-screen text-red-500">Erro de autenticação.</div>`;
                return;
            }
        }
        
        try {
            const data = await fetchData();
            const processedData = processData(data);
            updateUI(processedData);
        } catch (error) {
            console.error("Error loading analysis data:", error);
            document.getElementById('stats').innerHTML = `<p class="text-red-500 col-span-full">Erro ao carregar dados para análise.</p>`;
        }
    });
});
