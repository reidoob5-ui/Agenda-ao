// Atalho de WhatsApp sem API: abre o WhatsApp (app ou web) com a mensagem já escrita.
// Não precisa de conta Meta Business nem de aprovação.
import { useAuthStore } from '../store/authStore'

// Indicativo por defeito conforme o fuso do negócio (números locais, sem +)
const DDI_POR_FUSO = {
  'Africa/Luanda': '244', 'Africa/Maputo': '258', 'Atlantic/Cape_Verde': '238', 'Africa/Johannesburg': '27',
  'America/Sao_Paulo': '55', 'America/Fortaleza': '55', 'America/Manaus': '55', 'America/Bahia': '55', 'America/Recife': '55',
  'Europe/Lisbon': '351', 'Atlantic/Azores': '351', 'Europe/Madrid': '34', 'Europe/Paris': '33', 'Europe/London': '44',
  'America/New_York': '1', 'America/Chicago': '1', 'America/Denver': '1', 'America/Los_Angeles': '1', 'America/Toronto': '1',
  'America/Mexico_City': '52',
}

// "+34 612..." ou "0034..." ficam como estão; "923456789" recebe o indicativo do país do negócio
export function normalizarTelefone(tel) {
  const bruto = String(tel || '').trim()
  const internacional = bruto.startsWith('+') || bruto.startsWith('00')
  let d = bruto.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (!internacional) {
    const fuso = useAuthStore.getState().negocio?.fusoHorario || 'Africa/Luanda'
    const ddi = DDI_POR_FUSO[fuso]
    if (ddi && !d.startsWith(ddi)) d = ddi + d.replace(/^0+/, '')
  }
  return d
}

export function linkWhatsApp(telefone, mensagem) {
  const numero = normalizarTelefone(telefone)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
