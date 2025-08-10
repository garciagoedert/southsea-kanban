document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const userRoleElement = document.getElementById('user-role');
    const userDepartmentElement = document.getElementById('user-department');
    const userLocationElement = document.getElementById('user-location');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileModal = document.getElementById('editProfileModal');
    const profileEditForm = document.getElementById('profileEditForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    const editNameInput = document.getElementById('edit-name');
    const editEmailInput = document.getElementById('edit-email');
    const editRoleInput = document.getElementById('edit-role');
    const editDepartmentInput = document.getElementById('edit-department');
    const editLocationInput = document.getElementById('edit-location');

    // Default user data
    const defaultUserData = {
        name: 'Nome do Usuário',
        email: 'email@exemplo.com',
        role: 'Desenvolvedor',
        department: 'Tecnologia',
        location: 'Cidade, Estado'
    };

    // Function to load user data from local storage
    const loadUserData = () => {
        const userData = JSON.parse(localStorage.getItem('userProfile')) || defaultUserData;
        userNameElement.textContent = userData.name;
        userEmailElement.textContent = userData.email;
        userRoleElement.textContent = userData.role;
        userDepartmentElement.textContent = userData.department;
        userLocationElement.textContent = userData.location;
    };

    // Function to save user data to local storage
    const saveUserData = (data) => {
        localStorage.setItem('userProfile', JSON.stringify(data));
        loadUserData(); // Reload and display updated data
    };

    // Open edit modal
    editProfileBtn.addEventListener('click', () => {
        const currentUserData = JSON.parse(localStorage.getItem('userProfile')) || defaultUserData;
        editNameInput.value = currentUserData.name;
        editEmailInput.value = currentUserData.email;
        editRoleInput.value = currentUserData.role;
        editDepartmentInput.value = currentUserData.department;
        editLocationInput.value = currentUserData.location;
        editProfileModal.classList.remove('hidden');
    });

    // Close edit modal (cancel button)
    cancelEditBtn.addEventListener('click', () => {
        editProfileModal.classList.add('hidden');
    });

    // Save changes (form submission)
    profileEditForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const updatedUserData = {
            name: editNameInput.value,
            email: editEmailInput.value,
            role: editRoleInput.value,
            department: editDepartmentInput.value,
            location: editLocationInput.value
        };
        saveUserData(updatedUserData);
        editProfileModal.classList.add('hidden');
    });

    // Initial load of user data when the page loads
    loadUserData();
});
