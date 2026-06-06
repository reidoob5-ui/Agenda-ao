const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const publicKey = process.env.VAPID_PUBLIC_KEY || 'BKqPGek5xVx82oHlQnEk_eRxMswnOi37NY3ofy3tOtqM5YNFiEDjJa3y3afoFaSeIMghQYCeAGdxCBfPyLHbq-s';
const privateKey = process.env.VAPID_PRIVATE_KEY || 'nmHMp1RX8BMiHalZlP-kowVuz7yki9xPrpWcdauhrrc';

webpush.setVapidDetails(
  'mailto:agendaaosuporte@gmail.com',
  publicKey,
  privateKey
);

/**
 * Dispara notificação push para todos os navegadores subscritos de um negócio
 */
async function enviarPushNovoAgendamento(negocioId, agendamento) {
  try {
    const subscricoes = await prisma.subscricaoPush.findMany({
      where: { negocioId }
    });

    if (subscricoes.length === 0) {
      console.log(`ℹ️ [PushService] Nenhuma subscrição ativa para o negócio ${negocioId}`);
      return;
    }

    const dataFmt = new Date(agendamento.dataHora).toLocaleDateString('pt-PT');
    const horaFmt = new Date(agendamento.dataHora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const payload = JSON.stringify({
      title: 'Novo Agendamento! 📅',
      body: `${agendamento.cliente.nome} marcou ${agendamento.servico.nome} para dia ${dataFmt} às ${horaFmt}`,
      url: '/dashboard'
    });

    const promessas = subscricoes.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, payload)
        .catch(async (err) => {
          // Se o token expirou ou foi removido do browser, limpar da BD
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🗑️ [PushService] Removendo subscrição expirada: ${sub.id}`);
            await prisma.subscricaoPush.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.error(`❌ [PushService] Erro ao disparar push na subscrição ${sub.id}:`, err.message);
          }
        });
    });

    await Promise.all(promessas);
    console.log(`🔔 [PushService] Disparados pushes com sucesso para o negócio ${negocioId}`);
  } catch (error) {
    console.error('❌ [PushService] Erro ao disparar notificações push:', error.message);
  }
}

module.exports = {
  enviarPushNovoAgendamento,
  publicKey
};
