// firebaseConfig.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyAO2sGJZDarnIWtJUlJb-Qrc3cg5g0qmqc',
  authDomain: 'horizon-focus.firebaseapp.com',
  projectId: 'horizon-focus',
  storageBucket: 'horizon-focus.firebaseapp.com',
  messagingSenderId: '31055563122',
  appId: '1:31055563122:web:da0bb34a1c5076ab0675eb',
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta instâncias do Firebase Authentication e Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
