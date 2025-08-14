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
                loadComponents(() => {
                    initializeCalendarPage(tasksCollectionRef, prospectsCollectionRef);
                    setupUIListeners();
                });
            } else {
                window.location.href = 'login.html';
            }
        });
    });
}

function initializeCalendarPage(tasksCollectionRef, prospectsCollectionRef) {
    const systemUsers = getAllUsers();
    let tasks = [];
    let prospects = [];
    let calendar;

    // Elementos do DOM para o modal (reutilizados)
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const taskAssigneeSelect = document.getElementById('task-assignee');
    const taskLinkedCardSearch = document.getElementById('task-linked-card-search');
    const taskLinkedCardId = document.getElementById('task-linked-card-id');
    const taskLinkedCardResults = document.getElementById('task-linked-card-results');
    const createTaskBtnCalendar = document.getElementById('create-task-btn-calendar');
    const addProspectBtnHeader = document.getElementById('addProspectBtnHeader');

    // Esconde o botão de "Novo Prospect" do header geral
    if (addProspectBtnHeader) {
        addProspectBtnHeader.style.display = 'none';
    }

    // Funções do Modal
    const openModal = () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        taskForm.reset();
        document.getElementById('task-id').value = '';
        modalTitle.textContent = 'Nova Tarefa';
        deleteTaskBtn.classList.add('hidden');
    };

    const populateUsers = () => {
        taskAssigneeSelect.innerHTML = '';
        systemUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = user.name;
            taskAssigneeSelect.appendChild(option);
        });
    };

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
    
    const openModalForEdit = (task) => {
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-assignee').value = task.assignee_email;
        document.getElementById('task-due-date').value = task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status || 'pending';
        document.getElementById('task-parent-entity').value = task.parent_entity;
        taskLinkedCardId.value = task.linked_card_id || '';
        const linkedCard = prospects.find(p => p.id === task.linked_card_id);
        taskLinkedCardSearch.value = linkedCard ? linkedCard.empresa : '';
        
        modalTitle.textContent = 'Editar Tarefa';
        deleteTaskBtn.classList.remove('hidden');
        openModal();
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
            alert("Não foi possível salvar a tarefa.");
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
                alert("Não foi possível apagar a tarefa.");
            }
        }
    };

    // Inicialização do Calendário
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [], // Inicia vazio, será populado pelo Firebase
        eventClick: function(info) {
            const taskId = info.event.id;
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                openModalForEdit(task);
            }
        },
        locale: 'pt-br',
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
        },
        height: '100%',
        windowResize: function(arg) {
            calendar.updateSize();
        }
    });
    calendar.render();

    // Listeners do Modal e Botão
    createTaskBtnCalendar.addEventListener('click', () => {
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
    fetchProspects();

    // Listener do Firebase
    onSnapshot(tasksCollectionRef, (snapshot) => {
        tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const calendarEvents = tasks.filter(task => task.due_date).map(task => ({
            id: task.id,
            title: task.title,
            start: task.due_date,
            allDay: false // Assumindo que due_date inclui a hora
        }));
        calendar.getEventSources().forEach(source => source.remove());
        calendar.addEventSource(calendarEvents);
    }, (error) => {
        console.error("Erro ao buscar tarefas:", error);
    });
}
