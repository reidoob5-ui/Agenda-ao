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

// Horarios do dia (de 30 em 30 min) no fuso do negocio, com a indicacao se estao livres.
// Nao devolve horas que ja passaram.
async function slotsDoDia({ negocioId, fuso, profissionalId, duracaoMin, dataStr }) {
  const { paraInstante, limitesDoDia, diaSemana } = require('./tempo');
  const horario = await prisma.horario.findFirst({
    where: { negocioId, diaSemana: diaSemana(dataStr), ativo: true }
  });
  if (!horario) return [];

  const { inicio, fim } = limitesDoDia(dataStr, fuso);
  const ocupados = await prisma.agendamento.findMany({
    where: {
      negocioId, profissionalId,
      status: { in: ['PENDENTE', 'CONFIRMADO'] },
      dataHora: { gte: new Date(inicio.getTime() - 24 * 60 * 60000), lt: fim },
    },
    select: { dataHora: true, duracaoMin: true },
  });

  const dur = duracaoMin || 30;
  const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
  const [hFim, mFim] = horario.horaFim.split(':').map(Number);
  const limiteFim = hFim * 60 + mFim;
  const agora = Date.now();
  const slots = [];
  for (let cursor = hIni * 60 + mIni; cursor + dur <= limiteFim; cursor += 30) {
    const hora = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
    const slotInicio = paraInstante(dataStr, hora, fuso);
    const slotFim = new Date(slotInicio.getTime() + dur * 60000);
    const ocupado = ocupados.some(a => {
      const aIni = new Date(a.dataHora).getTime();
      return aIni < slotFim.getTime() && aIni + a.duracaoMin * 60000 > slotInicio.getTime();
    });
    slots.push({ hora, minutos: cursor, disponivel: !ocupado && slotInicio.getTime() > agora });
  }
  return slots;
}

module.exports = { LIMITES, limitesDoPlano, contarAgendamentosDoMes, usoAgendamentos, temConflito, slotsDoDia };
