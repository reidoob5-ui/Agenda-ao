const router = require('express').Router();
const { autenticar } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/agendamentos
router.get('/', autenticar, async (req, res) => {
  try {
    const { data, profissionalId, status } = req.query;
    const where = { negocioId: req.negocioId };
    if (profissionalId) where.profissionalId = profissionalId;
    if (status) where.status = status;
    if (data) {
      const inicio = new Date(data); inicio.setHours(0,0,0,0);
      const fim = new Date(data); fim.setHours(23,59,59,999);
      where.dataHora = { gte: inicio, lte: fim };
    }
    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: { cliente: true, profissional: true, servico: true },
      orderBy: { dataHora: 'asc' }
    });
    res.json(agendamentos);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// POST /api/agendamentos
router.post('/', autenticar, async (req, res) => {
  try {
    const { clienteId, profissionalId, servicoId, dataHora, notaCliente } = req.body;
    const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });

    // Verificar conflito de horário
    const inicio = new Date(dataHora);
    if (isNaN(inicio.getTime())) return res.status(400).json({ erro: 'Data/hora inválida' });
    const fim = new Date(inicio.getTime() + servico.duracaoMin * 60000);

    // Dois agendamentos sobrepõem-se quando: inicioExistente < fimNovo E fimExistente > inicioNovo.
    // Procuramos os que começam até ao fim do novo e que podem ainda estar a decorrer
    // (janela de 24h para trás cobre qualquer duração de serviço).
    const candidatos = await prisma.agendamento.findMany({
      where: {
        profissionalId,
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
        dataHora: { gt: new Date(inicio.getTime() - 24 * 60 * 60000), lt: fim }
      },
      select: { dataHora: true, duracaoMin: true }
    });
    const conflito = candidatos.some(a => {
      const fimExistente = a.dataHora.getTime() + a.duracaoMin * 60000;
      return fimExistente > inicio.getTime();
    });
    if (conflito) return res.status(409).json({ erro: 'Horário indisponível para este profissional' });

    const agendamento = await prisma.agendamento.create({
      data: {
        negocioId: req.negocioId,
        clienteId,
        profissionalId,
        servicoId,
        dataHora: inicio,
        duracaoMin: servico.duracaoMin,
        preco: servico.preco,
        notaCliente,
        status: 'PENDENTE'
      },
      include: { cliente: true, profissional: true, servico: true }
    });
    res.status(201).json(agendamento);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// PATCH /api/agendamentos/:id/status
router.patch('/:id/status', autenticar, async (req, res) => {
  try {
    const { status } = req.body;
    const agendamento = await prisma.agendamento.update({
      where: { id: req.params.id },
      data: { status },
      include: { cliente: true, profissional: true, servico: true }
    });
    res.json(agendamento);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// DELETE /api/agendamentos/:id
router.delete('/:id', autenticar, async (req, res) => {
  try {
    await prisma.agendamento.update({
      where: { id: req.params.id },
      data: { status: 'CANCELADO' }
    });
    res.json({ mensagem: 'Agendamento cancelado' });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports = router;
