const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criarAssinatura(negocioId, plano, valor) {
  const agora = new Date();
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());
  return prisma.assinatura.create({
    data: { negocioId, plano, valor, status: 'PENDENTE', periodoInicio: agora, periodoFim: fimMes }
  });
}

// Marca o pagamento como aprovado e ativa o plano por 30 dias. Seguro se chamado duas vezes.
async function processarPagamentoAprovado(pagamentoId) {
  const pagamento = await prisma.pagamento.findUnique({ where: { id: pagamentoId }, include: { assinatura: true } });
  if (!pagamento || pagamento.status === 'APROVADO') return false;

  // Renovar antes de acabar nao faz perder os dias que sobram (mesmo plano ainda activo)
  const negocio = await prisma.negocio.findUnique({
    where: { id: pagamento.negocioId },
    select: { plano: true, planoStatus: true, planoExpira: true }
  });
  const planoNovo = pagamento.assinatura?.plano || 'BASICO';
  let inicio = new Date();
  if (negocio && negocio.plano === planoNovo && negocio.planoStatus === 'ATIVO' && negocio.planoExpira && new Date(negocio.planoExpira) > inicio) {
    inicio = new Date(negocio.planoExpira);
  }
  const fimPeriodo = new Date(inicio);
  fimPeriodo.setDate(fimPeriodo.getDate() + 30);

  await prisma.$transaction([
    prisma.pagamento.update({ where: { id: pagamentoId }, data: { status: 'APROVADO', processadoEm: new Date() } }),
    ...(pagamento.assinaturaId ? [prisma.assinatura.update({ where: { id: pagamento.assinaturaId }, data: { status: 'ATIVA', periodoFim: fimPeriodo } })] : []),
    prisma.negocio.update({
      where: { id: pagamento.negocioId },
      data: { planoStatus: 'ATIVO', plano: planoNovo, planoExpira: fimPeriodo }
    })
  ]);
  return true;
}

// Plano pago que chegou ao fim e nao foi renovado: volta ao Basico gratis (nunca fica bloqueado).
// Os dados (marcacoes, clientes...) ficam todos; so deixam de estar disponiveis os recursos pagos.
// Se passar negocioId, so rebaixa esse negocio; sem argumentos rebaixa todos os que expiraram.
async function rebaixarExpirados(negocioId) {
  const agora = new Date();
  const filtro = { planoExpira: { lt: agora }, planoStatus: { not: 'SUSPENSO' }, ...(negocioId ? { id: negocioId } : {}) };
  const r = await prisma.negocio.updateMany({
    where: filtro,
    data: { plano: 'BASICO', planoStatus: 'ATIVO', planoExpira: null }
  });
  if (r.count) {
    await prisma.assinatura.updateMany({
      where: { status: 'ATIVA', periodoFim: { lt: agora }, ...(negocioId ? { negocioId } : {}) },
      data: { status: 'EXPIRADA' }
    });
  }
  return r.count;
}

module.exports = { criarAssinatura, processarPagamentoAprovado, rebaixarExpirados };
