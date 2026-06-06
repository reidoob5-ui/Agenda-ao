const nodemailer = require('nodemailer');

// Configurar o transporter
const obterTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Envia um e-mail ao dono do negócio notificando-o de uma nova marcação
 */
async function enviarEmailNovoAgendamento(negocio, agendamento) {
  // Se SMTP não estiver configurado, não envia
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ [EmailService] SMTP_USER ou SMTP_PASS não configurados. Salto de notificação por e-mail.');
    return;
  }

  const transporter = obterTransporter();
  const remetente = process.env.EMAIL_FROM || `"AgendaAO" <${process.env.SMTP_USER}>`;

  const dataFmt = new Date(agendamento.dataHora).toLocaleDateString('pt-PT');
  const horaFmt = new Date(agendamento.dataHora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const valorFmt = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(agendamento.preco);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">Novo Agendamento Confirmado!</h2>
      <p style="color: #64748b; font-size: 14px; margin-top: 0;">Olá, tens um novo agendamento marcado no teu painel <strong>${negocio.nome}</strong>.</p>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Cliente</td>
            <td style="color: #334155; font-size: 14px; font-weight: bold; text-align: right; padding: 6px 0;">${agendamento.cliente.nome}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Contacto</td>
            <td style="color: #334155; font-size: 14px; text-align: right; padding: 6px 0;">${agendamento.cliente.telefone}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Serviço</td>
            <td style="color: #334155; font-size: 14px; text-align: right; padding: 6px 0;">${agendamento.servico.nome}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Profissional</td>
            <td style="color: #334155; font-size: 14px; text-align: right; padding: 6px 0;">${agendamento.profissional.nome}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Data & Hora</td>
            <td style="color: #334155; font-size: 14px; font-weight: bold; text-align: right; padding: 6px 0;">${dataFmt} às ${horaFmt}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="color: #94a3b8; font-size: 12px; padding: 10px 0 0 0;">Valor</td>
            <td style="color: #4f46e5; font-size: 18px; font-weight: bold; text-align: right; padding: 10px 0 0 0;">${valorFmt}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Ver no Painel</a>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: remetente,
      to: negocio.email, // Envia para o email do negócio cadastrado
      subject: `[Novo Agendamento] ${agendamento.cliente.nome} - ${dataFmt} às ${horaFmt}`,
      html,
    });
    console.log(`✉️ [EmailService] Notificação enviada com sucesso para ${negocio.email}`);
  } catch (error) {
    console.error('❌ [EmailService] Erro ao enviar email:', error.message);
  }
}

module.exports = {
  enviarEmailNovoAgendamento,
};
