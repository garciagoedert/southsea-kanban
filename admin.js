import { loadComponents, setupUIListeners } from './common-ui.js';

function setupAdminPage() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    const userTableBody = document.getElementById('user-table-body');
    const userForm = document.getElementById('user-form');
    const formTitle = document.getElementById('form-title');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const isAdminInput = document.getElementById('isAdmin');
    const hiddenEmailInput = document.getElementById('user-email-hidden');
    const cancelEditBtn = document.getElementById('cancel-edit');

    function renderUsers() {
        userTableBody.innerHTML = '';
        const users = getAllUsers();
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2 px-4 border-b border-gray-700">${user.name}</td>
                <td class="py-2 px-4 border-b border-gray-700">${user.email}</td>
                <td class="py-2 px-4 border-b border-gray-700">${user.isAdmin ? 'Sim' : 'Não'}</td>
                <td class="py-2 px-4 border-b border-gray-700">
                    <button class="text-blue-400 hover:text-blue-600 mr-2 edit-btn" data-email="${user.email}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-400 hover:text-red-600 delete-btn" data-email="${user.email}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const isAdmin = isAdminInput.checked;
        const originalEmail = hiddenEmailInput.value;

        if (originalEmail) {
            // Editing user
            const updatedData = { name, email, isAdmin };
            if (password) {
                updatedData.password = password;
            }
            updateUser(originalEmail, updatedData);
        } else {
            // Adding new user
            addUser({ name, email, password, isAdmin });
        }

        resetForm();
        renderUsers();
    }

    function resetForm() {
        formTitle.textContent = 'Adicionar Novo Usuário';
        userForm.reset();
        hiddenEmailInput.value = '';
        emailInput.disabled = false;
        cancelEditBtn.classList.add('hidden');
    }

    userTableBody.addEventListener('click', function(e) {
        if (e.target.closest('.edit-btn')) {
            const email = e.target.closest('.edit-btn').dataset.email;
            const user = getAllUsers().find(u => u.email === email);
            if (user) {
                formTitle.textContent = 'Editar Usuário';
                nameInput.value = user.name;
                emailInput.value = user.email;
                emailInput.disabled = true;
                isAdminInput.checked = user.isAdmin;
                hiddenEmailInput.value = user.email;
                passwordInput.placeholder = "Deixe em branco para não alterar";
                cancelEditBtn.classList.remove('hidden');
            }
        }

        if (e.target.closest('.delete-btn')) {
            const email = e.target.closest('.delete-btn').dataset.email;
            if (confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
                deleteUser(email);
                renderUsers();
            }
        }
    });

    cancelEditBtn.addEventListener('click', resetForm);
    userForm.addEventListener('submit', handleFormSubmit);

    renderUsers();
    setupUIListeners();
}

loadComponents(setupAdminPage);
