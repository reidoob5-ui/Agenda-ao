// Funcoes partilhadas de agenda: conflitos de horario e limites dos planos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Limites de cada plano (null = ilimitado)
const LIMITES = {
  BASICO:       { agendamentosMes: 50,   profissionais: 1 },
  PROFISSIONAL: { agendamentosMes: null, profissionais: 5 },
  PREMIUM:      { agendamentosMes: null, profissionais: null },
};

function limitesDoPlano(plano) {
  return LIMITES[plano] || LIMITES.BASICO;
}

// Marcacoes feitas no mes actual (as canceladas nao contam)
async function contarAgendamentosDoMes(negocioId) {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  return prisma.agendamento.count({
    where: {
      negocioId,
      status: { not: 'CANCELADO' },
      criadoEm: { gte: inicio, lt: fim },
    },
  });
}

// Devolve { limite, usados, atingido } para as marcacoes do mes
async function usoAgendamentos(negocioId, plano) {
  const limite = limitesDoPlano(plano).agendamentosMes;
  const usados = await contarAgendamentosDoMes(negocioId);
  return { limite, usados, atingido: limite !== null && usados >= limite };
}

// Dois horarios sobrepoem-se quando: inicioExistente < fimNovo E fimExistente > inicioNovo.
// Procura os que comecam antes do fim do novo e que ainda podem estar a decorrer
// (janela de 24h para tras cobre qualquer duracao de servico).
async function temConflito({ negocioId, profissionalId, inicio, fim, ignorarId }) {
  const candidatos = await prisma.agendamento.findMany({
    where: {
      negocioId,
      profissionalId,
      status: { in: ['PENDENTE', 'CONFIRMADO'] },
      dataHora: { gt: new Date(inicio.getTime() - 24 * 60 * 60000), lt: fim },
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
    },
    select: { dataHora: true, duracaoMin: true },
  });
  return candidatos.some((a) => {
    const inicioExistente = a.dataHora.getTime();
    const fimExistente = inicioExistente + a.duracaoMin * 60000;
    return inicioExistente < fim.getTime() && fimExistente > inicio.getTime();
  });
}

module.exports = { LIMITES, limitesDoPlano, contarAgendamentosDoMes, usoAgendamentos, temConflito };
