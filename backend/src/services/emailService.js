const nodemailer = require('nodemailer');

// Assinatura da empresa dona do AgendaAO (email de suporte pode ser trocado com EMAIL_SUPORTE no Render)
const EMAIL_SUPORTE = process.env.EMAIL_SUPORTE || 'agendaaosuporte@gmail.com';
const RODAPE = `<p style="text-align:center;font-size:11px;color:#94a3b8;margin:24px 0 0;border-top:1px solid #f1f5f9;padding-top:12px;">Enviado por <strong>AgendaAO</strong> · um produto da <strong>Ada Lovelace Technologies</strong><br>Suporte: ${EMAIL_SUPORTE}</p>`;

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
      ${RODAPE}
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


/**
 * Envia e-mail de confirmacao ao cliente quando o negocio aprova o agendamento
 */
async function enviarEmailConfirmacao(negocio, agendamento) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  if (!agendamento.cliente?.email) return;

  const transporter = obterTransporter();
  const remetente = process.env.EMAIL_FROM || `"AgendaAO" <${process.env.SMTP_USER}>`;
  const dataFmt = new Date(agendamento.dataHora).toLocaleDateString('pt-PT');
  const horaFmt = new Date(agendamento.dataHora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const valorFmt = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(agendamento.preco);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">✅ Agendamento Confirmado!</h2>
      <p style="color: #64748b; font-size: 14px;">Olá <strong>${agendamento.cliente.nome}</strong>, o teu agendamento em <strong>${negocio.nome}</strong> foi aprovado.</p>
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Serviço</td><td style="color: #334155; font-size: 14px; font-weight: bold; text-align: right;">${agendamento.servico.nome}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Profissional</td><td style="color: #334155; font-size: 14px; text-align: right;">${agendamento.profissional.nome}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 12px; padding: 6px 0;">Data & Hora</td><td style="color: #334155; font-size: 14px; font-weight: bold; text-align: right;">${dataFmt} às ${horaFmt}</td></tr>
          <tr style="border-top: 1px solid #d1fae5;"><td style="color: #94a3b8; font-size: 12px; padding: 10px 0 0 0;">Valor</td><td style="color: #16a34a; font-size: 18px; font-weight: bold; text-align: right;">${valorFmt}</td></tr>
        </table>
      </div>
      <p style="font-size: 13px; color: #64748b;">Em caso de dúvida, contacta o negócio: <strong>${negocio.email || ''}</strong></p>
      ${RODAPE}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: remetente,
      to: agendamento.cliente.email,
      subject: `✅ Agendamento confirmado — ${negocio.nome} — ${dataFmt} às ${horaFmt}`,
      html,
    });
    console.log(`✉️ [EmailService] Confirmação enviada ao cliente ${agendamento.cliente.email}`);
  } catch (error) {
    console.error('❌ [EmailService] Erro ao enviar email de confirmacao:', error.message);
  }
}

const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Lembrete por e-mail ao cliente (planos Profissional e Premium). tipo: '24h' | '2h'
 */
async function enviarEmailLembrete(negocio, agendamento, tipo) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return { enviado: false, motivo: 'SMTP' };
  if (!agendamento.cliente?.email) return { enviado: false, motivo: 'SEM_EMAIL' };

  const fuso = 'Africa/Luanda';
  const d = new Date(agendamento.dataHora);
  const dataFmt = d.toLocaleDateString('pt-PT', { timeZone: fuso });
  const horaFmt = d.toLocaleTimeString('pt-PT', { timeZone: fuso, hour: '2-digit', minute: '2-digit' });
  const quando = tipo === '2h' ? 'daqui a pouco' : 'amanhã';
  const remetente = process.env.EMAIL_FROM || `"AgendaAO" <${process.env.SMTP_USER}>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0d9488; margin-bottom: 8px;">⏰ Lembrete da tua marcação</h2>
      <p style="color: #64748b; font-size: 14px;">Olá <strong>${escapar(agendamento.cliente.nome)}</strong>, a tua marcação em <strong>${escapar(negocio.nome)}</strong> é ${quando}.</p>
      <div style="background-color: #f0fdfa; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #99f6e4;">
        <p style="margin: 4px 0; color: #334155;"><strong>${escapar(agendamento.servico?.nome)}</strong></p>
        <p style="margin: 4px 0; color: #334155;">${dataFmt} às <strong>${horaFmt}</strong></p>
        ${agendamento.profissional?.nome ? `<p style="margin: 4px 0; color: #64748b; font-size: 13px;">Com ${escapar(agendamento.profissional.nome)}</p>` : ''}
      </div>
      <p style="font-size: 13px; color: #64748b;">Não podes ir? Avisa o negócio${negocio.telefone ? `: <strong>${escapar(negocio.telefone)}</strong>` : ''}.</p>
      ${RODAPE}
    </div>`;

  try {
    await obterTransporter().sendMail({
      from: remetente,
      to: agendamento.cliente.email,
      subject: `⏰ Lembrete — ${negocio.nome} — ${dataFmt} às ${horaFmt}`,
      html,
    });
    return { enviado: true };
  } catch (error) {
    console.error('❌ [EmailService] Erro ao enviar lembrete:', error.message);
    return { enviado: false, motivo: 'ERRO' };
  }
}

module.exports = {
  enviarEmailLembrete,
  enviarEmailNovoAgendamento,
  enviarEmailConfirmacao,
};
