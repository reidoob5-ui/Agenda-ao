// ===== CLIENTES =====
const clientesRouter = require('express').Router();
const { autenticar } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

clientesRouter.get('/', autenticar, async (req, res) => {
  try {
    const { q } = req.query;
    const where = { negocioId: req.negocioId };
    if (q) where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { telefone: { contains: q } }
    ];
    const clientes = await prisma.cliente.findMany({
      where,
      include: { _count: { select: { agendamentos: true } } },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(clientes);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

clientesRouter.post('/', autenticar, async (req, res) => {
  try {
    const cliente = await prisma.cliente.create({
      data: { negocioId: req.negocioId, ...req.body }
    });
    res.status(201).json(cliente);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ erro: 'Telefone já registado' });
    res.status(500).json({ erro: err.message });
  }
});

clientesRouter.get('/:id', autenticar, async (req, res) => {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.params.id, negocioId: req.negocioId },
      include: {
        agendamentos: {
          include: { servico: true, profissional: true },
          orderBy: { dataHora: 'desc' },
          take: 20
        }
      }
    });
    if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.json(cliente);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

clientesRouter.put('/:id', autenticar, async (req, res) => {
  try {
    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(cliente);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports.clientesRouter = clientesRouter;


// ===== SERVIÇOS =====
const servicosRouter = require('express').Router();

servicosRouter.get('/', autenticar, async (req, res) => {
  try {
    const servicos = await prisma.servico.findMany({
      where: { negocioId: req.negocioId },
      include: { profissionais: { include: { profissional: true } } },
      orderBy: { nome: 'asc' }
    });
    res.json(servicos);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

servicosRouter.post('/', autenticar, async (req, res) => {
  try {
    const { nome, descricao, duracaoMin, preco, profissionalIds } = req.body;
    const servico = await prisma.servico.create({
      data: {
        negocioId: req.negocioId,
        nome, descricao, duracaoMin, preco,
        profissionais: profissionalIds ? {
          create: profissionalIds.map(id => ({ profissionalId: id }))
        } : undefined
      },
      include: { profissionais: { include: { profissional: true } } }
    });
    res.status(201).json(servico);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

servicosRouter.put('/:id', autenticar, async (req, res) => {
  try {
    const { profissionalIds, ...dados } = req.body;
    const servico = await prisma.$transaction(async (tx) => {
      if (profissionalIds) {
        await tx.servicoProfissional.deleteMany({ where: { servicoId: req.params.id } });
        await tx.servicoProfissional.createMany({
          data: profissionalIds.map(id => ({ servicoId: req.params.id, profissionalId: id }))
        });
      }
      return tx.servico.update({
        where: { id: req.params.id },
        data: dados,
        include: { profissionais: { include: { profissional: true } } }
      });
    });
    res.json(servico);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

servicosRouter.delete('/:id', autenticar, async (req, res) => {
  try {
    await prisma.servico.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ mensagem: 'Serviço desactivado' });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports.servicosRouter = servicosRouter;


// ===== PROFISSIONAIS =====
const profissionaisRouter = require('express').Router();

profissionaisRouter.get('/', autenticar, async (req, res) => {
  try {
    const profissionais = await prisma.profissional.findMany({
      where: { negocioId: req.negocioId },
      include: { servicoProfissionais: { include: { servico: true } } }
    });
    res.json(profissionais);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

profissionaisRouter.post('/', autenticar, async (req, res) => {
  try {
    const profissional = await prisma.profissional.create({
      data: { negocioId: req.negocioId, ...req.body }
    });
    res.status(201).json(profissional);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

profissionaisRouter.put('/:id', autenticar, async (req, res) => {
  try {
    const profissional = await prisma.profissional.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(profissional);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports.profissionaisRouter = profissionaisRouter;


// ===== NEGÓCIOS =====
const negociosRouter = require('express').Router();

negociosRouter.get('/meu', autenticar, async (req, res) => {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: req.negocioId },
      include: { horarios: true }
    });
    res.json(negocio);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

negociosRouter.put('/meu', autenticar, async (req, res) => {
  try {
    const { horarios, ...dados } = req.body;
    const negocio = await prisma.$transaction(async (tx) => {
      if (horarios) {
        await tx.horario.deleteMany({ where: { negocioId: req.negocioId } });
        await tx.horario.createMany({
          data: horarios.map(h => ({ ...h, negocioId: req.negocioId }))
        });
      }
      return tx.negocio.update({
        where: { id: req.negocioId },
        data: dados,
        include: { horarios: true }
      });
    });
    res.json(negocio);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports.negociosRouter = negociosRouter;


// ===== RELATÓRIOS =====
const relatoriosRouter = require('express').Router();

relatoriosRouter.get('/dashboard', autenticar, async (req, res) => {
  try {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const [agHoje, agMes, receitaMes, novosClientes] = await Promise.all([
      prisma.agendamento.findMany({
        where: { negocioId: req.negocioId, dataHora: { gte: hoje, lt: amanha } },
        include: { cliente: true, servico: true, profissional: true },
        orderBy: { dataHora: 'asc' }
      }),
      prisma.agendamento.count({
        where: { negocioId: req.negocioId, dataHora: { gte: inicioMes, lte: fimMes }, status: { in: ['CONFIRMADO', 'CONCLUIDO'] } }
      }),
      prisma.agendamento.aggregate({
        where: { negocioId: req.negocioId, dataHora: { gte: inicioMes, lte: fimMes }, status: 'CONCLUIDO' },
        _sum: { preco: true }
      }),
      prisma.cliente.count({
        where: { negocioId: req.negocioId, criadoEm: { gte: inicioMes } }
      })
    ]);

    res.json({
      agendamentosHoje: agHoje,
      totalHoje: agHoje.length,
      confirmadosHoje: agHoje.filter(a => a.status === 'CONFIRMADO').length,
      pendentesHoje: agHoje.filter(a => a.status === 'PENDENTE').length,
      receitaHoje: agHoje.filter(a => a.status === 'CONCLUIDO').reduce((s, a) => s + a.preco, 0),
      agendamentosMes: agMes,
      receitaMes: receitaMes._sum.preco || 0,
      novosClientes
    });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

relatoriosRouter.get('/mensal', autenticar, async (req, res) => {
  try {
    const { ano, mes } = req.query;
    const inicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const fim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59);

    const agendamentos = await prisma.agendamento.findMany({
      where: { negocioId: req.negocioId, dataHora: { gte: inicio, lte: fim }, status: 'CONCLUIDO' },
      include: { servico: true, profissional: true }
    });

    const porServico = {};
    const porProfissional = {};
    const porSemana = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    agendamentos.forEach(a => {
      if (!porServico[a.servico.nome]) porServico[a.servico.nome] = { count: 0, receita: 0 };
      porServico[a.servico.nome].count++;
      porServico[a.servico.nome].receita += a.preco;

      if (!porProfissional[a.profissional.nome]) porProfissional[a.profissional.nome] = { count: 0, receita: 0 };
      porProfissional[a.profissional.nome].count++;
      porProfissional[a.profissional.nome].receita += a.preco;

      const semana = Math.ceil(new Date(a.dataHora).getDate() / 7);
      porSemana[Math.min(semana, 5)] += a.preco;
    });

    res.json({
      total: agendamentos.length,
      receita: agendamentos.reduce((s, a) => s + a.preco, 0),
      porServico,
      porProfissional,
      porSemana
    });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports.relatoriosRouter = relatoriosRouter;


// ===== ROTA PÚBLICA (booking) =====
const publicRouter = require('express').Router();

// Helper para verificar se o negócio tem plano ativo antes de permitir ações públicas
const verificarPlanoPublico = async (slug, res) => {
  const negocio = await prisma.negocio.findUnique({
    where: { slug },
    select: { id: true, planoStatus: true, planoExpira: true }
  });
  
  if (!negocio) {
    res.status(404).json({ erro: 'Negócio não encontrado' });
    return null;
  }
  
  const expirou = negocio.planoExpira && new Date(negocio.planoExpira) < new Date();
  if (negocio.planoStatus !== 'ATIVO' || expirou) {
    res.status(403).json({
      erro: 'Serviço suspenso',
      codigo: 'PLANO_INATIVO',
      mensagem: 'Os agendamentos online para este negócio estão temporariamente indisponíveis por falta de assinatura ativa.'
    });
    return null;
  }
  
  return negocio;
};

publicRouter.get('/negocio/:slug', async (req, res) => {
  try {
    const check = await verificarPlanoPublico(req.params.slug, res);
    if (!check) return;

    const negocio = await prisma.negocio.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, nome: true, logo: true, endereco: true, cidade: true, telefone: true,
        horarios: true,
        profissionais: { where: { ativo: true }, select: { id: true, nome: true, foto: true, bio: true } },
        servicos: {
          where: { ativo: true },
          select: { id: true, nome: true, descricao: true, duracaoMin: true, preco: true, profissionais: { include: { profissional: { select: { id: true, nome: true } } } } }
        }
      }
    });
    res.json(negocio);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

publicRouter.get('/negocio/:slug/disponibilidade', async (req, res) => {
  try {
    const check = await verificarPlanoPublico(req.params.slug, res);
    if (!check) return;

    const { profissionalId, servicoId, data } = req.query;
    const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
    const diaSemana = new Date(data).getDay();
    const horario = await prisma.horario.findFirst({
      where: { negocioId: check.id, diaSemana, ativo: true }
    });
    if (!horario) return res.json({ slots: [] });

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        negocioId: check.id,
        profissionalId,
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
        dataHora: {
          gte: new Date(`${data}T00:00:00`),
          lte: new Date(`${data}T23:59:59`)
        }
      }
    });

    const slots = [];
    const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
    const [hFim, mFim] = horario.horaFim.split(':').map(Number);
    let cursor = hIni * 60 + mIni;
    const fim = hFim * 60 + mFim;

    while (cursor + (servico?.duracaoMin || 30) <= fim) {
      const h = String(Math.floor(cursor / 60)).padStart(2, '0');
      const m = String(cursor % 60).padStart(2, '0');
      const slotInicio = new Date(`${data}T${h}:${m}:00`);
      const slotFim = new Date(slotInicio.getTime() + (servico?.duracaoMin || 30) * 60000);

      const ocupado = agendamentos.some(a => {
        const aFim = new Date(new Date(a.dataHora).getTime() + a.duracaoMin * 60000);
        return new Date(a.dataHora) < slotFim && aFim > slotInicio;
      });

      slots.push({ hora: `${h}:${m}`, disponivel: !ocupado });
      cursor += 30;
    }
    res.json({ slots });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

publicRouter.post('/negocio/:slug/agendar', async (req, res) => {
  try {
    const check = await verificarPlanoPublico(req.params.slug, res);
    if (!check) return;

    const { nome, telefone, email, profissionalId, servicoId, dataHora } = req.body;

    let cliente = await prisma.cliente.findFirst({
      where: { negocioId: check.id, telefone }
    });
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: { negocioId: check.id, nome, telefone, email }
      });
    }

    const servico = await prisma.servico.findUnique({ where: { id: servicoId } });

    const agendamento = await prisma.agendamento.create({
      data: {
        negocioId: check.id,
        clienteId: cliente.id,
        profissionalId,
        servicoId,
        dataHora: new Date(dataHora),
        duracaoMin: servico.duracaoMin,
        preco: servico.preco,
        status: 'PENDENTE'
      },
      include: { cliente: true, servico: true, profissional: true }
    });
    res.status(201).json({ mensagem: 'Agendamento criado com sucesso!', agendamento });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports.publicRouter = publicRouter;
