require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes       = require('./routes/auth');
const adminRoutes      = require('./routes/admin');
const pagamentoRoutes  = require('./routes/pagamentos');
const agendamentoRoutes = require('./routes/agendamentos');

const { clientesRouter, servicosRouter, profissionaisRouter, negociosRouter, relatoriosRouter, publicRouter } = require('./routes/outros');

const { iniciarCrons } = require('./services/cronService');
const { autenticar }  = require('./middleware/auth');
const { verificarPlano } = require('./middleware/plano');

const app = express();
const PORT = process.env.PORT || 4001;

// ── Seguranca ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const origens = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (Postman, mobile, etc.)
    if (!origin) return callback(null, true);
    if (origens.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    callback(new Error('Origem nao permitida pelo CORS'));
  },
  credentials: true
}));

// Webhook precisa de body raw para validar HMAC
app.use('/api/pagamentos/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { erro: 'Muitos pedidos. Tenta novamente em 15 minutos.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { erro: 'Muitas tentativas. Tenta em 15 minutos.' }
});
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // max 5 tentativas por IP
  skipSuccessfulRequests: true, // nao contar pedidos bem-sucedidos (so falhas)
  message: { erro: 'Demasiadas tentativas de acesso ao admin. Tenta novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rotas Publicas ─────────────────────────────────────────────────────────
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/public',  publicRouter);
app.use('/api/admin',   adminLimiter, adminRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', versao: '1.0.0', ambiente: process.env.NODE_ENV });
});

// ── Rotas Protegidas (requerem login) ──────────────────────────────────────
// O middleware autenticar valida JWT; o verificarPlano bloqueia se plano expirado
app.use('/api/pagamentos',   autenticar, pagamentoRoutes);
app.use('/api/agendamentos', autenticar, verificarPlano, agendamentoRoutes);
app.use('/api/clientes',     autenticar, verificarPlano, clientesRouter);
app.use('/api/servicos',     autenticar, verificarPlano, servicosRouter);
app.use('/api/profissionais',autenticar, verificarPlano, profissionaisRouter);
app.use('/api/negocios',     autenticar, negociosRouter);
app.use('/api/relatorios',   autenticar, verificarPlano, relatoriosRouter);

// ── Handler de erros global ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    erro: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AgendaAO backend iniciado na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV}`);
  console.log(`   API: http://localhost:${PORT}/api/health\n`);
  iniciarCrons();
});

module.exports = app;
