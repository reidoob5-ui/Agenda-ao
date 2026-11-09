// Pagamentos internacionais pelo Paddle (cartao, PayPal, Apple/Google Pay e Pix em reais).
// O Paddle e o vendedor legal ("merchant of record"): cobra, trata dos impostos e paga-te a ti.
// So funciona com PADDLE_API_KEY definida. Use PADDLE_ENV=sandbox para testar sem dinheiro real.
const crypto = require('crypto');

const configurado = () => !!process.env.PADDLE_API_KEY;
const base = () => process.env.PADDLE_ENV === 'sandbox' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

// Cria uma cobranca avulsa (1 mes de plano). valor em unidades inteiras (ex.: 9 USD); o Paddle quer centimos.
async function criarTransacao({ nomePlano, valor, moeda, urlPagamento }) {
  const corpo = {
    items: [{
      quantity: 1,
      price: {
        description: `Agenda Aqui ${nomePlano} — 1 mês`,
        name: `Agenda Aqui ${nomePlano}`,
        unit_price: { amount: String(Math.round(valor * 100)), currency_code: moeda },
        product: { name: `Agenda Aqui ${nomePlano}`, tax_category: 'saas' },
      },
    }],
    currency_code: moeda,
    ...(urlPagamento ? { checkout: { url: urlPagamento } } : {}),
  };
  const controlo = new AbortController();
  const timer = setTimeout(() => controlo.abort(), 20000);
  try {
    const r = await fetch(`${base()}/transactions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: controlo.signal,
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = dados.error || {};
      return { ok: false, erro: `${e.detail || e.code || 'Erro do Paddle'} (${r.status})` };
    }
    return { ok: true, id: dados.data?.id, url: dados.data?.checkout?.url || null };
  } catch (err) {
    return { ok: false, erro: err.name === 'AbortError' ? 'O Paddle demorou demasiado a responder' : err.message };
  } finally { clearTimeout(timer); }
}

// Cabecalho Paddle-Signature: "ts=1717000000;h1=<hex>"; assina-se `${ts}:${corpoBruto}` com HMAC-SHA256
function assinaturaValida(corpoBruto, cabecalho, segredo, toleranciaSeg = 300, agora = Date.now()) {
  try {
    if (!segredo || !cabecalho) return false;
    const campos = String(cabecalho).split(';').map(p => p.trim().split('='));
    const ts = Number((campos.find(c => c[0] === 'ts') || [])[1]);
    if (!ts || Math.abs(agora / 1000 - ts) > toleranciaSeg) return false;
    const esperado = crypto.createHmac('sha256', segredo).update(`${ts}:${corpoBruto}`).digest('hex');
    // Durante a troca do segredo o Paddle envia mais de um h1: basta um coincidir
    return campos.filter(c => c[0] === 'h1').some(c => {
      const recebido = String(c[1] || '');
      return recebido.length === esperado.length && crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido));
    });
  } catch { return false; }
}

module.exports = { configurado, criarTransacao, assinaturaValida };
