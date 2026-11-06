// Envio de mensagens pela API oficial do WhatsApp (Meta Cloud API).
// So envia se WHATSAPP_TOKEN e WHATSAPP_PHONE_ID estiverem definidos (senao fica desligado).
// Cada mensagem custa dinheiro (paga a Meta), por isso:
//   - so os planos em WHATSAPP_PLANOS (por defeito PREMIUM) podem usar
//   - cada negocio tem um limite mensal (WHATSAPP_LIMITE_MES, por defeito 500)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const T = require('../utils/tempo');

// Codigo de idioma dos modelos (a Meta exige o modelo aprovado NESSE idioma). pt_BR pode ser definido por env.
const CODIGO_IDIOMA = {
  pt: process.env.WHATSAPP_IDIOMA_PT || 'pt_PT',
  en: process.env.WHATSAPP_IDIOMA_EN || 'en',
  es: process.env.WHATSAPP_IDIOMA_ES || 'es',
  fr: process.env.WHATSAPP_IDIOMA_FR || 'fr',
};

function configurado() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

function planosPermitidos() {
  return (process.env.WHATSAPP_PLANOS || 'PREMIUM')
    .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

function limiteMensal() {
  const n = parseInt(process.env.WHATSAPP_LIMITE_MES);
  return n > 0 ? n : 500;
}

// Numero com + ou 00 fica como esta; numero local recebe o indicativo do pais do negocio (pelo fuso).
// Ex.: 923456789 (Luanda) -> 244923456789 ; devolve '' se o numero nao parecer valido
function normalizarTelefone(tel, fuso) {
  const bruto = String(tel || '').trim();
  const internacional = bruto.startsWith('+') || bruto.startsWith('00');
  let d = bruto.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  const ddi = T.ddiDoFuso(fuso);
  if (!internacional && ddi && !d.startsWith(ddi)) d = ddi + d.replace(/^0+/, '');
  else if (!internacional && !ddi && d.length === 9 && d.startsWith('9')) d = '244' + d; // compatibilidade
  return d.length >= 11 && d.length <= 15 ? d : '';
}

// A Meta recusa parametros vazios, com quebras de linha ou tabs
function limparParametro(valor) {
  const t = String(valor ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
  return (t || '-').slice(0, 200);
}

function formatarQuando(dataHora, fuso, idioma) {
  return T.formatarQuando(dataHora, fuso || T.FUSO_PADRAO, idioma || 'pt');
}

// Chama a API da Meta. Nunca lanca erro: devolve { ok, id } ou { ok:false, erro }
async function enviarTemplate({ para, template, parametros = [], idioma = 'pt_PT' }) {
  const versao = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const url = `https://graph.facebook.com/${versao}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const corpo = {
    messaging_product: 'whatsapp',
    to: para,
    type: 'template',
    template: {
      name: template,
      language: { code: idioma },
      ...(parametros.length ? {
        components: [{ type: 'body', parameters: parametros.map(p => ({ type: 'text', text: limparParametro(p) })) }]
      } : {}),
    },
  };

  const controlo = new AbortController();
  const timer = setTimeout(() => controlo.abort(), 15000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: controlo.signal,
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = dados.error || {};
      return { ok: false, erro: `${e.message || 'Erro da Meta'} (código ${e.code ?? r.status})` };
    }
    return { ok: true, id: dados.messages?.[0]?.id || null };
  } catch (err) {
    return { ok: false, erro: err.name === 'AbortError' ? 'A Meta demorou demasiado a responder' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function registar(negocioId, agendamentoId, tipo, status, erro) {
  try {
    await prisma.mensagemWhatsapp.create({
      data: { negocioId, agendamentoId: agendamentoId || null, tipo, status, erro: erro ? String(erro).slice(0, 300) : null },
    });
  } catch (e) { console.error('[WhatsApp] nao foi possivel registar:', e.message); }
}

// tipo: 'CONFIRMACAO' | 'LEMBRETE_24H' | 'LEMBRETE_2H'
// agendamento tem de incluir cliente e servico; negocio precisa de id, nome, plano, planoStatus
async function enviarWhatsAppAgendamento({ agendamento, negocio, tipo }) {
  try {
    if (!configurado()) return { enviado: false, motivo: 'NAO_CONFIGURADO' };
    if (negocio.planoStatus !== 'ATIVO' || !planosPermitidos().includes(negocio.plano)) {
      return { enviado: false, motivo: 'PLANO' };
    }
    const para = normalizarTelefone(agendamento.cliente?.telefone, negocio.fusoHorario);
    if (!para) return { enviado: false, motivo: 'TELEFONE_INVALIDO' };

    const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
    const usadas = await prisma.mensagemWhatsapp.count({
      where: { negocioId: negocio.id, status: 'ENVIADA', criadoEm: { gte: inicioMes } },
    });
    if (usadas >= limiteMensal()) return { enviado: false, motivo: 'LIMITE' };

    const template = tipo === 'CONFIRMACAO'
      ? (process.env.WHATSAPP_TEMPLATE_CONFIRMACAO || 'confirmacao_marcacao')
      : (process.env.WHATSAPP_TEMPLATE_LEMBRETE || 'lembrete_marcacao');
    const { data, hora } = formatarQuando(agendamento.dataHora, negocio.fusoHorario, negocio.idioma);
    const primeiroNome = String(agendamento.cliente?.nome || '').trim().split(/\s+/)[0];

    const r = await enviarTemplate({
      para,
      template,
      idioma: CODIGO_IDIOMA[negocio.idioma] || CODIGO_IDIOMA.pt,
      parametros: [primeiroNome, agendamento.servico?.nome, negocio.nome, data, hora],
    });
    await registar(negocio.id, agendamento.id, tipo, r.ok ? 'ENVIADA' : 'FALHOU', r.erro);
    if (!r.ok) console.error(`[WhatsApp] falhou (${tipo}): ${r.erro}`);
    return r.ok ? { enviado: true, id: r.id } : { enviado: false, motivo: 'ERRO_META', erro: r.erro };
  } catch (err) {
    console.error('[WhatsApp] erro inesperado:', err.message);
    return { enviado: false, motivo: 'ERRO' };
  }
}

module.exports = {
  configurado, planosPermitidos, limiteMensal, normalizarTelefone, limparParametro,
  enviarTemplate, enviarWhatsAppAgendamento,
};
