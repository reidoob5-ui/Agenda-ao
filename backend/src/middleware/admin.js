// Middleware de autenticacao de super-admin
// Verifica a chave secreta no header x-admin-secret (comparacao em tempo constante)

const crypto = require('crypto');

function igual(a, b) {
  // Hash dos dois lados: tamanhos iguais e sem revelar o comprimento do segredo
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const verificarAdmin = (req, res, next) => {
  const esperado = process.env.ADMIN_SECRET;
  const segredo = req.headers['x-admin-secret'];

  // Sem ADMIN_SECRET configurado o admin fica fechado (nunca aceita "vazio")
  if (!esperado || !segredo || !igual(segredo, esperado)) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'desconhecido';
    console.warn(`[ADMIN] ⛔ Tentativa de acesso falhada — IP: ${ip} — ${new Date().toISOString()}`);
    return res.status(401).json({ erro: 'Acesso negado.' });
  }
  next();
};

module.exports = { verificarAdmin };
