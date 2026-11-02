// ===== ROTAS DE SUPER-ADMIN =====
// Acesso exclusivo com o header x-admin-secret (valor na variavel de ambiente ADMIN_SECRET)
// Gerir negocios, confirmar pagamentos, activar/suspender planos

const router = require('express').Router();
const { verificarAdmin } = require('../middleware/admin');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Aplicar verificacao de admin em todas as rotas
router.use(verificarAdmin);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Estatisticas gerais do sistema
router.get('/stats', async (req, res) => {
  try {
    const [totalNegocios, negociosActivos, pagamentosPendentes, receitaTotal] = await Promise.all([
      prisma.negocio.count(),
      prisma.negocio.count({ where: { planoStatus: 'ATIVO' } }),
      prisma.pagamento.count({ where: { status: 'PENDENTE' } }),
      prisma.pagamento.aggregate({ where: { status: 'APROVADO' }, _sum: { valor: true } }),
    ]);

    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const receitaMes = await prisma.pagamento.aggregate({
      where: { status: 'APROVADO', criadoEm: { gte: inicioMes } },
      _sum: { valor: true }
    });

    const novosNegociosMes = await prisma.negocio.count({
      where: { criadoEm: { gte: inicioMes } }
    });

    res.json({
      totalNegocios,
      negociosActivos,
      negociosSuspensos: totalNegocios - negociosActivos,
      pagamentosPendentes,
      receitaTotal: receitaTotal._sum.valor || 0,
      receitaMes: receitaMes._sum.valor || 0,
      novosNegociosMes,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/negocios ───────────────────────────────────────────────────
// Listar todos os negocios registados
router.get('/negocios', async (req, res) => {
  try {
    const negocios = await prisma.negocio.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        usuarios: { where: { role: 'DONO' }, select: { nome: true, email: true } },
        _count: { select: { agendamentos: true, clientes: true } },
        assinaturas: {
          orderBy: { criadoEm: 'desc' },
          take: 1,
          include: { pagamentos: { orderBy: { criadoEm: 'desc' }, take: 1 } }
        }
      }
    });
    res.json(negocios);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/pagamentos-pendentes ──────────────────────────────────────
// Listar pagamentos pendentes de confirmacao manual
router.get('/pagamentos-pendentes', async (req, res) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { criadoEm: 'asc' },
      include: {
        negocio: { select: { nome: true, email: true, telefone: true } },
        assinatura: true,
      }
    });
    res.json(pagamentos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/pagamentos ─────────────────────────────────────────────────
// Historico completo de pagamentos
router.get('/pagamentos', async (req, res) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 100,
      include: {
        negocio: { select: { nome: true, email: true } },
        assinatura: true,
      }
    });
    res.json(pagamentos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/admin/confirmar-pagamento/:id ───────────────────────────────────
// Confirmar pagamento manualmente (IBAN ou Express) e activar plano
router.post('/confirmar-pagamento/:id', async (req, res) => {
  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: req.params.id },
      include: { assinatura: true }
    });

    if (!pagamento) return res.status(404).json({ erro: 'Pagamento nao encontrado' });
    if (pagamento.status === 'APROVADO') return res.status(400).json({ erro: 'Pagamento ja confirmado' });

    const agora = new Date();
    const fimPeriodo = new Date(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());

    await prisma.$transaction(async (tx) => {
      // Confirmar pagamento
      await tx.pagamento.update({
        where: { id: pagamento.id },
        data: { status: 'APROVADO', processadoEm: agora }
      });

      // Activar assinatura se existir
      if (pagamento.assinaturaId) {
        await tx.assinatura.update({
          where: { id: pagamento.assinaturaId },
          data: { status: 'ATIVA', periodoFim: fimPeriodo }
        });
      }

      // Actualizar negocio
      const plano = pagamento.assinatura?.plano || 'BASICO';
      await tx.negocio.update({
        where: { id: pagamento.negocioId },
        data: {
          planoStatus: 'ATIVO',
          plano,
          planoExpira: fimPeriodo,
        }
      });
    });

    console.log(`[Admin] Pagamento ${pagamento.id} confirmado manualmente`);
    res.json({ mensagem: 'Pagamento confirmado e plano activado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/admin/suspender-negocio/:id ─────────────────────────────────────
router.post('/suspender-negocio/:id', async (req, res) => {
  try {
    await prisma.negocio.update({
      where: { id: req.params.id },
      data: { planoStatus: 'SUSPENSO' }
    });
    res.json({ mensagem: 'Negocio suspenso com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/admin/activar-negocio/:id ──────────────────────────────────────
router.post('/activar-negocio/:id', async (req, res) => {
  try {
    const { plano, dias } = req.body;
    const fimPeriodo = new Date();
    fimPeriodo.setDate(fimPeriodo.getDate() + (dias || 30));

    await prisma.negocio.update({
      where: { id: req.params.id },
      data: {
        planoStatus: 'ATIVO',
        plano: plano || 'BASICO',
        planoExpira: fimPeriodo,
      }
    });
    res.json({ mensagem: 'Negocio activado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/admin/rejeitar-pagamento/:id ─────────────────────────────────
router.post('/rejeitar-pagamento/:id', async (req, res) => {
  try {
    await prisma.pagamento.update({
      where: { id: req.params.id },
      data: { status: 'RECUSADO' }
    });
    res.json({ mensagem: 'Pagamento rejeitado' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── DEPOIMENTOS (moderacao) ───────────────────────────────────────────────────
// Listar todos os depoimentos (visiveis e escondidos)
router.get('/depoimentos', async (req, res) => {
  try {
    const itens = await prisma.depoimento.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { negocio: { select: { nome: true, email: true } } }
    });
    res.json(itens);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Esconder ou mostrar um depoimento na pagina publica
router.patch('/depoimentos/:id', async (req, res) => {
  try {
    const visivel = !!req.body.visivel;
    const depoimento = await prisma.depoimento.update({
      where: { id: req.params.id },
      data: { visivel }
    });
    res.json({ mensagem: visivel ? 'Depoimento visível' : 'Depoimento escondido', depoimento });
  } catch (err) {
    res.status(404).json({ erro: 'Depoimento não encontrado' });
  }
});

module.exports = router;
