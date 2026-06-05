const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const autenticar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.usuarioId },
      include: { negocio: true }
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Utilizador inválido ou inativo' });
    }

    req.usuario = usuario;
    req.negocioId = usuario.negocioId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Sessão expirada. Faz login novamente.' });
    }
    return res.status(401).json({ erro: 'Token inválido' });
  }
};

const exigirRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({ erro: 'Sem permissão para esta acção' });
    }
    next();
  };
};

module.exports = { autenticar, exigirRole };
