import { auth } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// Verifica se o usuário está logado
function checkAuthStatus() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Se não estiver logado, redireciona para a página de login
      window.location.href = 'login.html';
    } else {
      // Se estiver logado, exibe o corpo da página
      document.body.style.display = 'block';
    }
  });
}

// Chama a função de verificação de autenticação ao carregar o script
checkAuthStatus();

// Função para logout com confirmação
function confirmLogout() {
  if (confirm('Tem certeza de que deseja sair?')) {
    signOut(auth)
      .then(() => {
        alert('Logout realizado com sucesso.');
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error('Erro ao sair:', error);
        alert('Erro ao sair. Tente novamente.');
      });
  }
}

// Exporta a função para uso nos botões de logout
window.confirmLogout = confirmLogout;

