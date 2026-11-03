// Textos dos emails (e mensagens do servidor) nos idiomas suportados. Se faltar uma chave, usa portugues.
const TEXTOS = {
  pt: {
    novoTitulo: 'Nova marcação!', novoIntro: 'Tens uma nova marcação no painel de <strong>{negocio}</strong>.',
    cliente: 'Cliente', contacto: 'Contacto', servico: 'Serviço', profissional: 'Profissional',
    quando: 'Data e hora', valor: 'Valor', verPainel: 'Ver no painel', entrar: 'Entrar na consulta online',
    online: 'Consulta online', assuntoNovo: 'Nova marcação — {cliente} — {data} {hora}',
    confTitulo: '✅ Marcação confirmada!', confIntro: 'Olá <strong>{cliente}</strong>, a tua marcação em <strong>{negocio}</strong> foi aprovada.',
    duvida: 'Em caso de dúvida, contacta o negócio', assuntoConf: '✅ Marcação confirmada — {negocio} — {data} {hora}',
    lemTitulo: '⏰ Lembrete da tua marcação', lemIntro24: 'Olá <strong>{cliente}</strong>, a tua marcação em <strong>{negocio}</strong> é amanhã.',
    lemIntro2: 'Olá <strong>{cliente}</strong>, a tua marcação em <strong>{negocio}</strong> é daqui a pouco.',
    com: 'Com', naoPodes: 'Não podes ir? Avisa o negócio', assuntoLem: '⏰ Lembrete — {negocio} — {data} {hora}',
    fuso: 'Hora de {fuso}', rodape: 'Enviado por <strong>AgendaAO</strong> · um produto da <strong>Ada Lovelace Technologies</strong>', suporte: 'Suporte',
  },
  en: {
    novoTitulo: 'New booking!', novoIntro: 'You have a new booking in the <strong>{negocio}</strong> dashboard.',
    cliente: 'Client', contacto: 'Contact', servico: 'Service', profissional: 'Professional',
    quando: 'Date and time', valor: 'Price', verPainel: 'Open dashboard', entrar: 'Join the online session',
    online: 'Online session', assuntoNovo: 'New booking — {cliente} — {data} {hora}',
    confTitulo: '✅ Booking confirmed!', confIntro: 'Hi <strong>{cliente}</strong>, your booking at <strong>{negocio}</strong> has been approved.',
    duvida: 'Any questions? Contact the business', assuntoConf: '✅ Booking confirmed — {negocio} — {data} {hora}',
    lemTitulo: '⏰ Your booking reminder', lemIntro24: 'Hi <strong>{cliente}</strong>, your booking at <strong>{negocio}</strong> is tomorrow.',
    lemIntro2: 'Hi <strong>{cliente}</strong>, your booking at <strong>{negocio}</strong> is coming up soon.',
    com: 'With', naoPodes: "Can't make it? Let the business know", assuntoLem: '⏰ Reminder — {negocio} — {data} {hora}',
    fuso: '{fuso} time', rodape: 'Sent by <strong>AgendaAO</strong> · a product of <strong>Ada Lovelace Technologies</strong>', suporte: 'Support',
  },
  es: {
    novoTitulo: '¡Nueva reserva!', novoIntro: 'Tienes una nueva reserva en el panel de <strong>{negocio}</strong>.',
    cliente: 'Cliente', contacto: 'Contacto', servico: 'Servicio', profissional: 'Profesional',
    quando: 'Fecha y hora', valor: 'Precio', verPainel: 'Ver el panel', entrar: 'Entrar a la sesión online',
    online: 'Sesión online', assuntoNovo: 'Nueva reserva — {cliente} — {data} {hora}',
    confTitulo: '✅ ¡Reserva confirmada!', confIntro: 'Hola <strong>{cliente}</strong>, tu reserva en <strong>{negocio}</strong> ha sido aprobada.',
    duvida: '¿Dudas? Contacta con el negocio', assuntoConf: '✅ Reserva confirmada — {negocio} — {data} {hora}',
    lemTitulo: '⏰ Recordatorio de tu reserva', lemIntro24: 'Hola <strong>{cliente}</strong>, tu reserva en <strong>{negocio}</strong> es mañana.',
    lemIntro2: 'Hola <strong>{cliente}</strong>, tu reserva en <strong>{negocio}</strong> es muy pronto.',
    com: 'Con', naoPodes: '¿No puedes ir? Avisa al negocio', assuntoLem: '⏰ Recordatorio — {negocio} — {data} {hora}',
    fuso: 'Hora de {fuso}', rodape: 'Enviado por <strong>AgendaAO</strong> · un producto de <strong>Ada Lovelace Technologies</strong>', suporte: 'Soporte',
  },
  fr: {
    novoTitulo: 'Nouvelle réservation !', novoIntro: 'Vous avez une nouvelle réservation dans le tableau de bord de <strong>{negocio}</strong>.',
    cliente: 'Client', contacto: 'Contact', servico: 'Service', profissional: 'Professionnel',
    quando: 'Date et heure', valor: 'Prix', verPainel: 'Ouvrir le tableau de bord', entrar: 'Rejoindre la séance en ligne',
    online: 'Séance en ligne', assuntoNovo: 'Nouvelle réservation — {cliente} — {data} {hora}',
    confTitulo: '✅ Réservation confirmée !', confIntro: 'Bonjour <strong>{cliente}</strong>, votre réservation chez <strong>{negocio}</strong> a été approuvée.',
    duvida: 'Une question ? Contactez l’établissement', assuntoConf: '✅ Réservation confirmée — {negocio} — {data} {hora}',
    lemTitulo: '⏰ Rappel de votre réservation', lemIntro24: 'Bonjour <strong>{cliente}</strong>, votre réservation chez <strong>{negocio}</strong> est demain.',
    lemIntro2: 'Bonjour <strong>{cliente}</strong>, votre réservation chez <strong>{negocio}</strong> approche.',
    com: 'Avec', naoPodes: 'Vous ne pouvez pas venir ? Prévenez l’établissement', assuntoLem: '⏰ Rappel — {negocio} — {data} {hora}',
    fuso: 'Heure de {fuso}', rodape: 'Envoyé par <strong>AgendaAO</strong> · un produit de <strong>Ada Lovelace Technologies</strong>', suporte: 'Support',
  },
};

const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// tr('en', 'confIntro', { cliente: 'Ana', negocio: 'Salon X' }) — os valores sao escapados (HTML seguro)
function tr(idioma, chave, vars = {}, escapa = true) {
  const base = (TEXTOS[idioma] && TEXTOS[idioma][chave]) ?? TEXTOS.pt[chave] ?? chave;
  return base.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? (escapa ? escapar(vars[k]) : String(vars[k] ?? '')) : ''));
}

module.exports = { TEXTOS, tr, escapar };
