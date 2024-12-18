const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
require('dotenv').config();

// Firebase Admin SDK para acessar Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Configuração do Nodemailer com SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Função para gerar o PDF do histórico
function generatePDF(checkins, title = 'Histórico de Check-in/Check-out') {
  console.log('Gerando PDF com os check-ins:', checkins);

  const doc = new jsPDF();
  doc.text(title, 14, 15);

  const headers = ['ID', 'Nome', 'Setor', 'Data', 'Entrada', 'Saída'];
  const tableRows = checkins.map((checkin) => [
    checkin.id,
    checkin.name,
    checkin.sector,
    checkin.data,
    checkin.checkIn,
    checkin.checkOut || '',
  ]);

  doc.autoTable({
    head: [headers],
    body: tableRows,
    startY: 20,
    theme: 'striped',
  });

  console.log('PDF gerado com sucesso.');

  return doc.output('datauristring').split(',')[1];
}

// Rota para enviar o e-mail manualmente com PDF em anexo
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, pdfBase64 } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      attachments: [
        {
          filename: 'historico_checkin_checkout.pdf',
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('E-mail enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).send('Erro ao enviar e-mail.');
  }
});

// Função para buscar os check-ins do mês anterior no Firestore
async function fetchCheckinsForLastMonth() {
  const now = new Date();
  now.setDate(1); // Define o dia atual como 1º do mês
  now.setHours(0, 0, 0, 0);

  // Primeiro dia do mês anterior
  const startOfLastMonth = new Date(now);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  // Último dia do mês anterior
  const endOfLastMonth = new Date(startOfLastMonth.getFullYear(), startOfLastMonth.getMonth() + 1, 0);

  console.log(`Buscando check-ins de ${startOfLastMonth.toISOString().split('T')[0]} até ${endOfLastMonth.toISOString().split('T')[0]}`);

  try {
    const snapshot = await db
      .collection('checkin')
      .where('data', '>=', startOfLastMonth.toISOString().split('T')[0])
      .where('data', '<=', endOfLastMonth.toISOString().split('T')[0])
      .get();

    const checkins = [];
    snapshot.forEach((doc) => {
      checkins.push(doc.data());
    });

    console.log('Check-ins encontrados:', checkins);
    return checkins;
  } catch (error) {
    console.error('Erro ao buscar check-ins:', error);
    throw new Error('Erro ao buscar check-ins do Firestore.');
  }
}

// Rota para enviar o e-mail automaticamente com o cron-job.org
app.post('/send-monthly-email', async (req, res) => {
  try {
    console.log('Buscando check-ins do mês anterior...');
    const checkins = await fetchCheckinsForLastMonth();

    if (checkins.length === 0) {
      console.log('Nenhum check-in encontrado para o mês anterior.');
      return res.status(200).send('Nenhum check-in encontrado para o mês anterior.');
    }

    console.log('Gerando PDF...');
    const pdfBase64 = generatePDF(checkins, 'Histórico de Check-in/Check-out - Mês Anterior');

    console.log('Preparando e-mail...');
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'helius.empresa@gmail.com',
      subject: 'Relatório Mensal de Check-in/Check-out',
      text: 'Segue em anexo o relatório mensal de check-ins/check-outs.',
      attachments: [
        {
          filename: 'historico_checkin_checkout_mensal.pdf',
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    };

    console.log('Enviando e-mail...');
    await transporter.sendMail(mailOptions);
    console.log('E-mail mensal enviado com sucesso!');
    res.status(200).send('E-mail mensal enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar e-mail mensal:', error);
    res.status(500).send('Erro ao enviar e-mail mensal.');
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
