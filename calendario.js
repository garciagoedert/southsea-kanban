import { loadComponents, setupUIListeners } from './common-ui.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Função principal que será exportada e chamada pelo HTML
export function initializeAppWithFirebase(firebaseConfig) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const appId = firebaseConfig.appId || 'default-app';
    const tasksCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');

    document.addEventListener('DOMContentLoaded', () => {
        onAuthStateChanged(auth, (user) => {
            if (user && sessionStorage.getItem('isLoggedIn') === 'true') {
                loadComponents(() => {
                    initializeCalendarPage(tasksCollectionRef);
                    setupUIListeners();
                });
            } else {
                window.location.href = 'login.html';
            }
        });
    });
}

function initializeCalendarPage(tasksCollectionRef) {
    const systemUsers = getAllUsers();
    let tasks = [];
    let calendar;

    // Elementos do DOM para o modal (reutilizados)
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const taskAssigneeSelect = document.getElementById('task-assignee');

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
    
    const openModalForEdit = (task) => {
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-assignee').value = task.assignee_email;
        document.getElementById('task-due-date').value = task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status || 'pending';
        document.getElementById('task-parent-entity').value = task.parent_entity;
        
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

    // Listeners do Modal
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    deleteTaskBtn.addEventListener('click', handleDeleteTask);
    taskForm.addEventListener('submit', handleFormSubmit);

    // Inicialização
    populateUsers();

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
