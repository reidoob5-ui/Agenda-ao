// Middleware de autenticacao de super-admin
// Verifica a chave secreta no header x-admin-secret

const verificarAdmin = (req, res, next) => {
  const segredo = req.headers['x-admin-secret'];
  if (!segredo || segredo !== process.env.ADMIN_SECRET) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'desconhecido';
    console.warn(`[ADMIN] ⛔ Tentativa de acesso falhada — IP: ${ip} — ${new Date().toISOString()}`);
    return res.status(401).json({ erro: 'Acesso negado.' });
  }
  next();
};

module.exports = { verificarAdmin };

