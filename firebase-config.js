// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEcit5wDWn6R100IFGAAQ03KN11pQ1Pd4",
  authDomain: "shoaib-portfolio-d28d2.firebaseapp.com",
  projectId: "shoaib-portfolio-d28d2",
  storageBucket: "shoaib-portfolio-d28d2.firebasestorage.app",
  messagingSenderId: "490103704007",
  appId: "1:490103704007:web:49425a772d2e2c09e031e2",
  measurementId: "G-85VL31X7CD"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
