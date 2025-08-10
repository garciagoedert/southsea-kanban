import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

    let currentUser = null;

    // Default user data
    const defaultUserData = {
        name: 'Nome do Usuário',
        email: 'email@exemplo.com',
        role: 'Desenvolvedor',
        department: 'Tecnologia',
        location: 'Cidade, Estado'
    };

    // Function to display user data
    const displayUserData = (userData) => {
        userNameElement.textContent = userData.name;
        userEmailElement.textContent = userData.email;
        userRoleElement.textContent = userData.role;
        userDepartmentElement.textContent = userData.department;
        userLocationElement.textContent = userData.location;
    };

    // Function to load user data from Firestore
    const loadUserData = async (userId) => {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            displayUserData(userDoc.data());
        } else {
            // If no profile, use default and save it for the new user
            await setDoc(userDocRef, defaultUserData);
            displayUserData(defaultUserData);
        }
    };

    // Function to save user data to Firestore
    const saveUserData = async (userId, data) => {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, data, { merge: true });
        displayUserData(data);
    };

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadUserData(currentUser.uid);
        } else {
            // Handle user not logged in
            console.log("User is not logged in.");
            // Redirect to login page or show a message
            window.location.href = 'login.html';
        }
    });

    // Open edit modal
    editProfileBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const currentUserData = userDoc.exists() ? userDoc.data() : defaultUserData;

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
    profileEditForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentUser) return;

        const updatedUserData = {
            name: editNameInput.value,
            email: editEmailInput.value,
            role: editRoleInput.value,
            department: editDepartmentInput.value,
            location: editLocationInput.value
        };
        await saveUserData(currentUser.uid, updatedUserData);
        editProfileModal.classList.add('hidden');
    });
});
