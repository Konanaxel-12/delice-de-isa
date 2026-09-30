import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC4B-3LzO1E5KXoweXpA7sdfD7C44jMOOQ",
    authDomain: "isadelice-e6989.firebaseapp.com",
    projectId: "isadelice-e6989",
    storageBucket: "isadelice-e6989.firebasestorage.app",
    messagingSenderId: "742349574137",
    appId: "1:742349574137:web:4282651596915e7112f728",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);