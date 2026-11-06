// Horas e fusos horarios. Todas as horas de um negocio sao as do FUSO DO NEGOCIO
// (ex.: 09:00 em Luanda, Sao Paulo ou Nova Iorque), independentemente de onde esta o servidor.
const FUSO_PADRAO = 'Africa/Luanda';

function fusoValido(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return typeof tz === 'string' && tz.length > 0; }
  catch { return false; }
}

function partes(date, tz) {
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(date)) p[x.type] = x.value;
  return p;
}

// Diferenca (minutos) entre o fuso e UTC naquele instante. Ex.: Luanda = 60, Sao Paulo = -180
function offsetMin(date, tz) {
  const p = partes(date, tz);
  const comoUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((comoUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

// "2026-11-05" + "09:00" no fuso -> instante real (Date)
function paraInstante(dataStr, horaStr, tz = FUSO_PADRAO) {
  const [y, mo, d] = dataStr.split('-').map(Number);
  const [h, mi] = (horaStr || '00:00').split(':').map(Number);
  const palpite = Date.UTC(y, mo - 1, d, h, mi || 0, 0);
  let t = palpite - offsetMin(new Date(palpite), tz) * 60000;
  const off2 = offsetMin(new Date(t), tz);
  t = palpite - off2 * 60000; // corrige mudancas de hora de verao
  return new Date(t);
}

const SEM_OFFSET = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/;

// Aceita "2026-11-05T09:00:00" (hora do negocio) ou um instante com Z/offset (absoluto)
function interpretarDataHora(valor, tz = FUSO_PADRAO) {
  const s = String(valor || '').trim();
  const m = SEM_OFFSET.exec(s);
  if (m) return paraInstante(m[1], m[2], tz);
  return new Date(s);
}

// Inicio (inclusivo) e fim (exclusivo) do dia no fuso do negocio
function limitesDoDia(dataStr, tz = FUSO_PADRAO) {
  const inicio = paraInstante(dataStr, '00:00', tz);
  const [y, m, d] = dataStr.split('-').map(Number);
  const prox = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return { inicio, fim: paraInstante(prox, '00:00', tz) };
}

function diaSemana(dataStr) {
  const [y, m, d] = dataStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// "hoje" no fuso do negocio, como YYYY-MM-DD
function hojeNoFuso(tz = FUSO_PADRAO, agora = new Date()) {
  const p = partes(agora, tz);
  return `${p.year}-${p.month}-${p.day}`;
}

// Minutos desde a meia-noite, no fuso (ex.: 09:30 -> 570)
function minutosDoDia(date, tz = FUSO_PADRAO) {
  const p = partes(new Date(date), tz);
  return (+p.hour) * 60 + (+p.minute);
}

const LOCALES = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR' };

function formatarQuando(date, tz = FUSO_PADRAO, idioma = 'pt') {
  const d = new Date(date);
  const loc = LOCALES[idioma] || 'pt-PT';
  return {
    data: d.toLocaleDateString(loc, { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora: d.toLocaleTimeString(loc, { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  };
}

module.exports = {
  FUSO_PADRAO, fusoValido, offsetMin, paraInstante, interpretarDataHora,
  limitesDoDia, diaSemana, hojeNoFuso, minutosDoDia, formatarQuando, LOCALES,
};

// Indicativo telefonico por defeito conforme o fuso do negocio (numeros locais sem +)
const DDI_POR_FUSO = {
  'Africa/Luanda': '244', 'Africa/Maputo': '258', 'Atlantic/Cape_Verde': '238', 'Africa/Johannesburg': '27',
  'America/Sao_Paulo': '55', 'America/Fortaleza': '55', 'America/Manaus': '55', 'America/Bahia': '55', 'America/Recife': '55',
  'Europe/Lisbon': '351', 'Atlantic/Azores': '351', 'Europe/Madrid': '34', 'Europe/Paris': '33', 'Europe/London': '44',
  'America/New_York': '1', 'America/Chicago': '1', 'America/Denver': '1', 'America/Los_Angeles': '1', 'America/Toronto': '1',
  'America/Mexico_City': '52',
};
const ddiDoFuso = (fuso) => DDI_POR_FUSO[fuso] || '';
module.exports.ddiDoFuso = ddiDoFuso;
