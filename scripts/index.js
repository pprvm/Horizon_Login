import { db } from './firebaseConfig.js';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';


// Função para tratar o check-in/check-out
async function handleCheckin() {
  const idInput = document.getElementById('id-input').value.trim();
  const passwordInput = document.getElementById('password-input').value.trim();

  if (!idInput || !passwordInput) {
    alert('Por favor, digite um ID/E-mail e uma senha.');
    return;
  }

  try {
    const employeesRef = collection(db, 'employees');

    const q = query(employeesRef, where('id', '==', idInput));
    const emailQuery = query(employeesRef, where('email', '==', idInput));

    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      querySnapshot = await getDocs(emailQuery);
    }

    if (!querySnapshot.empty) {
      const employeeDoc = querySnapshot.docs[0];
      const employeeData = employeeDoc.data();

      if (employeeData.password !== passwordInput) {
        alert('Senha incorreta. Tente novamente.');
        return;
      }

      // Processo de check-in/check-out
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

      const checkinRef = collection(db, 'checkin');
      const checkinQuery = query(
        checkinRef,
        where('id', '==', employeeData.id),
        where('data', '==', today),
        where('checkOut', '==', '')
      );

      const checkinSnapshot = await getDocs(checkinQuery);

      if (checkinSnapshot.empty) {
        await addDoc(checkinRef, {
          id: employeeData.id,
          name: employeeData.name,
          sector: employeeData.sector,
          data: today,
          checkIn: currentTime,
          checkOut: '',
        });
        alert(`Check-in realizado com sucesso para ${employeeData.name} às ${currentTime}.`);
      } else {
        const checkinDoc = checkinSnapshot.docs[0];
        await updateDoc(doc(db, 'checkin', checkinDoc.id), {
          checkOut: currentTime,
        });
        alert(`Check-out realizado com sucesso para ${employeeData.name} às ${currentTime}.`);
      }
    } else {
      alert('Funcionário não encontrado. Verifique o ID/E-mail.');
    }

    // Limpar os campos
    document.getElementById('id-input').value = '';
    document.getElementById('password-input').value = '';
  } catch (error) {
    console.error('Erro ao realizar check-in/check-out:', error);
    alert('Erro ao realizar check-in/check-out. Tente novamente.');
  }
}

// Função para capturar a tecla "Enter" no input
document.getElementById('id-input').addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    handleCheckin();
  }
});

// Função para mostrar o modal
async function showPendingCheckouts() {
  const modal = document.getElementById('modal');
  const tableBody = document.getElementById('pending-checkouts-table');
  tableBody.innerHTML = '';

  try { 
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const checkinRef = collection(db, 'checkin');
    const checkinQuery = query(checkinRef, where('data', '==', today), where('checkOut', '==', ''));

    const querySnapshot = await getDocs(checkinQuery);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = `
        <tr>
          <td>${data.name}</td>
          <td>${data.sector}</td>
          <td>${data.checkIn}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });

    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Erro ao carregar check-outs pendentes:', error);
    alert('Erro ao carregar check-outs pendentes.');
  }
}

// Função para fechar o modal
function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const verifiedIdentifier = urlParams.get('verified');

  if (verifiedIdentifier) {
    performCheckin(verifiedIdentifier);
  }
});

// Exporta as funções para uso no HTML
window.handleCheckin = handleCheckin;
window.showPendingCheckouts = showPendingCheckouts;
window.closeModal = closeModal;