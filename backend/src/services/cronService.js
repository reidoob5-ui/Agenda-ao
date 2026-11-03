const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { enviarWhatsAppAgendamento } = require('./whatsappService');
const prisma = new PrismaClient();

function iniciarCrons() {
  // Lembrete 24h antes — corre todos os dias às 08:00
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] A verificar lembretes 24h...');
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const inicio = new Date(amanha); inicio.setHours(0,0,0,0);
    const fim = new Date(amanha); fim.setHours(23,59,59,999);

    const agendamentos = await prisma.agendamento.findMany({
      where: { dataHora: { gte: inicio, lte: fim }, status: 'CONFIRMADO', lembrete24h: false },
      include: { cliente: true, servico: true, negocio: true, profissional: true }
    });

    for (const ag of agendamentos) {
      await enviarLembrete(ag, '24h');
      await prisma.agendamento.update({ where: { id: ag.id }, data: { lembrete24h: true } });
    }
    console.log(`[Cron] Lembretes 24h: ${agendamentos.length} enviados`);
  });

  // Lembrete 2h antes — corre de 30 em 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    const agora = new Date();
    const em2h = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
    const janela = new Date(em2h.getTime() + 30 * 60 * 1000);

    const agendamentos = await prisma.agendamento.findMany({
      where: { dataHora: { gte: em2h, lt: janela }, status: 'CONFIRMADO', lembrete2h: false },
      include: { cliente: true, servico: true, negocio: true, profissional: true }
    });

    for (const ag of agendamentos) {
      await enviarLembrete(ag, '2h');
      await prisma.agendamento.update({ where: { id: ag.id }, data: { lembrete2h: true } });
    }
  });

  // Expirar pagamentos — corre de 5 em 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    await prisma.pagamento.updateMany({
      where: { status: 'PENDENTE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRADO' }
    });
  });

  // Suspender negócios com plano expirado — corre diariamente à meia-noite
  cron.schedule('0 0 * * *', async () => {
    await prisma.negocio.updateMany({
      where: { planoExpira: { lt: new Date() }, planoStatus: 'ATIVO' },
      data: { planoStatus: 'EXPIRADO' }
    });
    console.log('[Cron] Planos expirados verificados');
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
  console.log(`[Lembrete ${tipo}] ${agendamento.id}: ${r.enviado ? 'WhatsApp enviado' : `WhatsApp nao enviado (${r.motivo})`}`);
}

module.exports = { iniciarCrons };
