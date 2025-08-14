import { loadComponents, setupUIListeners } from './common-ui.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Função principal que será exportada e chamada pelo HTML
export function initializeAppWithFirebase(firebaseConfig) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const appId = firebaseConfig.appId || 'default-app';
    const tasksCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const prospectsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'prospects');

    document.addEventListener('DOMContentLoaded', () => {
        onAuthStateChanged(auth, (user) => {
            if (user && sessionStorage.getItem('isLoggedIn') === 'true') {
                // Usuário autenticado, pode carregar a UI
                loadComponents(() => {
                    initializeTasksPage(tasksCollectionRef, prospectsCollectionRef);
                    setupUIListeners();
                });
            } else {
                // Usuário não autenticado, redireciona para o login
                window.location.href = 'login.html';
            }
        });
    });
}

function initializeTasksPage(tasksCollectionRef, prospectsCollectionRef) {
    const systemUsers = getAllUsers();
    let tasks = []; // O array será populado pelo Firebase
    let prospects = []; // Array para os cards do Kanban

    // Elementos do DOM
    const createTaskBtn = document.getElementById('create-task-btn');
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const taskForm = document.getElementById('task-form');
    const tasksTbody = document.getElementById('tasks-tbody');
    const modalTitle = document.getElementById('modal-title');
    
    const filterAssignee = document.getElementById('filter-assignee');
    const taskAssigneeSelect = document.getElementById('task-assignee');
    const taskLinkedCardSearch = document.getElementById('task-linked-card-search');
    const taskLinkedCardId = document.getElementById('task-linked-card-id');
    const taskLinkedCardResults = document.getElementById('task-linked-card-results');

    // Funções
    const fetchProspects = async () => {
        try {
            const snapshot = await getDocs(prospectsCollectionRef);
            prospects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Erro ao buscar prospects:", error);
        }
    };

    const renderCardSearchResults = (results) => {
        taskLinkedCardResults.innerHTML = '';
        if (results.length === 0) {
            taskLinkedCardResults.classList.add('hidden');
            return;
        }
        results.forEach(prospect => {
            const div = document.createElement('div');
            div.className = 'p-2 hover:bg-gray-500 cursor-pointer';
            div.textContent = `${prospect.empresa} (${prospect.status})`;
            div.dataset.id = prospect.id;
            div.dataset.name = prospect.empresa;
            div.addEventListener('click', () => {
                taskLinkedCardSearch.value = prospect.empresa;
                taskLinkedCardId.value = prospect.id;
                taskLinkedCardResults.classList.add('hidden');
            });
            taskLinkedCardResults.appendChild(div);
        });
        taskLinkedCardResults.classList.remove('hidden');
    };

    const openModal = () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Use flex to center it
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        taskForm.reset();
        document.getElementById('task-id').value = '';
        modalTitle.textContent = 'Nova Tarefa';
        deleteTaskBtn.classList.add('hidden'); // Esconde o botão de apagar
    };

    const populateUsers = () => {
        filterAssignee.innerHTML = '<option value="">Todos os Responsáveis</option>';
        taskAssigneeSelect.innerHTML = ''; // Limpa para não duplicar

        systemUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = user.name;
            filterAssignee.appendChild(option.cloneNode(true));
            taskAssigneeSelect.appendChild(option);
        });
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 font-bold';
            case 'high': return 'text-yellow-600';
            case 'normal': return 'text-blue-600';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return '<span class="bg-yellow-200 text-yellow-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">Pendente</span>';
            case 'in_progress': return '<span class="bg-blue-200 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">Em Progresso</span>';
            case 'done': return '<span class="bg-green-200 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">Concluída</span>';
            default: return '';
        }
    };

    const openModalForEdit = (task) => {
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-assignee').value = task.assignee_email;
        // Formata a data para o input datetime-local (YYYY-MM-DDTHH:mm)
        document.getElementById('task-due-date').value = task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status || 'pending';
        document.getElementById('task-parent-entity').value = task.parent_entity;
        taskLinkedCardId.value = task.linked_card_id || '';
        const linkedCard = prospects.find(p => p.id === task.linked_card_id);
        taskLinkedCardSearch.value = linkedCard ? linkedCard.empresa : '';
        
        modalTitle.textContent = 'Editar Tarefa';
        deleteTaskBtn.classList.remove('hidden'); // Mostra o botão de apagar
        openModal();
    };

    const renderTasks = (tasksToRender) => {
        tasksTbody.innerHTML = '';
        tasksToRender.forEach(task => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer';
            const assignee = systemUsers.find(u => u.email === task.assignee_email);
            const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'N/A';
            const linkedCard = prospects.find(p => p.id === task.linked_card_id);

            tr.innerHTML = `
                <td class="py-3 px-5 text-left">${task.title}</td>
                <td class="py-3 px-5 text-left">${linkedCard ? `<a data-card-id="${linkedCard.id}" class="text-blue-400 hover:underline cursor-pointer">${linkedCard.empresa}</a>` : (task.parent_entity || 'N/A')}</td>
                <td class="py-3 px-5 text-left">${assignee ? assignee.name : 'N/A'}</td>
                <td class="py-3 px-5 text-left">${dueDate}</td>
                <td class="py-3 px-5 text-left ${getPriorityClass(task.priority)}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</td>
                <td class="py-3 px-5 text-left">${getStatusBadge(task.status)}</td>
            `;
            tr.addEventListener('click', () => openModalForEdit(task));
            tasksTbody.appendChild(tr);
        });
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const taskId = document.getElementById('task-id').value;
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignee_email: document.getElementById('task-assignee').value,
            due_date: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            status: document.getElementById('task-status').value,
            parent_entity: document.getElementById('task-parent-entity').value,
            linked_card_id: taskLinkedCardId.value,
            updatedAt: serverTimestamp()
        };

        try {
            if (taskId) {
                const taskRef = doc(tasksCollectionRef, taskId);
                await updateDoc(taskRef, taskData);
            } else {
                taskData.status = 'pending';
                taskData.createdAt = serverTimestamp();
                await addDoc(tasksCollectionRef, taskData);
            }
            closeModal();
        } catch (error) {
            console.error("Erro ao salvar tarefa:", error);
            alert("Não foi possível salvar a tarefa. Verifique o console para mais detalhes.");
        }
    };

    const handleDeleteTask = async () => {
        const taskId = document.getElementById('task-id').value;
        if (!taskId) return;

        if (confirm('Você tem certeza que deseja apagar esta tarefa?')) {
            try {
                const taskRef = doc(tasksCollectionRef, taskId);
                await deleteDoc(taskRef);
                closeModal();
            } catch (error) {
                console.error("Erro ao apagar tarefa:", error);
                alert("Não foi possível apagar a tarefa. Verifique o console para mais detalhes.");
            }
        }
    };

    // Event Listeners
    createTaskBtn.addEventListener('click', () => {
        taskForm.reset();
        document.getElementById('task-id').value = '';
        modalTitle.textContent = 'Nova Tarefa';
        deleteTaskBtn.classList.add('hidden');
        openModal();
    });
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    deleteTaskBtn.addEventListener('click', handleDeleteTask);
    taskForm.addEventListener('submit', handleFormSubmit);
    
    tasksTbody.addEventListener('click', (e) => {
        if (e.target && e.target.matches('a[data-card-id]')) {
            e.preventDefault();
            const cardId = e.target.dataset.cardId;
            const card = prospects.find(p => p.id === cardId);
            if (card) {
                const productionStatuses = ['criacao', 'aprovacao', 'producao_v2', 'finalizacao', 'entrega', 'concluido'];
                const page = productionStatuses.includes(card.status.toLowerCase().replace(/ /g, '_')) ? 'producao.html' : 'index.html';
                window.location.href = `${page}?cardId=${cardId}`;
            }
        }
    });

    taskLinkedCardSearch.addEventListener('keyup', () => {
        const searchTerm = taskLinkedCardSearch.value.toLowerCase();
        if (searchTerm.length < 2) {
            taskLinkedCardResults.classList.add('hidden');
            return;
        }
        const results = prospects.filter(p => p.empresa.toLowerCase().includes(searchTerm));
        renderCardSearchResults(results);
    });

    // Inicialização
    populateUsers();
    fetchProspects(); // Busca os cards do Kanban
    
    // Listener do Firebase para atualizar as tarefas em tempo real
    onSnapshot(tasksCollectionRef, (snapshot) => {
        tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTasks(tasks);
    }, (error) => {
        console.error("Erro ao buscar tarefas:", error);
        tasksTbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 p-4">Erro ao carregar as tarefas.</td></tr>`;
    });
}
