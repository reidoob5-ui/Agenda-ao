const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/auth/registar
router.post('/registar', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha mínimo 6 caracteres'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
  body('nomeNegocio').notEmpty().withMessage('Nome do negócio é obrigatório'),
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erros: erros.array() });

  try {
    const { nome, email, senha, telefone, nomeNegocio } = req.body;

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ erro: 'Email já registado' });

    // Normalizar telefone para verificar se ja usou periodo de teste
    const telNormalizado = telefone.replace(/\D/g, '');
    const trialUsado = await prisma.trialUsado.findFirst({
      where: {
        OR: [
          { email },
          { telefoneNormalizado: telNormalizado }
        ]
      }
    });

    const jaTemTrial = !!trialUsado;
    const diasTrial = 14;
    const expiraData = jaTemTrial ? null : new Date(Date.now() + diasTrial * 24 * 60 * 60 * 1000);
    const planoStatus = jaTemTrial ? 'INATIVO' : 'ATIVO';

    const slug = nomeNegocio.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) + '-' + Date.now().toString(36);

    const senhaHash = await bcrypt.hash(senha, 12);

    const resultado = await prisma.$transaction(async (tx) => {
      const negocio = await tx.negocio.create({
        data: {
          nome: nomeNegocio,
          email,
          telefone,
          slug,
          plano: 'BASICO',
          planoStatus,
          planoExpira: expiraData,
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
        data: {
          negocioId: negocio.id,
          nome,
          email,
          senha: senhaHash,
          role: 'DONO'
        }
      });

      // Se nao usou trial ainda, marcar como usado
      if (!jaTemTrial) {
        await tx.trialUsado.create({
          data: {
            email,
            telefoneNormalizado: telNormalizado
          }
        });
      }

      return { negocio, usuario };
    });

    const token = jwt.sign(
      { usuarioId: resultado.usuario.id, negocioId: resultado.negocio.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      usuario: {
        id: resultado.usuario.id,
        nome: resultado.usuario.nome,
        email: resultado.usuario.email,
        role: resultado.usuario.role
      },
      negocio: {
        id: resultado.negocio.id,
        nome: resultado.negocio.nome,
        slug: resultado.negocio.slug,
        plano: resultado.negocio.plano
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar conta' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('senha').notEmpty(),
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erros: erros.array() });

  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { negocio: true }
    });

    if (!usuario || !await bcrypt.compare(senha, usuario.senha)) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Conta desactivada. Contacta o administrador.' });
    }

    const token = jwt.sign(
      { usuarioId: usuario.id, negocioId: usuario.negocioId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      negocio: {
        id: usuario.negocio.id,
        nome: usuario.negocio.nome,
        slug: usuario.negocio.slug,
        plano: usuario.negocio.plano,
        planoStatus: usuario.negocio.planoStatus,
        logo: usuario.negocio.logo
      }
    });
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
      telefone: req.usuario.negocio.telefone,
      endereco: req.usuario.negocio.endereco
    }
  });
});

module.exports = router;
