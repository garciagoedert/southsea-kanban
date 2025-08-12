import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAKTAVsJKQISRYamsX7SMmh9uCJ6d2bMEs",
    authDomain: "kanban-652ba.firebaseapp.com",
    projectId: "kanban-652ba",
    storageBucket: "kanban-652ba.firebasestorage.app",
    messagingSenderId: "476390177044",
    appId: "1:476390177044:web:39e6597eb624006ee06a01",
    measurementId: "G-KRW331FL5F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = firebaseConfig.appId || 'default-kanban-app';

export async function duplicateCardToProduction(prospect) {
    try {
        const productionCollection = collection(db, 'artifacts', appId, 'public', 'data', 'prospects');
        const newCard = { ...prospect };
        delete newCard.id; 
        newCard.status = 'Produção // V1';
        newCard.createdAt = serverTimestamp();
        newCard.updatedAt = serverTimestamp();

        await addDoc(productionCollection, newCard);
    } catch (error) {
        console.error("Error duplicating card to production:", error);
    }
}
