// Middleware de verificacao de plano activo
// Bloqueia acesso a rotas pagas se o negocio nao tiver plano activo

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { rebaixarExpirados } = require('../services/assinaturas');

// Rotas que NAO precisam de plano activo (sempre acessiveis)
const ROTAS_LIVRES = [
  '/api/auth',
  '/api/pagamentos',
  '/api/public',
  '/api/health',
  '/api/admin',
  '/api/negocios/meu',
];

const verificarPlano = async (req, res, next) => {
  // Deixar passar rotas publicas
  const rotaLivre = ROTAS_LIVRES.some(r => req.path.startsWith(r.replace('/api', '')));
  if (rotaLivre) return next();

  // Se nao ha negocioId na sessao, deixar o middleware de auth tratar
  if (!req.negocioId) return next();

  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: req.negocioId },
      select: { planoStatus: true, planoExpira: true, plano: true }
    });

    if (!negocio) return res.status(404).json({ erro: 'Negocio nao encontrado' });

    if (negocio.planoStatus === 'SUSPENSO') {
      return res.status(403).json({
        erro: 'Conta suspensa',
        codigo: 'CONTA_SUSPENSA',
        mensagem: 'A tua conta foi suspensa. Contacta o suporte em agendaaosuporte@gmail.com'
      });
    }

    // Plano pago expirado: volta ao Basico gratis em vez de bloquear
    if (negocio.planoExpira && new Date(negocio.planoExpira) < new Date()) {
      await rebaixarExpirados(req.negocioId);
      if (req.usuario?.negocio) Object.assign(req.usuario.negocio, { plano: 'BASICO', planoStatus: 'ATIVO', planoExpira: null });
      return next();
    }

    // EXPIRADO sem data (nunca pagou ainda — periodo de trial)
    // Aqui podes definir quantos dias de trial: ex. 7 dias apos registo
    // Por ora, deixamos passar para nao bloquear novos utilizadores
    next();
  } catch (err) {
    console.error('[PlanoMiddleware] Erro:', err.message);
    next(); // Em caso de erro, nao bloquear
  }
};

module.exports = { verificarPlano };
