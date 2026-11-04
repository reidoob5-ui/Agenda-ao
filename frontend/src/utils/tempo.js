// Horas no fuso de um negocio (espelho de backend/src/utils/tempo.js), para mostrar tudo certo em qualquer pais.
export const FUSO_PADRAO = 'Africa/Luanda'

export const fusoDoNavegador = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return null } }

function partes(date, tz) {
  const p = {}
  for (const x of new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date)) p[x.type] = x.value
  return p
}

function offsetMin(date, tz) {
  const p = partes(date, tz)
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(date.getTime() / 1000) * 1000) / 60000)
}

// "2026-11-05" + "09:00" no fuso -> instante real
export function paraInstante(dataStr, horaStr, tz = FUSO_PADRAO) {
  const [y, mo, d] = dataStr.split('-').map(Number)
  const [h, mi] = (horaStr || '00:00').split(':').map(Number)
  const palpite = Date.UTC(y, mo - 1, d, h, mi || 0, 0)
  let t = palpite - offsetMin(new Date(palpite), tz) * 60000
  t = palpite - offsetMin(new Date(t), tz) * 60000
  return new Date(t)
}

export function hojeNoFuso(tz = FUSO_PADRAO, agora = new Date()) {
  const p = partes(agora, tz)
  return `${p.year}-${p.month}-${p.day}`
}

export function somarDias(dataStr, n) {
  const [y, m, d] = dataStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// { semana: 'qui', dia: '5', mes: 'nov' } para os botoes de datas
export function rotuloDia(dataStr, locale) {
  const [y, m, d] = dataStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const f = (opts) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(dt)
  return { semana: f({ weekday: 'short' }), dia: f({ day: 'numeric' }), mes: f({ month: 'short' }) }
}

export function fmtHora(valor, tz, locale) {
  return new Date(valor).toLocaleTimeString(locale, { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}
export function fmtDataLonga(valor, tz, locale) {
  return new Date(valor).toLocaleDateString(locale, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
export function fmtDataCurta(valor, tz, locale) {
  return new Date(valor).toLocaleDateString(locale, { timeZone: tz, day: 'numeric', month: 'long' })
}

// Nome curto do fuso (ex.: "Luanda", "Sao Paulo")
export const nomeDoFuso = (tz) => String(tz || '').split('/').pop().replace(/_/g, ' ')

// Lista de fusos para escolher nas configuracoes (os do navegador; se nao suportar, uma lista curta)
export function listaDeFusos() {
  try { if (Intl.supportedValuesOf) return Intl.supportedValuesOf('timeZone') } catch {}
  return ['Africa/Luanda', 'Africa/Maputo', 'Africa/Johannesburg', 'Atlantic/Cape_Verde', 'Europe/Lisbon', 'Europe/London', 'Europe/Paris', 'Europe/Madrid',
    'America/Sao_Paulo', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City', 'America/Toronto', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney']
}
