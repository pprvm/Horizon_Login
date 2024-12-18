// Importa as funções necessárias do Firebase
import { db } from './firebaseConfig.js';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, where} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Função para carregar funcionários
async function loadEmployees() {
  const tableBody = document.getElementById('employees-table-body');
  tableBody.innerHTML = '';

  try {
    const querySnapshot = await getDocs(collection(db, 'employees'),where("name", '!=', 'mail'));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const row = `
        <tr data-id="${docSnap.id}">
          <td>${data.id}</td>
          <td>${data.name}</td>
          <td>${data.sector}</td>
          <td>${data.email}</td>
          <td>${data.phone}</td>
          <td class="password-cell" data-password="${data.password}">
            <input type="password" value="${data.password}" disabled>
          </td>
          <td>
            <button class="edit-button" onclick="editEmployee('${docSnap.id}')">
              <img src="img/lapis_icone.png" alt="Ícone de Lápis" width="30" height="30">
            </button>
            <button class="delete-button" onclick="deleteEmployee('${docSnap.id}')">
              <img src="img/lixeira_icone.png" alt="Ícone de Lixeira" width="30" height="30">
            </button>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error('Erro ao carregar funcionários:', error);
  }
}

// Função para excluir funcionário e seus registros de check-in
async function deleteEmployee(employeeId) {
  if (confirm('Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita e também vai excluir seus registros de check-in/out.')) {
    try {
      // Excluir funcionário da coleção 'employees'
      await deleteDoc(doc(db, 'employees', employeeId));

      // Excluir registros de check-in relacionados ao funcionário
      const checkinQuerySnapshot = await getDocs(collection(db, 'checkin'));
      checkinQuerySnapshot.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (data.id === employeeId) {
          await deleteDoc(doc(db, 'checkin', docSnap.id));
        }
      });

      alert('Funcionário e seus registros de check-in excluídos com sucesso.');

      // Recarrega a tabela de funcionários
      loadEmployees();
    } catch (error) {
      console.error('Erro ao excluir funcionário e registros:', error);
      alert('Erro ao excluir o funcionário. Tente novamente.');
    }
  }
}

// Função para editar os dados de um funcionário
function editEmployee(employeeId) {
  const row = document.querySelector(`tr[data-id="${employeeId}"]`);
  const cells = row.getElementsByTagName('td');

  cells[1].innerHTML = `<input type="text" value="${cells[1].textContent}" id="edit-name-${employeeId}" class="edit-input">`;
  cells[2].innerHTML = `<input type="text" value="${cells[2].textContent}" id="edit-sector-${employeeId}" class="edit-input">`;
  cells[3].innerHTML = `<input type="email" value="${cells[3].textContent}" id="edit-email-${employeeId}" class="edit-input">`;
  cells[4].innerHTML = `<input type="text" value="${cells[4].textContent}" id="edit-phone-${employeeId}" class="edit-input">`;
  
  // Exibe a senha real durante a edição
  const passwordCell = cells[5];
  passwordCell.innerHTML = `<input type="text" value="${passwordCell.getAttribute('data-password')}" id="edit-password-${employeeId}" class="edit-input">`;

  cells[6].innerHTML = `
    <button class="save-button" onclick="saveEmployee('${employeeId}')">💾</button>
    <button class="cancel-button" onclick="cancelEdit()">❌</button>
  `;
}

// Função para salvar as alterações no banco de dados
async function saveEmployee(employeeId) {
  const newName = document.getElementById(`edit-name-${employeeId}`).value.trim();
  const newSector = document.getElementById(`edit-sector-${employeeId}`).value.trim();
  const newEmail = document.getElementById(`edit-email-${employeeId}`).value.trim();
  const newPhone = document.getElementById(`edit-phone-${employeeId}`).value.trim();
  const newPassword = document.getElementById(`edit-password-${employeeId}`).value.trim();

  if (!newName || !newSector || !newEmail || !newPhone || !newPassword) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  try {
    await updateDoc(doc(db, 'employees', employeeId), {
      name: newName,
      sector: newSector,
      email: newEmail,
      phone: newPhone,
      password: newPassword,
    });

    alert('Funcionário atualizado com sucesso!');
    loadEmployees();
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    alert('Erro ao atualizar funcionário. Tente novamente.');
  }
}


// Função para cancelar a edição
function cancelEdit() {
  loadEmployees(); // Recarrega a tabela para desfazer a edição
}

// Função para atualizar os registros na coleção 'checkin'
async function updateCheckinRecords(employeeId, updatedData) {
  const checkinRef = collection(db, 'checkin');

  try {
    const q = query(checkinRef, where('id', '==', updatedData.id));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (docSnap) => {
      const checkinDocRef = doc(db, 'checkin', docSnap.id);
      await updateDoc(checkinDocRef, {
        name: updatedData.name,
        sector: updatedData.sector,
      });
    });
  } catch (error) {
    console.error('Erro ao atualizar registros na coleção checkin:', error);
  }
}

// Função para buscar funcionários por Nome ou ID em tempo real
function searchEmployees() {
  const input = document.getElementById('search-input').value.toLowerCase();
  const tableBody = document.getElementById('employees-table-body');
  const rows = tableBody.getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    const id = cells[0].textContent.toLowerCase();
    const name = cells[1].textContent.toLowerCase();

    if (id.includes(input) || name.includes(input)) {
      rows[i].style.display = '';
    } else {
      rows[i].style.display = 'none';
    }
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.card-left');
  sidebar.classList.toggle('hidden');
}

function confirmLogout() {
  const userConfirmed = confirm("Tem certeza de que deseja retornar à página inicial?");
  if (userConfirmed) {
    window.location.href = "index.html";
  }
}

// Adicionar evento de busca em tempo real ao campo de pesquisa
document.getElementById('search-input').addEventListener('input', searchEmployees);
window.deleteEmployee = deleteEmployee;
window.editEmployee = editEmployee;
window.saveEmployee = saveEmployee;
window.cancelEdit = cancelEdit;
window.onload = loadEmployees;
window.confirmLogout = confirmLogout;
window.toggleSidebar = toggleSidebar;

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Chama a função ao clicar no botão
searchButton.addEventListener('click', searchEmployees);

// Chama a função ao pressionar Enter no campo de pesquisa
searchInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchEmployees();
  }
});
