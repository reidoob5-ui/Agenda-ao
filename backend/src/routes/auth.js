const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verificarTokenGoogle, googleConfigurado } = require('../services/googleAuth');
const { recursosDoPlano } = require('../utils/planos');
const prisma = new PrismaClient();

// Hash valido so para gastar o mesmo tempo quando o email nao existe
const HASH_FALSO = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12);

// ── Helpers ──────────────────────────────────────────────────────────────────
function gerarToken(usuario) {
  return jwt.sign(
    { usuarioId: usuario.id, negocioId: usuario.negocioId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function respostaSessao(usuario, negocio) {
  return {
    token: gerarToken(usuario),
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    negocio: {
      id: negocio.id,
      nome: negocio.nome,
      slug: negocio.slug,
      plano: negocio.plano,
      planoStatus: negocio.planoStatus,
      logo: negocio.logo,
      corPrimaria: negocio.corPrimaria || null,
      recursos: recursosDoPlano(negocio.plano)
    }
  };
}

// Cria negocio + utilizador dono. Usado pelo registo com senha e pelo registo com Google.
// O plano Basico e gratis e nao expira: todas as contas novas comecam activas.
async function criarContaDono({ nome, email, senhaHash, telefone, nomeNegocio }) {
  const telNormalizado = telefone.replace(/\D/g, '');
  const trialUsado = await prisma.trialUsado.findFirst({
    where: { OR: [{ email }, { telefoneNormalizado: telNormalizado }] }
  });
  const jaTemTrial = !!trialUsado;

  const slug = nomeNegocio.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50) + '-' + Date.now().toString(36);

  return prisma.$transaction(async (tx) => {
    const negocio = await tx.negocio.create({
      data: {
        nome: nomeNegocio,
        email,
        telefone,
        slug,
        plano: 'BASICO',
        planoStatus: 'ATIVO',
        planoExpira: null,
        horarios: {
          create: [
            { diaSemana: 1, horaInicio: '08:00', horaFim: '18:00' },
            { diaSemana: 2, horaInicio: '08:00', horaFim: '18:00' },
            { diaSemana: 3, horaInicio: '08:00', horaFim: '18:00' },
            { diaSemana: 4, horaInicio: '08:00', horaFim: '18:00' },
            { diaSemana: 5, horaInicio: '08:00', horaFim: '18:00' },
            { diaSemana: 6, horaInicio: '08:00', horaFim: '14:00', ativo: true },
          ]
        }
      }
    });

    const usuario = await tx.usuario.create({
      data: { negocioId: negocio.id, nome, email, senha: senhaHash, role: 'DONO' }
    });

    if (!jaTemTrial) {
      await tx.trialUsado.create({ data: { email, telefoneNormalizado: telNormalizado } });
    }
    return { negocio, usuario };
  });
}

// GET /api/auth/config — o site pergunta se o registo exige Google
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    exigeGoogle: googleConfigurado()
  });
});

// POST /api/auth/registar (email + senha)
// Quando o Google esta configurado, as contas novas SO podem ser criadas com Google.
router.post('/registar', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').trim().isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6, max: 128 }).withMessage('Senha entre 6 e 128 caracteres'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
  body('nomeNegocio').notEmpty().withMessage('Nome do negócio é obrigatório'),
], async (req, res) => {
  if (googleConfigurado()) {
    return res.status(403).json({
      codigo: 'USAR_GOOGLE',
      erro: 'Para criar conta, entra com a tua conta Google.'
    });
  }
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erros: erros.array() });

  try {
    const { nome, email, senha, telefone, nomeNegocio } = req.body;

    const existe = await prisma.usuario.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (existe) return res.status(409).json({ erro: 'Email já registado' });

    const senhaHash = await bcrypt.hash(senha, 12);
    const { negocio, usuario } = await criarContaDono({ nome, email, senhaHash, telefone, nomeNegocio });
    res.status(201).json(respostaSessao(usuario, negocio));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar conta' });
  }
});

// POST /api/auth/google-registar — cria conta confirmando o email com o Google
router.post('/google-registar', [
  body('credential').notEmpty().withMessage('Confirmação do Google em falta'),
  body('telefone').trim().notEmpty().withMessage('Telefone é obrigatório'),
  body('nomeNegocio').trim().notEmpty().withMessage('Nome do negócio é obrigatório'),
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erros: erros.array(), erro: erros.array()[0].msg });

  try {
    if (!googleConfigurado()) return res.status(503).json({ erro: 'Login com Google ainda não está configurado.' });

    let google;
    try { google = await verificarTokenGoogle(req.body.credential); }
    catch (e) {
      console.error('[Google] token recusado:', e.message);
      return res.status(401).json({ erro: 'Não foi possível confirmar a tua conta Google. Tenta novamente.' });
    }

    const existe = await prisma.usuario.findFirst({
      where: { email: { equals: google.email, mode: 'insensitive' } }
    });
    if (existe) {
      return res.status(409).json({ codigo: 'JA_EXISTE', erro: 'Esta conta Google já tem conta no Agenda Aqui. Usa "Entrar".' });
    }

    // Conta criada com Google: sem senha utilizavel (hash de valor aleatorio)
    const senhaHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const { negocio, usuario } = await criarContaDono({
      nome: google.nome,
      email: google.email,
      senhaHash,
      telefone: req.body.telefone.trim(),
      nomeNegocio: req.body.nomeNegocio.trim()
    });
    res.status(201).json(respostaSessao(usuario, negocio));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar conta' });
  }
});

// POST /api/auth/google-login — entrar com Google (conta tem de existir)
router.post('/google-login', [
  body('credential').notEmpty(),
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erro: 'Confirmação do Google em falta' });

  try {
    if (!googleConfigurado()) return res.status(503).json({ erro: 'Login com Google ainda não está configurado.' });

    let google;
    try { google = await verificarTokenGoogle(req.body.credential); }
    catch (e) {
      console.error('[Google] token recusado:', e.message);
      return res.status(401).json({ erro: 'Não foi possível confirmar a tua conta Google. Tenta novamente.' });
    }

    // Liga automaticamente pelo email (tambem para contas antigas criadas com senha)
    const usuario = await prisma.usuario.findFirst({
      where: { email: { equals: google.email, mode: 'insensitive' } },
      include: { negocio: true }
    });
    if (!usuario) {
      return res.status(404).json({ codigo: 'NAO_REGISTADO', erro: 'Ainda não tens conta. Cria uma conta primeiro.' });
    }
    if (!usuario.ativo) return res.status(403).json({ erro: 'Conta desactivada. Contacta o administrador.' });

    res.json(respostaSessao(usuario, usuario.negocio));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// POST /api/auth/login (email + senha, para contas existentes)
router.post('/login', [
  body('email').trim().isEmail().withMessage('Email inválido'),
  body('senha').isString().isLength({ min: 1, max: 128 }),
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erros: erros.array(), erro: erros.array()[0].msg });

  try {
    const { email, senha } = req.body;

    // Aceita maiusculas/minusculas diferentes das usadas no registo
    const usuario = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { negocio: true }
    });

    // Compara sempre com um hash, mesmo sem utilizador, para o tempo de resposta
    // nao revelar se o email existe.
    const hash = usuario ? usuario.senha : HASH_FALSO;
    const senhaOk = await bcrypt.compare(senha, hash).catch(() => false);
    if (!usuario || !senhaOk) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Conta desactivada. Contacta o administrador.' });
    }

    res.json(respostaSessao(usuario, usuario.negocio));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').autenticar, async (req, res) => {
  res.json({
    usuario: {
      id: req.usuario.id,
      nome: req.usuario.nome,
      email: req.usuario.email,
      role: req.usuario.role
    },
    negocio: {
      id: req.usuario.negocio.id,
      nome: req.usuario.negocio.nome,
      slug: req.usuario.negocio.slug,
      plano: req.usuario.negocio.plano,
      planoStatus: req.usuario.negocio.planoStatus,
      logo: req.usuario.negocio.logo,
      corPrimaria: req.usuario.negocio.corPrimaria || null,
      recursos: recursosDoPlano(req.usuario.negocio.plano),
      telefone: req.usuario.negocio.telefone,
      endereco: req.usuario.negocio.endereco
    }
  });
});

module.exports = router;
