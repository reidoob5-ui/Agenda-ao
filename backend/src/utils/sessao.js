const crypto = require('crypto');

// Link da consulta online. Se o negocio tem o seu proprio link (Zoom, Meet, Teams...) usa esse;
// senao cria uma sala gratuita no Jitsi Meet (sem conta, sem instalar, funciona no telemovel e no PC).
function gerarLinkSessao(negocio, servico) {
  if (!servico?.online) return null;
  if (negocio?.linkSessaoPadrao) return negocio.linkSessaoPadrao;
  return `https://meet.jit.si/AgendaAqui-${crypto.randomBytes(9).toString('hex')}`;
}

module.exports = { gerarLinkSessao };
