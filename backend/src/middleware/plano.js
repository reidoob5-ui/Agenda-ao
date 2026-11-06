// Middleware de verificacao de plano activo
// Bloqueia acesso a rotas pagas se o negocio nao tiver plano activo

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    // Verificar se plano expirou (comparar data)
    if (negocio.planoExpira && new Date(negocio.planoExpira) < new Date()) {
      // Actualizar status no banco se ainda nao foi feito
      await prisma.negocio.update({
        where: { id: req.negocioId },
        data: { planoStatus: 'EXPIRADO' }
      });
      return res.status(403).json({
        erro: 'Plano expirado',
        codigo: 'PLANO_EXPIRADO',
        mensagem: 'O teu plano de assinatura expirou. Renova em Faturacao para continuar a usar o Agenda Aqui.'
      });
    }

    if (negocio.planoStatus === 'SUSPENSO') {
      return res.status(403).json({
        erro: 'Conta suspensa',
        codigo: 'CONTA_SUSPENSA',
        mensagem: 'A tua conta foi suspensa. Contacta o suporte em agendaaosuporte@gmail.com'
      });
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
