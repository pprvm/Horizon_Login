import { collection, addDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { db } from './firebaseConfig.js';


// Função para gerar um ID aleatório no formato "ab123"
function generateRandomID() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const letter1 = letters[Math.floor(Math.random() * 26)];
  const letter2 = letters[Math.floor(Math.random() * 26)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${letter1}${letter2}${number}`;
}

// Função para gerar um ID único verificando no Firestore
async function generateUniqueID() {
  let attempts = 0;
  const maxAttempts = 10; // Limita o número de tentativas para evitar loop infinito
  let unique = false;
  let newID = '';

  while (!unique && attempts < maxAttempts) {
    newID = generateRandomID();
    attempts++;

    try {
      console.log(`Tentativa ${attempts}: Verificando ID ${newID}`);
      const querySnapshot = await getDocs(query(collection(db, 'employees'), where('id', '==', newID)));
      if (querySnapshot.empty) {
        unique = true;
      }
    } catch (error) {
      console.error('Erro ao verificar ID único:', error);
      throw new Error('Erro ao verificar ID único. Verifique a conexão com o Firestore.');
    }
  }

  if (!unique) {
    throw new Error('Falha ao gerar um ID único após várias tentativas.');
  }

  return newID;
}

// Manipula o envio do formulário
document.getElementById('employeeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const sector = document.getElementById('sector').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value.trim();

  // Validação dos campos
  if (!name || !sector || !email || !phone || !password) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  console.log('Tentando cadastrar funcionário:', { name, sector, email, phone, password });

  try {
    const id = await generateUniqueID(); // Gera um ID único
    console.log(`ID gerado com sucesso: ${id}`);

    await addDoc(collection(db, 'employees'), {
      id,
      name,
      sector,
      email,
      phone,
      password, // Adiciona a senha no banco de dados
    });

    alert(`Funcionário cadastrado com sucesso! ID: ${id}`);
    document.getElementById('employeeForm').reset();
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);
    alert(`Erro ao cadastrar funcionário: ${error.message}`);
  }
});

// Função para alternar a exibição da sidebar
function toggleSidebar() {
  const sidebar = document.querySelector('.card-left');
  sidebar.classList.toggle('hidden');
}

// Função de confirmação para logout
function confirmLogout() {
  const userConfirmed = confirm('Tem certeza de que deseja retornar à página inicial?');
  if (userConfirmed) {
    window.location.href = 'index.html';
  }
}

window.confirmLogout = confirmLogout;
window.toggleSidebar = toggleSidebar;
