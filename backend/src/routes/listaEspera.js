// Lista de espera (Premium) — lado do dono do negocio
const router = require('express').Router();
const { exigirRecurso } = require('../utils/planos');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(exigirRecurso('listaEspera'));

router.get('/', async (req, res) => {
  try {
    const itens = await prisma.listaEspera.findMany({
      where: { negocioId: req.negocioId, status: 'AGUARDA' },
      orderBy: { criadoEm: 'asc' }
    });
    const [servicos, profissionais] = await Promise.all([
      prisma.servico.findMany({ where: { negocioId: req.negocioId }, select: { id: true, nome: true } }),
      prisma.profissional.findMany({ where: { negocioId: req.negocioId }, select: { id: true, nome: true } }),
    ]);
    const nomeServico = Object.fromEntries(servicos.map(s => [s.id, s.nome]));
    const nomeProf = Object.fromEntries(profissionais.map(p => [p.id, p.nome]));
    res.json(itens.map(i => ({ ...i, servico: nomeServico[i.servicoId] || null, profissional: nomeProf[i.profissionalId] || null })));
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// status: CONTACTADO | REMOVIDO (sai da lista)
router.patch('/:id', async (req, res) => {
  try {
    const status = req.body.status;
    if (!['CONTACTADO', 'REMOVIDO'].includes(status)) return res.status(400).json({ erro: 'Estado inválido' });
    const r = await prisma.listaEspera.updateMany({
      where: { id: req.params.id, negocioId: req.negocioId },
      data: { status }
    });
    if (r.count === 0) return res.status(404).json({ erro: 'Pedido não encontrado' });
    res.json({ mensagem: 'Atualizado' });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

module.exports = router;
