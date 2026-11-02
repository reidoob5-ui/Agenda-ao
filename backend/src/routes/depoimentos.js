// ===== DEPOIMENTOS =====
// Publico: lista de depoimentos (pagina inicial e pagina /depoimentos)
// Autenticado: o dono do negocio escreve/edita o SEU depoimento (um por negocio),
// disponivel apos 10 dias de uso.
const router = require('express').Router();
const { autenticar } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DIAS_PARA_AVALIAR = 10;
const TEXTO_MIN = 10;
const TEXTO_MAX = 400;

function diasDesde(data) {
  return Math.floor((Date.now() - new Date(data).getTime()) / (24 * 60 * 60 * 1000));
}

// GET /api/depoimentos?limit=20&offset=0
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const where = { visivel: true };

    const [itens, total, agregado, porEstrela] = await Promise.all([
      prisma.depoimento.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true, texto: true, estrelas: true, criadoEm: true,
          negocio: { select: { nome: true, logo: true, cidade: true } }
        }
      }),
      prisma.depoimento.count({ where }),
      prisma.depoimento.aggregate({ where, _avg: { estrelas: true } }),
      prisma.depoimento.groupBy({ by: ['estrelas'], where, _count: { _all: true } })
    ]);

    const distribuicao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    porEstrela.forEach(g => { distribuicao[g.estrelas] = g._count._all; });

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      itens,
      total,
      media: agregado._avg.estrelas ? Math.round(agregado._avg.estrelas * 10) / 10 : 0,
      distribuicao
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar depoimentos' });
  }
});

// GET /api/depoimentos/meu — estado do depoimento do negocio de quem esta autenticado
router.get('/meu', autenticar, async (req, res) => {
  try {
    const dias = diasDesde(req.usuario.negocio.criadoEm);
    const elegivel = dias >= DIAS_PARA_AVALIAR;
    const depoimento = await prisma.depoimento.findUnique({ where: { negocioId: req.negocioId } });
    res.json({
      depoimento,
      elegivel,
      diasDeUso: dias,
      diasEmFalta: Math.max(0, DIAS_PARA_AVALIAR - dias),
      pedir: elegivel && !depoimento
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar o teu depoimento' });
  }
});

// PUT /api/depoimentos/meu — criar ou actualizar o depoimento do proprio negocio
router.put('/meu', autenticar, async (req, res) => {
  try {
    const dias = diasDesde(req.usuario.negocio.criadoEm);
    if (dias < DIAS_PARA_AVALIAR) {
      return res.status(403).json({
        erro: `Podes deixar o teu depoimento depois de ${DIAS_PARA_AVALIAR} dias de uso. Faltam ${DIAS_PARA_AVALIAR - dias}.`
      });
    }

    const estrelas = parseInt(req.body.estrelas);
    const texto = String(req.body.texto || '').trim();
    if (!(estrelas >= 1 && estrelas <= 5)) return res.status(400).json({ erro: 'Escolhe de 1 a 5 estrelas' });
    if (texto.length < TEXTO_MIN) return res.status(400).json({ erro: `Escreve pelo menos ${TEXTO_MIN} caracteres` });
    if (texto.length > TEXTO_MAX) return res.status(400).json({ erro: `Máximo de ${TEXTO_MAX} caracteres` });

    const depoimento = await prisma.depoimento.upsert({
      where: { negocioId: req.negocioId },
      update: { estrelas, texto },
      create: { negocioId: req.negocioId, estrelas, texto }
    });
    res.json({ mensagem: 'Obrigado pelo teu depoimento!', depoimento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao guardar o depoimento' });
  }
});

module.exports = router;
