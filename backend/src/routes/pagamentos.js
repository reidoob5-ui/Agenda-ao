const router = require('express').Router();
const crypto = require('crypto');
const { autenticar } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PRECOS, MOEDAS_ONLINE, precoDoPlano } = require('../utils/planos');
const paddle = require('../services/paddle');
const { criarAssinatura, processarPagamentoAprovado } = require('../services/assinaturas');

const PLANO_PRECO = { BASICO: 0, PROFISSIONAL: PRECOS.PROFISSIONAL.AOA, PREMIUM: PRECOS.PREMIUM.AOA };
const PLANO_LABEL = { BASICO: 'Basico', PROFISSIONAL: 'Profissional', PREMIUM: 'Premium' };

// ── ACTIVAR PLANO GRATIS ─────────────────────────────────────────────────────
// O plano Basico e gratis e nao expira: activa directamente, sem pagamento
router.post('/ativar-gratis', autenticar, async (req, res) => {
  try {
    await prisma.negocio.update({
      where: { id: req.negocioId },
      data: { plano: 'BASICO', planoStatus: 'ATIVO', planoExpira: null }
    });
    res.json({ mensagem: 'Plano Basico gratis activado.', plano: 'BASICO' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao activar plano gratis' });
  }
});

// ── PRECOS (publico para o site mostrar a moeda certa) ───────────────────────
router.get('/precos', (req, res) => {
  res.json({ precos: PRECOS, moedasOnline: MOEDAS_ONLINE, paddle: paddle.configurado() });
});

// ── INICIAR PAGAMENTO ONLINE (Paddle): cartao, PayPal, Apple/Google Pay, Pix (BRL) ───
router.post('/iniciar-paddle', autenticar, async (req, res) => {
  try {
    if (!paddle.configurado()) {
      return res.status(503).json({ erro: 'O pagamento online ainda não está ativo. Contacta o suporte.' });
    }
    const planoPedido = req.body.plano || 'PROFISSIONAL';
    const moeda = String(req.body.moeda || 'USD').toUpperCase();
    if (!MOEDAS_ONLINE.includes(moeda)) return res.status(400).json({ erro: 'Moeda inválida' });
    const valor = precoDoPlano(planoPedido, moeda);
    if (!valor) return res.status(400).json({ erro: 'Plano inválido' });

    const assinatura = await criarAssinatura(req.negocioId, planoPedido, valor);
    const pagamento = await prisma.pagamento.create({
      data: {
        negocioId: req.negocioId, assinaturaId: assinatura.id, metodo: 'PADDLE',
        valor, moeda, status: 'PENDENTE', referencia: 'PDL-' + assinatura.id.slice(0, 8).toUpperCase(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const t = await paddle.criarTransacao({
      nomePlano: PLANO_LABEL[planoPedido], valor, moeda,
      urlPagamento: `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/pagar`
    });
    if (!t.ok || !t.url) {
      await prisma.pagamento.update({ where: { id: pagamento.id }, data: { status: 'RECUSADO' } });
      console.error('[Paddle] criar transacao:', t.erro);
      return res.status(502).json({ erro: 'Não foi possível iniciar o pagamento. Tenta novamente em instantes.' });
    }
    await prisma.pagamento.update({ where: { id: pagamento.id }, data: { transactionId: t.id } });
    res.json({ pagamentoId: pagamento.id, checkoutUrl: t.url, valor, moeda, plano: planoPedido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao iniciar pagamento' });
  }
});

// ── INICIAR PAGAMENTO EXPRESS ─────────────────────────────────────────────────
// Gera referencia unica e mostra numero Express do dono para pagamento manual
router.post('/iniciar-express', autenticar, async (req, res) => {
  try {
    const { plano } = req.body;
    const planoPedido = plano || 'PROFISSIONAL';
    const valorKz = PLANO_PRECO[planoPedido];
    if (valorKz === undefined) return res.status(400).json({ erro: 'Plano invalido' });
    if (valorKz === 0) return res.status(400).json({ erro: 'Este plano e gratis, nao precisa de pagamento' });

    const negocio = await prisma.negocio.findUnique({ where: { id: req.negocioId } });
    const assinatura = await criarAssinatura(req.negocioId, planoPedido, valorKz);

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
    const planoPedido = plano || 'PROFISSIONAL';
    const valorKz = PLANO_PRECO[planoPedido];
    if (valorKz === undefined) return res.status(400).json({ erro: 'Plano invalido' });
    if (valorKz === 0) return res.status(400).json({ erro: 'Este plano e gratis, nao precisa de pagamento' });

    const assinatura = await criarAssinatura(req.negocioId, planoPedido, valorKz);
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
    // Sem segredo configurado, o webhook fica desligado (nunca aceitar uma chave de teste)
    const segredo = process.env.EMIS_WEBHOOK_SECRET;
    if (!segredo) return false;
    const str = [campos.transactionId, campos.merchantId, campos.amount, campos.currency, campos.status, campos.timestamp].join('|');
    const calculada = crypto.createHmac('sha256', segredo).update(str).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(calculada), Buffer.from(signatureRecebida || ''));
  } catch { return false; }
}

module.exports = router;
