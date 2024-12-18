import { auth, db } from './firebaseConfig.js';
import { sendPasswordResetEmail, onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (messageDiv) {
    messageDiv.style.display = 'block';
    messageDiv.textContent = message;
    messageDiv.style.color = 'red';
  }
}

// Função de Login
document.getElementById('signInForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  console.log('Tentando fazer login com:', email);

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('Login bem-sucedido:', userCredential.user);
      window.location.href = 'home.html';
    })
    .catch((error) => {
      console.error('Erro ao fazer login:', error);
      showMessage('Email ou senha incorretos', 'signInMessage');
    });
});

// Captura o evento de pressionar Enter
document.getElementById('email').addEventListener('keydown', handleEnterKey);
document.getElementById('password').addEventListener('keydown', handleEnterKey);

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('signInForm').dispatchEvent(new Event('submit'));
  }
}

// Verificar Autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Usuário autenticado:', user.email);
  } else {
    console.log('Nenhum usuário autenticado.');
  }
});

// Função para mostrar a seção de redefinição de senha
function showForgotPasswordSection() {
  document.getElementById('signInForm').classList.add('hidden');
  document.getElementById('forgot-password-section').classList.remove('hidden');
}

// Função para voltar à seção de login
function goBackToLogin() {
  document.getElementById('forgot-password-section').classList.add('hidden');
  document.getElementById('signInForm').classList.remove('hidden');
}

// Função para enviar o e-mail de redefinição de senha
async function sendPasswordReset() {
  const emailInput = document.getElementById('reset-email');
  const email = emailInput.value.trim();

  if (!email) {
    alert('Por favor, insira um e-mail válido.');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert('Link para redefinição de senha enviado com sucesso!');
    emailInput.value = ''; 
    goBackToLogin();
  } catch (error) {
    console.error('Erro ao enviar o e-mail de redefinição:', error);
    alert('Erro ao enviar o e-mail de redefinição: ' + error.message);
  }
}

// Função para validar login
function validateLogin() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      emailInput.value = '';   
      passwordInput.value = ''; 
      window.location.href = 'home.html';
    })
    .catch((error) => {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login: ' + error.message);
    });
}

// Exporta funções para uso no HTML
window.showForgotPasswordSection = showForgotPasswordSection;
window.sendPasswordReset = sendPasswordReset;
window.validateLogin = validateLogin;
window.goBackToLogin = goBackToLogin;
