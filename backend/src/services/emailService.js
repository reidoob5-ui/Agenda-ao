const nodemailer = require('nodemailer');
const { tr, escapar } = require('../utils/textos');
const T = require('../utils/tempo');

// Assinatura da empresa dona do Agenda Aqui (email de suporte pode ser trocado com EMAIL_SUPORTE no Render)
const EMAIL_SUPORTE = process.env.EMAIL_SUPORTE || 'agendaaosuporte@gmail.com';

const smtpConfigurado = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

const obterTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para outras portas
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const remetente = () => process.env.EMAIL_FROM || `"Agenda Aqui" <${process.env.SMTP_USER}>`;

function rodape(idioma) {
  return `<p style="text-align:center;font-size:11px;color:#94a3b8;margin:24px 0 0;border-top:1px solid #f1f5f9;padding-top:12px;">${tr(idioma, 'rodape')}<br>${tr(idioma, 'suporte')}: ${escapar(EMAIL_SUPORTE)}</p>`;
}

// Data, hora e valor no fuso, idioma e moeda do negocio
function formatar(negocio, agendamento) {
  const idioma = negocio.idioma || 'pt';
  const fuso = negocio.fusoHorario || T.FUSO_PADRAO;
  const { data, hora } = T.formatarQuando(agendamento.dataHora, fuso, idioma);
  let valor;
  try {
    valor = new Intl.NumberFormat(T.LOCALES[idioma] || 'pt-PT', {
      style: 'currency', currency: negocio.moeda || 'AOA', minimumFractionDigits: 0, maximumFractionDigits: 2
    }).format(agendamento.preco);
  } catch { valor = String(agendamento.preco); }
  return { idioma, fuso, data, hora, valor };
}

function linhaSessao(idioma, agendamento) {
  if (!agendamento.linkSessao) return '';
  return `<div style="text-align:center;margin:20px 0;">
    <a href="${escapar(agendamento.linkSessao)}" style="background-color:#0d9488;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">🎥 ${tr(idioma, 'entrar')}</a>
  </div>`;
}

const caixa = (corpo) => `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #f1f5f9;border-radius:12px;padding:24px;">${corpo}</div>`;
const linha = (rotulo, valor, forte) => `<tr><td style="color:#94a3b8;font-size:12px;padding:6px 0;">${rotulo}</td><td style="color:#334155;font-size:14px;${forte ? 'font-weight:bold;' : ''}text-align:right;padding:6px 0;">${valor}</td></tr>`;

async function enviar(para, assunto, html) {
  try {
    await obterTransporter().sendMail({ from: remetente(), to: para, subject: assunto, html });
    return { enviado: true };
  } catch (error) {
    console.error('❌ [EmailService] Erro ao enviar email:', error.message);
    return { enviado: false, motivo: 'ERRO' };
  }
}

/** Email ao dono do negocio: nova marcacao */
async function enviarEmailNovoAgendamento(negocio, agendamento) {
  if (!smtpConfigurado()) {
    console.log('⚠️ [EmailService] SMTP_USER ou SMTP_PASS não configurados. Salto de notificação por e-mail.');
    return { enviado: false, motivo: 'SMTP' };
  }
  const { idioma, data, hora, valor, fuso } = formatar(negocio, agendamento);
  const html = caixa(`
    <h2 style="color:#4f46e5;margin-bottom:8px;">${tr(idioma, 'novoTitulo')}</h2>
    <p style="color:#64748b;font-size:14px;margin-top:0;">${tr(idioma, 'novoIntro', { negocio: negocio.nome })}</p>
    <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;"><table style="width:100%;border-collapse:collapse;">
      ${linha(tr(idioma, 'cliente'), escapar(agendamento.cliente.nome), true)}
      ${linha(tr(idioma, 'contacto'), escapar(agendamento.cliente.telefone))}
      ${linha(tr(idioma, 'servico'), escapar(agendamento.servico.nome) + (agendamento.servico.online ? ` · ${tr(idioma, 'online')}` : ''))}
      ${linha(tr(idioma, 'profissional'), escapar(agendamento.profissional.nome))}
      ${linha(`${tr(idioma, 'quando')} (${tr(idioma, 'fuso', { fuso: fuso.split('/').pop().replace(/_/g, ' ') })})`, `${data} ${hora}`, true)}
      ${linha(tr(idioma, 'valor'), valor, true)}
    </table></div>
    <div style="text-align:center;margin-top:24px;">
      <a href="${escapar(process.env.FRONTEND_URL || '')}/dashboard" style="background-color:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">${tr(idioma, 'verPainel')}</a>
    </div>${rodape(idioma)}`);
  const r = await enviar(negocio.email, tr(idioma, 'assuntoNovo', { cliente: agendamento.cliente.nome, data, hora }, false), html);
  if (r.enviado) console.log(`✉️ [EmailService] Notificação enviada para ${negocio.email}`);
  return r;
}

/** Email ao cliente: marcacao confirmada (com link da consulta online, se houver) */
async function enviarEmailConfirmacao(negocio, agendamento) {
  if (!smtpConfigurado() || !agendamento.cliente?.email) return { enviado: false, motivo: 'SMTP_OU_EMAIL' };
  const { idioma, data, hora, valor, fuso } = formatar(negocio, agendamento);
  const html = caixa(`
    <h2 style="color:#16a34a;margin-bottom:8px;">${tr(idioma, 'confTitulo')}</h2>
    <p style="color:#64748b;font-size:14px;">${tr(idioma, 'confIntro', { cliente: agendamento.cliente.nome, negocio: negocio.nome })}</p>
    <div style="background-color:#f0fdf4;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #bbf7d0;"><table style="width:100%;border-collapse:collapse;">
      ${linha(tr(idioma, 'servico'), escapar(agendamento.servico.nome), true)}
      ${linha(tr(idioma, 'profissional'), escapar(agendamento.profissional.nome))}
      ${linha(`${tr(idioma, 'quando')} (${tr(idioma, 'fuso', { fuso: fuso.split('/').pop().replace(/_/g, ' ') })})`, `${data} ${hora}`, true)}
      ${linha(tr(idioma, 'valor'), valor, true)}
    </table></div>
    ${linhaSessao(idioma, agendamento)}
    <p style="font-size:13px;color:#64748b;">${tr(idioma, 'duvida')}: <strong>${escapar(negocio.email || '')}</strong></p>${rodape(idioma)}`);
  return enviar(agendamento.cliente.email, tr(idioma, 'assuntoConf', { negocio: negocio.nome, data, hora }, false), html);
}

/** Lembrete por email ao cliente (planos Profissional e Premium). tipo: '24h' | '2h' */
async function enviarEmailLembrete(negocio, agendamento, tipo) {
  if (!smtpConfigurado()) return { enviado: false, motivo: 'SMTP' };
  if (!agendamento.cliente?.email) return { enviado: false, motivo: 'SEM_EMAIL' };
  const { idioma, data, hora, fuso } = formatar(negocio, agendamento);
  const html = caixa(`
    <h2 style="color:#0d9488;margin-bottom:8px;">${tr(idioma, 'lemTitulo')}</h2>
    <p style="color:#64748b;font-size:14px;">${tr(idioma, tipo === '2h' ? 'lemIntro2' : 'lemIntro24', { cliente: agendamento.cliente.nome, negocio: negocio.nome })}</p>
    <div style="background-color:#f0fdfa;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #99f6e4;">
      <p style="margin:4px 0;color:#334155;"><strong>${escapar(agendamento.servico?.nome)}</strong></p>
      <p style="margin:4px 0;color:#334155;">${data} <strong>${hora}</strong> <span style="color:#94a3b8;font-size:12px;">(${tr(idioma, 'fuso', { fuso: fuso.split('/').pop().replace(/_/g, ' ') })})</span></p>
      ${agendamento.profissional?.nome ? `<p style="margin:4px 0;color:#64748b;font-size:13px;">${tr(idioma, 'com')} ${escapar(agendamento.profissional.nome)}</p>` : ''}
    </div>
    ${linhaSessao(idioma, agendamento)}
    <p style="font-size:13px;color:#64748b;">${tr(idioma, 'naoPodes')}${negocio.telefone ? `: <strong>${escapar(negocio.telefone)}</strong>` : ''}.</p>${rodape(idioma)}`);
  return enviar(agendamento.cliente.email, tr(idioma, 'assuntoLem', { negocio: negocio.nome, data, hora }, false), html);
}

module.exports = { enviarEmailLembrete, enviarEmailNovoAgendamento, enviarEmailConfirmacao };
