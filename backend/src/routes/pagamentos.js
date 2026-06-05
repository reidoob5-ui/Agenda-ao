const router = require('express').Router();
const crypto = require('crypto');
const { autenticar } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PLANO_PRECO = { BASICO: 15000, PROFISSIONAL: 35000, PREMIUM: 75000 };
const PLANO_LABEL = { BASICO: 'Basico', PROFISSIONAL: 'Profissional', PREMIUM: 'Premium' };

// ── INICIAR PAGAMENTO EXPRESS ─────────────────────────────────────────────────
// Gera referencia unica e mostra numero Express do dono para pagamento manual
router.post('/iniciar-express', autenticar, async (req, res) => {
  try {
    const { plano } = req.body;
    const planoPedido = plano || 'BASICO';
    const valorKz = PLANO_PRECO[planoPedido];
    if (!valorKz) return res.status(400).json({ erro: 'Plano invalido' });

    const negocio = await prisma.negocio.findUnique({ where: { id: req.negocioId } });
    const assinatura = await criarAssinatura(req.negocioId, planoPedido);

    // Referencia unica para identificar o pagamento
    const referencia = 'EXP-' + assinatura.id.slice(0, 8).toUpperCase();

    const pagamento = await prisma.pagamento.create({
      data: {
        negocioId: req.negocioId,
        assinaturaId: assinatura.id,
        metodo: 'EXPRESS',
        valor: valorKz,
        status: 'PENDENTE',
        referencia,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h para confirmar
      }
    });

    res.json({
      mensagem: 'Pedido criado. Faz o pagamento para o numero Express indicado.',
      pagamentoId: pagamento.id,
      referencia,
      valor: valorKz,
      plano: planoPedido,
      // Dados de pagamento do dono (quem recebe o dinheiro)
      numerExpress: process.env.MULTICAIXA_EXPRESS_NUMERO,
      nomeRecebedor: process.env.MULTICAIXA_EXPRESS_NOME || 'AgendaAO',
      instrucoes: `Faz Multicaixa Express para ${process.env.MULTICAIXA_EXPRESS_NUMERO}. No campo descricao coloca a referencia: ${referencia}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao iniciar pagamento' });
  }
});

// ── INICIAR PAGAMENTO IBAN ────────────────────────────────────────────────────
// Mostra os IBANs do dono para transferencia bancaria manual
router.post('/iniciar-iban', autenticar, async (req, res) => {
  try {
    const { plano, banco } = req.body;
    const planoPedido = plano || 'BASICO';
    const valorKz = PLANO_PRECO[planoPedido];
    if (!valorKz) return res.status(400).json({ erro: 'Plano invalido' });

    const assinatura = await criarAssinatura(req.negocioId, planoPedido);
    const referencia = 'IBAN-' + assinatura.id.slice(0, 8).toUpperCase();

    const pagamento = await prisma.pagamento.create({
      data: {
        negocioId: req.negocioId,
        assinaturaId: assinatura.id,
        metodo: 'IBAN',
        valor: valorKz,
        status: 'PENDENTE',
        referencia,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72h para transferir
      }
    });

    // Seleccionar IBAN com base na preferencia do banco
    const ibanAtlantico = process.env.IBAN_ATLANTICO;
    const ibanBAI = process.env.IBAN_BAI;

    const ibans = [
      { banco: 'Atlantico', iban: ibanAtlantico, destaque: banco === 'ATLANTICO' },
      { banco: 'BAI', iban: ibanBAI, destaque: banco === 'BAI' },
    ].filter(i => i.iban);

    res.json({
      mensagem: 'Instrucao de pagamento por IBAN criada.',
      pagamentoId: pagamento.id,
      referencia,
      valor: valorKz,
      plano: planoPedido,
      titular: process.env.IBAN_TITULAR || 'AgendaAO',
      ibans,
      ibanPrincipal: ibanAtlantico,
      bancoPrincipal: 'Atlantico',
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao gerar instrucao IBAN' });
  }
});

// ── STATUS DO PAGAMENTO ──────────────────────────────────────────────────────
router.get('/status/:pagamentoId', autenticar, async (req, res) => {
  try {
    const pagamento = await prisma.pagamento.findFirst({
      where: { id: req.params.pagamentoId, negocioId: req.negocioId }
    });
    if (!pagamento) return res.status(404).json({ erro: 'Pagamento nao encontrado' });
    res.json(pagamento);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── HISTORICO DE PAGAMENTOS ──────────────────────────────────────────────────
router.get('/historico', autenticar, async (req, res) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      where: { negocioId: req.negocioId },
      include: { assinatura: true },
      orderBy: { criadoEm: 'desc' },
      take: 24
    });
    res.json(pagamentos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── WEBHOOK EMIS (mantido para futuro — nao obrigatorio agora) ───────────────
router.post('/webhook', async (req, res) => {
  res.status(200).json({ received: true });
  try {
    const rawBody = req.body;
    if (!rawBody) return;
    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const { transactionId, status, amount, merchantId, currency, timestamp, signature } = payload;

    const valido = validarHMAC({ transactionId, merchantId, amount, currency, status, timestamp }, signature);
    if (!valido) return;

    const pagamento = await prisma.pagamento.findUnique({ where: { transactionId } });
    if (!pagamento || pagamento.status !== 'PENDENTE') return;

    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: { webhookPayload: JSON.stringify(payload) }
    });

    if (status === 'APPROVED') {
      await processarPagamentoAprovado(pagamento.id);
    } else {
      await prisma.pagamento.update({
        where: { id: pagamento.id },
        data: { status: status === 'DECLINED' ? 'RECUSADO' : 'EXPIRADO' }
      });
    }
  } catch (err) {
    console.error('[Webhook] Erro:', err.message);
  }
});

// ── HELPERS ──────────────────────────────────────────────────────────────────
function validarHMAC(campos, signatureRecebida) {
  try {
    const str = [campos.transactionId, campos.merchantId, campos.amount, campos.currency, campos.status, campos.timestamp].join('|');
    const calculada = crypto.createHmac('sha256', process.env.EMIS_WEBHOOK_SECRET || 'dev_secret').update(str).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(calculada), Buffer.from(signatureRecebida || ''));
  } catch { return false; }
}

async function criarAssinatura(negocioId, plano) {
  const agora = new Date();
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());
  return prisma.assinatura.create({
    data: {
      negocioId,
      plano,
      valor: PLANO_PRECO[plano],
      status: 'PENDENTE',
      periodoInicio: agora,
      periodoFim: fimMes
    }
  });
}

async function processarPagamentoAprovado(pagamentoId) {
  const pagamento = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
    include: { assinatura: true }
  });

  const fimPeriodo = new Date();
  fimPeriodo.setDate(fimPeriodo.getDate() + 30);

  await prisma.$transaction([
    prisma.pagamento.update({ where: { id: pagamentoId }, data: { status: 'APROVADO', processadoEm: new Date() } }),
    prisma.assinatura.update({ where: { id: pagamento.assinaturaId }, data: { status: 'ATIVA', periodoFim: fimPeriodo } }),
    prisma.negocio.update({
      where: { id: pagamento.negocioId },
      data: { planoStatus: 'ATIVO', plano: pagamento.assinatura?.plano || 'BASICO', planoExpira: fimPeriodo }
    })
  ]);
}

module.exports = router;
