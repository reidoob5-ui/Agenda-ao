const router = require('express').Router();
const { autenticar } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { temConflito, usoAgendamentos } = require('../utils/agenda');
const { temRecurso, pontosDaVisita } = require('../utils/planos');
const prisma = new PrismaClient();

const STATUS_VALIDOS = ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'FALTA'];
const INCLUIR = { cliente: true, profissional: true, servico: true };

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
      include: INCLUIR,
      orderBy: { dataHora: 'asc' }
    });
    res.json(agendamentos);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// POST /api/agendamentos
router.post('/', autenticar, async (req, res) => {
  try {
    const { clienteId, profissionalId, servicoId, dataHora, notaCliente } = req.body;

    // Tudo tem de pertencer ao negocio de quem esta autenticado
    const [servico, profissional, cliente] = await Promise.all([
      prisma.servico.findFirst({ where: { id: servicoId, negocioId: req.negocioId } }),
      prisma.profissional.findFirst({ where: { id: profissionalId, negocioId: req.negocioId } }),
      prisma.cliente.findFirst({ where: { id: clienteId, negocioId: req.negocioId } }),
    ]);
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado' });
    if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

    const inicio = new Date(dataHora);
    if (isNaN(inicio.getTime())) return res.status(400).json({ erro: 'Data/hora inválida' });
    const fim = new Date(inicio.getTime() + servico.duracaoMin * 60000);

    // Limite de marcacoes do plano gratis
    const uso = await usoAgendamentos(req.negocioId, req.usuario.negocio.plano);
    if (uso.atingido) {
      return res.status(403).json({
        codigo: 'LIMITE_PLANO',
        erro: `Limite de ${uso.limite} marcações por mês atingido. Muda para um plano superior em Faturação.`
      });
    }

    const conflito = await temConflito({ negocioId: req.negocioId, profissionalId, inicio, fim });
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
      include: INCLUIR
    });
    res.status(201).json(agendamento);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// PATCH /api/agendamentos/:id/status
router.patch('/:id/status', autenticar, async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUS_VALIDOS.includes(status)) return res.status(400).json({ erro: 'Estado inválido' });

    const anterior = await prisma.agendamento.findFirst({
      where: { id: req.params.id, negocioId: req.negocioId },
      select: { status: true, preco: true, clienteId: true }
    });
    if (!anterior) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    // Só altera se a marcação for deste negócio
    const r = await prisma.agendamento.updateMany({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { status }
    });
    if (r.count === 0) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const agendamento = await prisma.agendamento.findUnique({
      where: { id: req.params.id },
      include: INCLUIR
    });
    // Fidelidade (Premium): pontos ao concluir; se deixar de estar concluida, retira-os
    if (temRecurso(req.usuario.negocio.plano, 'fidelidade') && anterior.status !== status) {
      const pts = pontosDaVisita(anterior.preco);
      if (status === 'CONCLUIDO') {
        await prisma.cliente.updateMany({ where: { id: anterior.clienteId, negocioId: req.negocioId }, data: { pontosFidelidade: { increment: pts } } });
      } else if (anterior.status === 'CONCLUIDO') {
        await prisma.cliente.updateMany({ where: { id: anterior.clienteId, negocioId: req.negocioId, pontosFidelidade: { gte: pts } }, data: { pontosFidelidade: { decrement: pts } } });
      }
    }
    if (status === 'CONFIRMADO') {
      require('../services/whatsappService')
        .enviarWhatsAppAgendamento({ agendamento, negocio: req.usuario.negocio, tipo: 'CONFIRMACAO' })
        .catch(e => console.error('[WhatsApp]', e.message));
    }
    res.json(agendamento);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// DELETE /api/agendamentos/:id
router.delete('/:id', autenticar, async (req, res) => {
  try {
    const r = await prisma.agendamento.updateMany({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { status: 'CANCELADO' }
    });
    if (r.count === 0) return res.status(404).json({ erro: 'Agendamento não encontrado' });
    res.json({ mensagem: 'Agendamento cancelado' });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports = router;
