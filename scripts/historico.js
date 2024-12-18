// Importa as funções necessárias do Firebase
import { db } from './firebaseConfig.js';
import { collection, getDocs, onSnapshot, updateDoc, deleteDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

async function generateAndSendPDF() {
  alert ("Enviando e-mail...");
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título do PDF
    doc.text('Histórico de Check-in/Check-out', 14, 15);

    // Captura os dados da tabela atual
    const table = document.getElementById('history-table');
    if (!table || table.rows.length === 0) {
      alert('A tabela está vazia.');
      return;
    }

    const headers = ['ID', 'Nome', 'Setor', 'Data', 'Entrada', 'Saída'];
    const tableRows = [];

    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const rowData = [];
      for (let j = 0; j < row.cells.length; j++) {
        rowData.push(row.cells[j].textContent.trim());
      }
      tableRows.push(rowData);
    }

    // Adiciona os dados da tabela ao PDF
    doc.autoTable({
      head: [headers],
      body: tableRows,
      startY: 20,
      theme: 'striped',
    });

    // Converte o PDF para Base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // Envia a requisição ao servidor
    const response = await fetch('https://horizon-e9r9.onrender.com/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'helius.empresa@gmail.com',
        subject: 'Relatório Mensal de Check-in/Check-out',
        text: 'Segue em anexo o relatório mensal de check-ins/check-outs.',
        filename: 'historico_checkin_checkout.pdf',
        pdfBase64: pdfBase64,
      }),
    });

    const result = await response.text();
    alert(result);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    alert('Erro ao enviar e-mail.');
  }
}

// Torna a função disponível globalmente
window.generateAndSendPDF = generateAndSendPDF;

// Cria um elemento <img>
const img = document.createElement('img');

// Define o caminho da imagem
img.src = 'img/lixeira_icone.png';

// Define atributos opcionais
img.alt = 'Icone de Lixeira'; // Texto alternativo
img.width = 30; // Largura da imagem
img.height = 30; // Altura da imagem

async function deleteCheckin(id) {
  if (confirm('Tem certeza que deseja excluir este check-in? Esta ação não pode ser desfeita.')) {
    try {
      await deleteDoc(doc(db, 'checkin', id));
      alert('Check-in excluído com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir check-in:', error);
      alert('Erro ao excluir o check-in. Tente novamente.');
    }
  }
}

// Função para limpar check-ins órfãos (sem funcionários correspondentes)
async function cleanupOrphanCheckins() {
  try {
    // Obter todos os IDs de funcionários na coleção 'employees'
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const employeeIds = employeesSnapshot.docs.map((doc) => doc.data().id);

    // Obter todos os registros de check-in
    const checkinSnapshot = await getDocs(collection(db, 'checkin'));

    checkinSnapshot.forEach(async (docSnap) => {
      const checkinData = docSnap.data();
      if (!employeeIds.includes(checkinData.id)) {
        // Se o ID do check-in não existir na coleção 'employees', exclui o check-in
        await deleteDoc(doc(db, 'checkin', docSnap.id));
        console.log(`Check-in órfão com ID ${docSnap.id} excluído.`);
      }
    });

    console.log('Limpeza de check-ins órfãos concluída.');
  } catch (error) {
    console.error('Erro ao limpar check-ins órfãos:', error);
  }
}

// Sincroniza os dados de checkin com os dados da coleção employees
async function syncCheckinWithEmployees() {
  try {
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const employeesData = {};

    // Cria um dicionário com os dados dos funcionários
    employeesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      employeesData[data.id] = data;
    });

    const checkinSnapshot = await getDocs(collection(db, 'checkin'));

    // Atualiza os registros de check-in se houver discrepâncias
    for (const checkinDoc of checkinSnapshot.docs) {
      const checkinData = checkinDoc.data();
      const employee = employeesData[checkinData.id];

      if (employee) {
        // Verifica se os dados estão diferentes antes de atualizar
        if (checkinData.name !== employee.name || checkinData.sector !== employee.sector) {
          await updateDoc(doc(db, 'checkin', checkinDoc.id), {
            name: employee.name,
            sector: employee.sector,
          });
        }
      }
    }
    console.log('Sincronização concluída com sucesso.');
  } catch (error) {
    console.error('Erro ao sincronizar dados de check-in com employees:', error);
  }
}

let isAscending = true; // Variável para controlar a ordem

// Função para carregar o histórico de check-ins/check-outs em tempo real
function loadHistory() {
  const tableBody = document.getElementById('history-table');
  tableBody.innerHTML = '';

  try {
    const checkinRef = collection(db, 'checkin');

    onSnapshot(checkinRef, async (querySnapshot) => {
      tableBody.innerHTML = ''; // Limpa a tabela antes de inserir novos dados

      // Verifica se há documentos na coleção
      if (querySnapshot.empty) {
        console.log('Nenhum check-in encontrado.');
        return;
      }

      // Converte os documentos em um array para facilitar a manipulação
      const checkins = [];
      querySnapshot.forEach((docSnapshot) => {
        checkins.push({ id: docSnapshot.id, data: docSnapshot.data() });
      });

      console.log('Check-ins carregados:', checkins); // Log para debug

      // Ordena os check-ins por data e hora com base no estado da variável isAscending
      checkins.sort((a, b) => {
        const dateTimeA = new Date(`${a.data.data} ${a.data.checkIn}`);
        const dateTimeB = new Date(`${b.data.data} ${b.data.checkIn}`);
        return isAscending ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
      });

      // Chama a função de filtro com os check-ins carregados
      filterAndDisplayCheckins(checkins);
    });
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
  }
}



// Converte a data do formato YYYY-MM-DD para DD/MM/YYYY
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Função para filtrar e exibir os check-ins
function filterAndDisplayCheckins(checkins) {
  const tableBody = document.getElementById('history-table');
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const searchInput = document.getElementById('search-input').value.trim().toLowerCase();

  // Filtra os check-ins com base nos critérios de data e nome/ID
  const filteredCheckins = checkins.filter(({ data }) => {
    const checkinDate = data.data; // Data do check-in no formato 'YYYY-MM-DD'
    const matchesDate =
      (!startDate || checkinDate >= startDate) &&
      (!endDate || checkinDate <= endDate);

    const matchesSearch =
      !searchInput ||
      data.id.toLowerCase().includes(searchInput) ||
      data.name.toLowerCase().includes(searchInput);

    return matchesDate && matchesSearch;
  });

  // Ordena os check-ins filtrados por data e hora (crescente ou decrescente)
  filteredCheckins.sort((a, b) => {
    const dateTimeA = new Date(`${a.data.data} ${a.data.checkIn}`);
    const dateTimeB = new Date(`${b.data.data} ${b.data.checkIn}`);
    return isAscending ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
  });

  // Insere os check-ins filtrados na tabela
  tableBody.innerHTML = '';
  filteredCheckins.forEach(({ id, data }) => {
    const formattedDate = formatDate(data.data); // Aplica a formatação da data

    const row = `
      <tr data-id="${id}">
        <td>${data.id}</td>
        <td>${data.name}</td>
        <td>${data.sector}</td>
        <td>${formattedDate}</td> <!-- Exibe a data formatada -->
        <td>${data.checkIn}</td>
        <td>${data.checkOut || ''}</td>
        <td>
          <button class="delete-button" onclick="deleteCheckin('${id}')">
            <img src="img/lixeira_icone.png" alt="Ícone de Lixeira" width="30" height="30">
          </button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

function toggleOrder() {
  isAscending = !isAscending; // Alterna a ordem
  loadHistory(); // Recarrega a tabela com a nova ordem
}

// Event listeners para os inputs de filtro
document.getElementById('start-date').addEventListener('change', loadHistory);
document.getElementById('end-date').addEventListener('change', loadHistory);
document.getElementById('search-input').addEventListener('input', loadHistory);

window.onload = async () => {
  try {
    await syncCheckinWithEmployees(); // Sincroniza os nomes dos funcionários
    await cleanupOrphanCheckins();    // Limpa os check-ins órfãos
    loadHistory();                    // Carrega o histórico após a sincronização
  } catch (error) {
    console.error('Erro durante a inicialização:', error);
  }
};


// Função para filtrar os dados pelo intervalo de datas
function filterByDate() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const tableRows = document.querySelectorAll('#history-table tr');

  if (!startDate || !endDate) {
    alert('Por favor, preencha ambas as datas para filtrar.');
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  tableRows.forEach((row) => {
    const dateCell = row.cells[3]; // A quarta coluna (Data)
    if (dateCell) {
      const rowDate = new Date(dateCell.textContent);
      if (rowDate >= start && rowDate <= end) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

// Função para filtrar os dados por ID ou Nome em tempo real
function filterByNameOrId() {
  const input = document.getElementById('search-input').value.toLowerCase();
  const tableRows = document.querySelectorAll('#history-table tr');

  tableRows.forEach((row) => {
    const idCell = row.cells[0].textContent.toLowerCase();
    const nameCell = row.cells[1].textContent.toLowerCase();

    if (idCell.includes(input) || nameCell.includes(input)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título do PDF
  doc.text("Histórico de Check-in/Check-out", 14, 15);

  // Coleta os dados da tabela
  const tableRows = [];
  const headers = ["ID", "Nome", "Setor", "Data", "Entrada", "Saída"];
  const rows = document.querySelectorAll("#history-table tr");

  rows.forEach((row) => {
    if (row.style.display !== "none") { // Apenas linhas visíveis (filtradas)
      const cells = row.querySelectorAll("td");
      const rowData = [];
      cells.forEach((cell) => {
        rowData.push(cell.textContent);
      });
      tableRows.push(rowData);
    }
  });

  // Adiciona a tabela ao PDF
  doc.autoTable({
    head: [headers],
    body: tableRows,
    startY: 20,
    theme: "striped",
  });

  // Salva o PDF com o nome especificado
  doc.save("historico_checkin_checkout.pdf");
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

window.loadHistory = loadHistory;
window.deleteCheckin = deleteCheckin;
window.filterByNameOrId = filterByNameOrId;
window.filterByDate = filterByDate;
window.exportToPDF = exportToPDF;
window.confirmLogout = confirmLogout;
window.toggleSidebar = toggleSidebar;
window.toggleOrder = toggleOrder;