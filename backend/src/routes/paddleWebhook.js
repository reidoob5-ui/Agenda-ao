// Recebe os avisos do Paddle (pagamento concluido) e ativa o plano automaticamente.
// Montado ANTES do express.json (precisa do corpo em bruto para validar a assinatura).
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { assinaturaValida } = require('../services/paddle');
const { processarPagamentoAprovado } = require('../services/assinaturas');
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const bruto = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!assinaturaValida(bruto, req.get('paddle-signature'), process.env.PADDLE_WEBHOOK_SECRET)) {
    return res.status(401).json({ erro: 'Assinatura inválida' });
  }

  try {
    const evento = JSON.parse(bruto);
    if (evento.event_type === 'transaction.completed') {
      const dados = evento.data || {};
      const pagamento = await prisma.pagamento.findUnique({ where: { transactionId: dados.id } });
      if (pagamento && pagamento.status !== 'APROVADO') {
        if (dados.currency_code && dados.currency_code !== pagamento.moeda) {
          console.error('[Paddle] moeda diferente da esperada, ignorado:', dados.id);
        } else {
          await prisma.pagamento.update({ where: { id: pagamento.id }, data: { webhookPayload: bruto.slice(0, 20000) } });
          await processarPagamentoAprovado(pagamento.id);
          console.log(`[Paddle] Pagamento ${pagamento.id} aprovado`);
        }
      }
    }
    res.status(200).json({ recebido: true });
  } catch (err) {
    // 500 faz o Paddle tentar outra vez mais tarde (nao perder um pagamento por falha passageira)
    console.error('[Paddle] webhook:', err.message);
    res.status(500).json({ erro: 'Falha ao processar' });
  }
});

module.exports = router;
