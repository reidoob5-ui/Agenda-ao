// Middleware de autenticacao de super-admin
// Verifica a chave secreta no header x-admin-secret

const verificarAdmin = (req, res, next) => {
  const segredo = req.headers['x-admin-secret'];
  if (!segredo || segredo !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ erro: 'Acesso negado. Chave de admin invalida.' });
  }
  next();
};

module.exports = { verificarAdmin };
