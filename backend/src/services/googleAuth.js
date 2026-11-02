// Verificacao do "Entrar com Google" sem dependencias extra.
// O Google devolve um token (JWT RS256). Confirmamos a assinatura com as chaves
// publicas do Google e verificamos que foi emitido para ESTE site (audience).
const crypto = require('crypto');

const URL_CHAVES = 'https://www.googleapis.com/oauth2/v3/certs';
const EMISSORES = ['https://accounts.google.com', 'accounts.google.com'];
let cache = { keys: null, ate: 0 };

async function obterChavesGoogle() {
  if (cache.keys && Date.now() < cache.ate) return cache.keys;
  const axios = require('axios');
  const r = await axios.get(URL_CHAVES, { timeout: 8000 });
  cache = { keys: r.data.keys, ate: Date.now() + 60 * 60 * 1000 };
  return cache.keys;
}

function googleConfigurado() {
  return !!process.env.GOOGLE_CLIENT_ID;
}

function lerParteJson(parte) {
  return JSON.parse(Buffer.from(parte, 'base64url').toString('utf8'));
}

// Devolve { email, nome, foto, sub } ou lanca erro se o token nao for valido
async function verificarTokenGoogle(credential, opcoes = {}) {
  const clientId = opcoes.clientId || process.env.GOOGLE_CLIENT_ID;
  const obterChaves = opcoes.obterChaves || obterChavesGoogle;
  const agora = opcoes.agora ? opcoes.agora() : Date.now();
  if (!clientId) throw new Error('GOOGLE_NAO_CONFIGURADO');
  if (typeof credential !== 'string') throw new Error('Token em falta');

  const partes = credential.split('.');
  if (partes.length !== 3) throw new Error('Token inválido');

  let cabecalho, payload;
  try {
    cabecalho = lerParteJson(partes[0]);
    payload = lerParteJson(partes[1]);
  } catch { throw new Error('Token inválido'); }

  if (cabecalho.alg !== 'RS256' || !cabecalho.kid) throw new Error('Token inválido');

  const chaves = await obterChaves();
  const jwk = chaves.find(k => k.kid === cabecalho.kid);
  if (!jwk) throw new Error('Chave do Google não encontrada');

  const chavePublica = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const assinaturaOk = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${partes[0]}.${partes[1]}`),
    chavePublica,
    Buffer.from(partes[2], 'base64url')
  );
  if (!assinaturaOk) throw new Error('Assinatura inválida');

  if (!EMISSORES.includes(payload.iss)) throw new Error('Emissor inválido');
  const audiencias = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiencias.includes(clientId)) throw new Error('Token emitido para outro site');
  if (!payload.exp || payload.exp * 1000 < agora) throw new Error('Token expirado');
  if (!payload.email || payload.email_verified !== true) throw new Error('Email do Google não verificado');

  return {
    email: String(payload.email).toLowerCase(),
    nome: payload.name || String(payload.email).split('@')[0],
    foto: payload.picture || null,
    sub: payload.sub,
  };
}

module.exports = { verificarTokenGoogle, googleConfigurado };
