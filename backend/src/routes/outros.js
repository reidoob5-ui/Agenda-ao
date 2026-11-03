// ===== CLIENTES =====
const clientesRouter = require('express').Router();
const { autenticar } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { limitesDoPlano, usoAgendamentos, temConflito } = require('../utils/agenda');
const { exigirRecurso, temRecurso, pontosDaVisita } = require('../utils/planos');
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
    // Só campos permitidos (nunca deixar o body escolher o negocioId)
    const { nome, telefone, email, notas } = req.body;
    if (!nome || !telefone) return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });
    const cliente = await prisma.cliente.create({
      data: { negocioId: req.negocioId, nome, telefone, email, notas }
    });
    res.status(201).json(cliente);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ erro: 'Telefone já registado' });
    res.status(500).json({ erro: err.message });
  }
});

clientesRouter.get('/:id', autenticar, exigirRecurso('crm'), async (req, res) => {
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

// Usar pontos de fidelidade (Premium): desconta pontos, nunca abaixo de 0
clientesRouter.post('/:id/pontos/usar', autenticar, exigirRecurso('fidelidade'), async (req, res) => {
  try {
    const pontos = parseInt(req.body.pontos);
    if (!(pontos > 0)) return res.status(400).json({ erro: 'Indica quantos pontos usar' });
    const r = await prisma.cliente.updateMany({
      where: { id: req.params.id, negocioId: req.negocioId, pontosFidelidade: { gte: pontos } },
      data: { pontosFidelidade: { decrement: pontos } }
    });
    if (r.count === 0) return res.status(400).json({ erro: 'Pontos insuficientes (ou cliente não encontrado)' });
    const cliente = await prisma.cliente.findUnique({ where: { id: req.params.id } });
    res.json(cliente);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

clientesRouter.put('/:id', autenticar, async (req, res) => {
  try {
    const { nome, telefone, email, notas } = req.body;
    const r = await prisma.cliente.updateMany({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { nome, telefone, email, notas }
    });
    if (r.count === 0) return res.status(404).json({ erro: 'Cliente não encontrado' });
    const cliente = await prisma.cliente.findUnique({ where: { id: req.params.id } });
    res.json(cliente);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ erro: 'Telefone já registado' });
    res.status(500).json({ erro: err.message });
  }
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
    // Só aceitar profissionais deste negócio
    let idsValidos;
    if (profissionalIds) {
      const meus = await prisma.profissional.findMany({
        where: { id: { in: profissionalIds }, negocioId: req.negocioId }, select: { id: true }
      });
      idsValidos = meus.map(p => p.id);
    }
    const servico = await prisma.servico.create({
      data: {
        negocioId: req.negocioId,
        nome, descricao, duracaoMin, preco,
        profissionais: idsValidos ? {
          create: idsValidos.map(id => ({ profissionalId: id }))
        } : undefined
      },
      include: { profissionais: { include: { profissional: true } } }
    });
    res.status(201).json(servico);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

servicosRouter.put('/:id', autenticar, async (req, res) => {
  try {
    const { profissionalIds, nome, descricao, duracaoMin, preco, ativo } = req.body;
    const dados = { nome, descricao, duracaoMin, preco, ativo };

    // O serviço tem de ser deste negócio
    const existente = await prisma.servico.findFirst({ where: { id: req.params.id, negocioId: req.negocioId } });
    if (!existente) return res.status(404).json({ erro: 'Serviço não encontrado' });

    let idsValidos;
    if (profissionalIds) {
      const meus = await prisma.profissional.findMany({
        where: { id: { in: profissionalIds }, negocioId: req.negocioId }, select: { id: true }
      });
      idsValidos = meus.map(p => p.id);
    }

    const servico = await prisma.$transaction(async (tx) => {
      if (idsValidos) {
        await tx.servicoProfissional.deleteMany({ where: { servicoId: req.params.id } });
        await tx.servicoProfissional.createMany({
          data: idsValidos.map(id => ({ servicoId: req.params.id, profissionalId: id }))
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
    const r = await prisma.servico.updateMany({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { ativo: false }
    });
    if (r.count === 0) return res.status(404).json({ erro: 'Serviço não encontrado' });
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
    const { nome, email, telefone, foto, bio } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

    // Limite de profissionais do plano
    const limite = limitesDoPlano(req.usuario.negocio.plano).profissionais;
    if (limite !== null) {
      const activos = await prisma.profissional.count({ where: { negocioId: req.negocioId, ativo: true } });
      if (activos >= limite) {
        return res.status(403).json({
          codigo: 'LIMITE_PLANO',
          erro: `O teu plano permite ${limite} profissional${limite > 1 ? 'is' : ''}. Muda para um plano superior em Faturação para adicionar mais.`
        });
      }
    }

    const profissional = await prisma.profissional.create({
      data: { negocioId: req.negocioId, nome, email, telefone, foto, bio }
    });
    res.status(201).json(profissional);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

profissionaisRouter.put('/:id', autenticar, async (req, res) => {
  try {
    const { nome, email, telefone, foto, bio, ativo } = req.body;
    const r = await prisma.profissional.updateMany({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { nome, email, telefone, foto, bio, ativo }
    });
    if (r.count === 0) return res.status(404).json({ erro: 'Profissional não encontrado' });
    const profissional = await prisma.profissional.findUnique({ where: { id: req.params.id } });
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
    // Só campos de perfil. NUNCA aceitar plano, planoStatus, planoExpira, slug, etc. vindos do cliente
    const { horarios, nome, telefone, endereco, cidade, logo, ibanBancario, merchantExpress } = req.body;
    const dados = { nome, telefone, endereco, cidade, logo, ibanBancario, merchantExpress };
    // Cor da pagina de marcacao: so Premium, e so um hex valido (#RRGGBB) ou vazio para repor
    if (req.body.corPrimaria !== undefined) {
      if (!temRecurso(req.usuario.negocio.plano, 'corPropria')) {
        return res.status(403).json({ codigo: 'PLANO_INSUFICIENTE', planoNecessario: 'PREMIUM', erro: 'A cor própria está disponível no plano Premium.' });
      }
      const c = String(req.body.corPrimaria || '').trim();
      if (c && !/^#[0-9a-fA-F]{6}$/.test(c)) return res.status(400).json({ erro: 'Cor inválida. Usa o formato #RRGGBB.' });
      dados.corPrimaria = c || null;
    }
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

negociosRouter.post('/push-subscribe', autenticar, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ erro: 'Dados de subscrição inválidos' });
    }

    await prisma.subscricaoPush.upsert({
      where: { endpoint },
      update: {
        negocioId: req.negocioId,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        negocioId: req.negocioId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    res.status(201).json({ mensagem: 'Subscrição push guardada com sucesso!' });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

negociosRouter.get('/push-key', autenticar, (req, res) => {
  const { publicKey } = require('../services/pushService');
  res.json({ publicKey });
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

    const planoActual = req.usuario.negocio.plano;
    const [agHoje, agMes, receitaMes, novosClientes, uso] = await Promise.all([
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
      }),
      usoAgendamentos(req.negocioId, planoActual)
    ]);

    res.json({
      agendamentosHoje: agHoje,
      totalHoje: agHoje.length,
      confirmadosHoje: agHoje.filter(a => a.status === 'CONFIRMADO').length,
      pendentesHoje: agHoje.filter(a => a.status === 'PENDENTE').length,
      receitaHoje: agHoje.filter(a => a.status === 'CONCLUIDO').reduce((s, a) => s + a.preco, 0),
      agendamentosMes: agMes,
      receitaMes: receitaMes._sum.preco || 0,
      novosClientes,
      // Uso do plano (para a barra de limite no painel)
      plano: planoActual,
      usoPlano: uso
    });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

relatoriosRouter.get('/mensal', autenticar, exigirRecurso('relatoriosFinanceiros'), async (req, res) => {
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

// Relatorio avancado (Premium): ultimos 90 dias
relatoriosRouter.get('/avancado', autenticar, exigirRecurso('relatoriosAvancados'), async (req, res) => {
  try {
    const desde = new Date(); desde.setDate(desde.getDate() - 90); desde.setHours(0, 0, 0, 0);
    const ags = await prisma.agendamento.findMany({
      where: { negocioId: req.negocioId, dataHora: { gte: desde } },
      include: { profissional: { select: { nome: true } }, servico: { select: { nome: true } }, cliente: { select: { id: true, nome: true, telefone: true } } }
    });

    const concluidos = ags.filter(a => a.status === 'CONCLUIDO');
    const receita = concluidos.reduce((t, a) => t + a.preco, 0);
    const terminados = ags.filter(a => ['CONCLUIDO', 'CANCELADO', 'FALTA'].includes(a.status));

    const porProfissional = {};
    for (const a of concluidos) {
      const k = a.profissional.nome;
      porProfissional[k] = porProfissional[k] || { count: 0, receita: 0 };
      porProfissional[k].count++; porProfissional[k].receita += a.preco;
    }

    const horas = {};
    for (const a of ags.filter(x => x.status !== 'CANCELADO')) {
      const h = parseInt(new Date(a.dataHora).toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda', hour: '2-digit', hour12: false }));
      horas[h] = (horas[h] || 0) + 1;
    }
    const horasPico = Object.entries(horas).map(([hora, total]) => ({ hora: Number(hora), total }))
      .sort((a, b) => b.total - a.total).slice(0, 5);

    // Clientes que nao voltam: ja vieram, mas a ultima visita concluida foi ha mais de 45 dias
    const limite = new Date(); limite.setDate(limite.getDate() - 45);
    const ultimas = await prisma.agendamento.groupBy({
      by: ['clienteId'],
      where: { negocioId: req.negocioId, status: 'CONCLUIDO' },
      _max: { dataHora: true },
      _count: { _all: true }
    });
    const inativos = ultimas.filter(u => u._max.dataHora < limite)
      .sort((a, b) => b._count._all - a._count._all).slice(0, 15);
    const clientes = await prisma.cliente.findMany({
      where: { negocioId: req.negocioId, id: { in: inativos.map(i => i.clienteId) } },
      select: { id: true, nome: true, telefone: true }
    });
    const clientesInativos = inativos.map(i => {
      const c = clientes.find(x => x.id === i.clienteId);
      return { id: i.clienteId, nome: c?.nome, telefone: c?.telefone, visitas: i._count._all, ultimaVisita: i._max.dataHora };
    }).filter(c => c.nome);

    res.json({
      dias: 90,
      concluidos: concluidos.length,
      receita,
      ticketMedio: concluidos.length ? Math.round(receita / concluidos.length) : 0,
      taxaCancelamento: terminados.length ? Math.round(ags.filter(a => a.status === 'CANCELADO').length / terminados.length * 100) : 0,
      taxaFaltas: terminados.length ? Math.round(ags.filter(a => a.status === 'FALTA').length / terminados.length * 100) : 0,
      porProfissional,
      horasPico,
      clientesInativos
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
    select: { id: true, plano: true, planoStatus: true, planoExpira: true }
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
        id: true, nome: true, logo: true, corPrimaria: true, endereco: true, cidade: true, telefone: true,
        horarios: true,
        profissionais: { where: { ativo: true }, select: { id: true, nome: true, foto: true, bio: true } },
        servicos: {
          where: { ativo: true },
          select: { id: true, nome: true, descricao: true, duracaoMin: true, preco: true, profissionais: { include: { profissional: { select: { id: true, nome: true } } } } }
        }
      }
    });
    // O que aparece na pagina publica depende do plano
    negocio.logo = temRecurso(check.plano, 'logoPagina') ? negocio.logo : null;
    negocio.corPrimaria = temRecurso(check.plano, 'corPropria') ? negocio.corPrimaria : null;
    negocio.semMarca = temRecurso(check.plano, 'semMarca');
    negocio.listaEspera = temRecurso(check.plano, 'listaEspera');
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

// Helper: calcular horários livres mais próximos do slot pedido
async function calcularSugestoes(negocioId, profissionalId, servicoId, dataHoraDesejada) {
  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico) return [];
  const duracaoMs = servico.duracaoMin * 60000;

  const dataStr = dataHoraDesejada.toISOString().split('T')[0];
  const diaSemana = dataHoraDesejada.getDay();
  const horario = await prisma.horario.findFirst({
    where: { negocioId, diaSemana, ativo: true }
  });
  if (!horario) return [];

  const agendamentosNoDia = await prisma.agendamento.findMany({
    where: {
      negocioId,
      profissionalId,
      status: { in: ['PENDENTE', 'CONFIRMADO'] },
      dataHora: {
        gte: new Date(`${dataStr}T00:00:00`),
        lte: new Date(`${dataStr}T23:59:59`)
      }
    }
  });

  const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
  const [hFim, mFim] = horario.horaFim.split(':').map(Number);
  const inicioExpediente = hIni * 60 + mIni;
  const fimExpediente = hFim * 60 + mFim;
  const duracaoMin = servico.duracaoMin;

  // Gerar todos os slots do dia
  const todosSlots = [];
  let cursor = inicioExpediente;
  while (cursor + duracaoMin <= fimExpediente) {
    const h = String(Math.floor(cursor / 60)).padStart(2, '0');
    const m = String(cursor % 60).padStart(2, '0');
    const slotInicio = new Date(`${dataStr}T${h}:${m}:00`);
    const slotFim = new Date(slotInicio.getTime() + duracaoMs);
    const ocupado = agendamentosNoDia.some(a => {
      const aFim = new Date(new Date(a.dataHora).getTime() + a.duracaoMin * 60000);
      return new Date(a.dataHora) < slotFim && aFim > slotInicio;
    });
    todosSlots.push({ hora: `${h}:${m}`, minutos: cursor, disponivel: !ocupado });
    cursor += 30;
  }

  // Encontrar slots livres: os 2 mais próximos (antes + depois) do solicitado
  const minutosDesejados = dataHoraDesejada.getHours() * 60 + dataHoraDesejada.getMinutes();
  const livres = todosSlots.filter(s => s.disponivel);
  if (!livres.length) return [];

  const anterior = [...livres].reverse().find(s => s.minutos < minutosDesejados);
  const proximo = livres.find(s => s.minutos > minutosDesejados);

  return [anterior, proximo].filter(Boolean).map(s => s.hora);
}

publicRouter.post('/negocio/:slug/agendar', async (req, res) => {
  try {
    const check = await verificarPlanoPublico(req.params.slug, res);
    if (!check) return;

    const { nome, telefone, email, profissionalId, servicoId, dataHora } = req.body;
    if (!nome || !String(nome).trim() || !telefone || !String(telefone).trim()) {
      return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });
    }
    const dataHoraObj = new Date(dataHora);
    if (isNaN(dataHoraObj.getTime())) return res.status(400).json({ erro: 'Data/hora inválida' });
    if (dataHoraObj.getTime() < Date.now() - 5 * 60000) {
      return res.status(400).json({ erro: 'Não é possível marcar no passado' });
    }

    // Serviço e profissional têm de pertencer a ESTE negócio
    const servico = await prisma.servico.findFirst({
      where: { id: servicoId, negocioId: check.id, ativo: true }
    });
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    const profissionalOk = await prisma.profissional.findFirst({
      where: { id: profissionalId, negocioId: check.id, ativo: true }, select: { id: true }
    });
    if (!profissionalOk) return res.status(404).json({ erro: 'Profissional não encontrado' });

    // Limite de marcações do plano grátis
    const uso = await usoAgendamentos(check.id, check.plano);
    if (uso.atingido) {
      return res.status(403).json({
        codigo: 'LIMITE_PLANO',
        erro: 'Limite de marcações atingido',
        mensagem: 'Este negócio atingiu o limite de marcações deste mês. Tenta novamente no próximo mês ou contacta o negócio diretamente.'
      });
    }

    // Verificar conflito de horário (sobreposição real: início e fim)
    const slotFim = new Date(dataHoraObj.getTime() + servico.duracaoMin * 60000);
    const conflito = await temConflito({
      negocioId: check.id, profissionalId, inicio: dataHoraObj, fim: slotFim
    });

    if (conflito) {
      // Calcular sugestões de horários livres mais próximos
      const sugestoes = await calcularSugestoes(check.id, profissionalId, servicoId, dataHoraObj);
      return res.status(409).json({
        conflito: true,
        erro: 'Horário indisponível',
        mensagem: 'Este horário já está ocupado. Escolhe um dos horários sugeridos.',
        sugestoes,
        listaEspera: temRecurso(check.plano, 'listaEspera')
      });
    }

    // Criar ou encontrar cliente
    let cliente = await prisma.cliente.findFirst({
      where: { negocioId: check.id, telefone }
    });
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: { negocioId: check.id, nome, telefone, email }
      });
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        negocioId: check.id,
        clienteId: cliente.id,
        profissionalId,
        servicoId,
        dataHora: dataHoraObj,
        duracaoMin: servico.duracaoMin,
        preco: servico.preco,
        status: 'PENDENTE'
      },
      include: { cliente: true, servico: true, profissional: true }
    });

    // Notificações assíncronas (não bloqueiam a resposta)
    prisma.negocio.findUnique({
      where: { id: check.id },
      select: { nome: true, email: true }
    }).then(async (negocioObj) => {
      if (negocioObj) {
        const { enviarEmailNovoAgendamento } = require('../services/emailService');
        const { enviarPushNovoAgendamento } = require('../services/pushService');
        await enviarEmailNovoAgendamento(negocioObj, agendamento);
        await enviarPushNovoAgendamento(check.id, agendamento);
      }
    }).catch(err => console.error('Erro ao disparar notificacoes:', err.message));

    res.status(201).json({
      mensagem: 'Pedido de agendamento enviado! Aguarda a aprovação do negócio.',
      agendamento
    });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// POST /api/public/negocio/:slug/lista-espera — cliente pede para ser avisado se abrir vaga (Premium)
publicRouter.post('/negocio/:slug/lista-espera', async (req, res) => {
  try {
    const check = await verificarPlanoPublico(req.params.slug, res);
    if (!check) return;
    if (!temRecurso(check.plano, 'listaEspera')) {
      return res.status(403).json({ erro: 'Este negócio não tem lista de espera.' });
    }
    const nome = String(req.body.nome || '').trim().slice(0, 80);
    const telefone = String(req.body.telefone || '').trim().slice(0, 30);
    if (!nome || telefone.replace(/\D/g, '').length < 9) {
      return res.status(400).json({ erro: 'Nome e telefone válidos são obrigatórios' });
    }
    // Ids opcionais, mas so aceites se forem deste negocio
    let servicoId = null, profissionalId = null;
    if (req.body.servicoId) {
      const sv = await prisma.servico.findFirst({ where: { id: req.body.servicoId, negocioId: check.id }, select: { id: true } });
      servicoId = sv?.id || null;
    }
    if (req.body.profissionalId) {
      const pr = await prisma.profissional.findFirst({ where: { id: req.body.profissionalId, negocioId: check.id }, select: { id: true } });
      profissionalId = pr?.id || null;
    }
    const data = req.body.dataDesejada ? new Date(req.body.dataDesejada) : null;

    // Evita spam: no maximo 3 pedidos activos por telefone neste negocio
    const activos = await prisma.listaEspera.count({ where: { negocioId: check.id, telefone, status: 'AGUARDA' } });
    if (activos >= 3) return res.status(429).json({ erro: 'Já tens pedidos em espera neste negócio.' });

    await prisma.listaEspera.create({
      data: {
        negocioId: check.id, nome, telefone, servicoId, profissionalId,
        dataDesejada: data && !isNaN(data.getTime()) ? data : null,
        nota: req.body.nota ? String(req.body.nota).slice(0, 200) : null
      }
    });
    res.status(201).json({ mensagem: 'Estás na lista de espera! O negócio contacta-te se abrir uma vaga.' });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// GET /api/public/negocio/:slug/pendentes — lista pedidos pendentes (para a empresa aprovar)
publicRouter.get('/negocio/:slug/pendentes', autenticar, async (req, res) => {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: req.negocioId },
      select: { id: true, slug: true }
    });
    if (!negocio || negocio.slug !== req.params.slug) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    const pendentes = await prisma.agendamento.findMany({
      where: { negocioId: req.negocioId, status: 'PENDENTE' },
      include: { cliente: true, servico: true, profissional: true },
      orderBy: { dataHora: 'asc' }
    });
    res.json(pendentes);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// PATCH /api/public/negocio/:slug/agendamento/:id/aprovar
publicRouter.patch('/negocio/:slug/agendamento/:id/aprovar', autenticar, async (req, res) => {
  try {
    const agendamento = await prisma.agendamento.update({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { status: 'CONFIRMADO' },
      include: { cliente: true, servico: true, profissional: true }
    });
    // Notificar cliente por email
    const negocioObj = await prisma.negocio.findUnique({
      where: { id: req.negocioId },
      select: { nome: true, email: true }
    });
    if (negocioObj && agendamento.cliente?.email && temRecurso(req.usuario.negocio.plano, 'emailLembretes')) {
      const { enviarEmailConfirmacao } = require('../services/emailService');
      enviarEmailConfirmacao(negocioObj, agendamento).catch(e => console.error(e.message));
    }
    // WhatsApp automatico (so planos com WhatsApp; fica desligado se nao estiver configurado)
    require('../services/whatsappService')
      .enviarWhatsAppAgendamento({ agendamento, negocio: req.usuario.negocio, tipo: 'CONFIRMACAO' })
      .catch(e => console.error('[WhatsApp]', e.message));
    res.json({ mensagem: 'Agendamento aprovado!', agendamento });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// PATCH /api/public/negocio/:slug/agendamento/:id/rejeitar
publicRouter.patch('/negocio/:slug/agendamento/:id/rejeitar', autenticar, async (req, res) => {
  try {
    const agendamento = await prisma.agendamento.update({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { status: 'CANCELADO' },
      include: { cliente: true, servico: true, profissional: true }
    });
    res.json({ mensagem: 'Agendamento rejeitado.', agendamento });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// GET /api/public/agendamento/:id/status
// Rota publica para o cliente verificar o estado do seu agendamento (polling)
publicRouter.get('/agendamento/:id/status', async (req, res) => {
  try {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        dataHora: true,
        duracaoMin: true,
        preco: true,
        servico:      { select: { nome: true } },
        profissional: { select: { nome: true } },
        cliente:      { select: { nome: true } },
        negocio:      { select: { nome: true, telefone: true, endereco: true, cidade: true } },
      }
    });
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });
    res.json(agendamento);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports.publicRouter = publicRouter;
