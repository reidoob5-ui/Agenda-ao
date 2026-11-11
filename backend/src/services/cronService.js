const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { enviarWhatsAppAgendamento } = require('./whatsappService');
const { enviarEmailLembrete } = require('./emailService');
const { temRecurso } = require('../utils/planos');
const prisma = new PrismaClient();

function iniciarCrons() {
  // Lembretes — corre de 10 em 10 minutos e funciona em qualquer fuso horario:
  // olha para o instante real das marcacoes, nao para a hora do servidor.
  //  - "24h": marcacoes que comecam daqui a 12h a 24h
  //  - "2h":  marcacoes que comecam daqui a 30 min a 2h
  // Cada lembrete e enviado uma unica vez (flags lembrete24h / lembrete2h).
  cron.schedule('*/10 * * * *', async () => {
    try {
      const agora = Date.now();
      const H = 60 * 60 * 1000;
      const incluir = { cliente: true, servico: true, negocio: true, profissional: true };

      const de24 = await prisma.agendamento.findMany({
        where: { status: 'CONFIRMADO', lembrete24h: false, dataHora: { gt: new Date(agora + 12 * H), lte: new Date(agora + 24 * H) } },
        include: incluir
      });
      for (const ag of de24) {
        await enviarLembrete(ag, '24h');
        await prisma.agendamento.update({ where: { id: ag.id }, data: { lembrete24h: true } });
      }

      const de2 = await prisma.agendamento.findMany({
        where: { status: 'CONFIRMADO', lembrete2h: false, dataHora: { gt: new Date(agora + 0.5 * H), lte: new Date(agora + 2 * H) } },
        include: incluir
      });
      for (const ag of de2) {
        await enviarLembrete(ag, '2h');
        await prisma.agendamento.update({ where: { id: ag.id }, data: { lembrete2h: true } });
      }
      if (de24.length || de2.length) console.log(`[Cron] Lembretes: ${de24.length} (24h) e ${de2.length} (2h)`);
    } catch (e) { console.error('[Cron] lembretes:', e.message); }
  });

  // Expirar pagamentos — corre de 5 em 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    await prisma.pagamento.updateMany({
      where: { status: 'PENDENTE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRADO' }
    });
  });

  // Plano pago expirado volta ao Basico gratis — corre de hora a hora
  cron.schedule('5 * * * *', async () => {
    try {
      const n = await require('./assinaturas').rebaixarExpirados();
      if (n) console.log(`[Cron] ${n} negocio(s) voltaram ao plano Basico (plano expirado)`);
    } catch (e) { console.error('[Cron] rebaixar planos:', e.message); }
  });

  console.log('[Cron] Todos os jobs iniciados');
}

async function enviarLembrete(agendamento, tipo) {
  // WhatsApp oficial (Meta). So envia se estiver configurado e o plano incluir WhatsApp.
  const r = await enviarWhatsAppAgendamento({
    agendamento,
    negocio: agendamento.negocio,
    tipo: tipo === '24h' ? 'LEMBRETE_24H' : 'LEMBRETE_2H'
  });
  // Email ao cliente (Profissional e Premium)
  let email = 'plano';
  if (agendamento.negocio?.planoStatus === 'ATIVO' && temRecurso(agendamento.negocio.plano, 'emailLembretes')) {
    const e = await enviarEmailLembrete(agendamento.negocio, agendamento, tipo);
    email = e.enviado ? 'enviado' : `nao enviado (${e.motivo})`;
  }
  console.log(`[Lembrete ${tipo}] ${agendamento.id}: email ${email}`);
  console.log(`[Lembrete ${tipo}] ${agendamento.id}: ${r.enviado ? 'WhatsApp enviado' : `WhatsApp nao enviado (${r.motivo})`}`);
}

module.exports = { iniciarCrons };
