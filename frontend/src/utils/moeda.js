import { useAuthStore } from '../store/authStore'
import { LOCALES } from '../i18n'

export const MOEDAS = [
  { codigo: 'AOA', nome: 'Kwanza (Kz)' }, { codigo: 'USD', nome: 'US Dollar ($)' }, { codigo: 'EUR', nome: 'Euro (€)' },
  { codigo: 'BRL', nome: 'Real (R$)' }, { codigo: 'GBP', nome: 'Pound (£)' }, { codigo: 'MZN', nome: 'Metical (MT)' },
  { codigo: 'CVE', nome: 'Escudo (CVE)' }, { codigo: 'ZAR', nome: 'Rand (R)' }, { codigo: 'MXN', nome: 'Peso mexicano (MX$)' }, { codigo: 'CAD', nome: 'Canadian Dollar (C$)' },
]

export function fmtMoeda(valor, moeda = 'AOA', locale = 'pt-PT') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: moeda, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(valor || 0)
  } catch { return `${valor || 0} ${moeda}` }
}

const FUSOS_BR = /^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Rio_Branco|Maceio|Araguaina|Santarem|Noronha|Boa_Vista|Eirunepe)$/

// Moeda "natural" de quem visita (para mostrar os precos): Angola->Kz, Brasil->R$, Europa->EUR, resto->USD
export function moedaSugerida() {
  let tz = ''
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch {}
  if (tz === 'Africa/Luanda') return 'AOA'
  if (FUSOS_BR.test(tz)) return 'BRL'
  if (/^Europe\//.test(tz) && !/London|Dublin|Belfast|Moscow|Kyiv|Minsk|Istanbul/.test(tz)) return 'EUR'
  const langs = (typeof navigator !== 'undefined' && (navigator.languages?.length ? navigator.languages : [navigator.language])) || []
  if (langs.some((l) => /-AO$/i.test(l))) return 'AOA'
  const lang = langs[0] || ''
  if (/-BR$/i.test(lang)) return 'BRL'
  return 'USD'
}

// Dinheiro no painel do dono: usa a moeda configurada no negocio (por defeito Kz)
export function fmtDinheiro(v) {
  const n = useAuthStore.getState().negocio
  return fmtMoeda(v, n?.moeda || 'AOA', LOCALES[n?.idioma] || 'pt-PT')
}
