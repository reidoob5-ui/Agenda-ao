// Espelho do servidor (backend/src/utils/planos.js). O servidor e quem bloqueia de verdade;
// aqui so decidimos o que mostrar. Se mudares um, muda o outro.
import { useAuthStore } from '../store/authStore'

const ORDEM = { BASICO: 0, PROFISSIONAL: 1, PREMIUM: 2 }

export const RECURSOS = {
  crm: 'PROFISSIONAL',
  relatoriosFinanceiros: 'PROFISSIONAL',
  emailLembretes: 'PROFISSIONAL',
  logoPagina: 'PROFISSIONAL',
  whatsappAutomatico: 'PREMIUM',
  fidelidade: 'PREMIUM',
  relatoriosAvancados: 'PREMIUM',
  listaEspera: 'PREMIUM',
  corPropria: 'PREMIUM',
  semMarca: 'PREMIUM',
  suportePrioritario: 'PREMIUM',
}

export const NOMES_PLANO = { BASICO: 'Básico', PROFISSIONAL: 'Profissional', PREMIUM: 'Premium' }

export function temRecurso(plano, recurso) {
  const minimo = RECURSOS[recurso]
  return !!minimo && (ORDEM[plano] ?? 0) >= ORDEM[minimo]
}

// Uso: const { tem, plano } = usePlano();  tem('crm')
export function usePlano() {
  const plano = useAuthStore(s => s.negocio?.plano) || 'BASICO'
  return { plano, tem: (recurso) => temRecurso(plano, recurso) }
}

// ----- Cor da marca (Premium) -----
// Gera as tonalidades 50..900 a partir de UMA cor, como "R G B" para as variaveis CSS
function hexParaRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const misturar = (c, alvo, t) => c.map((v, i) => Math.round(v + (alvo[i] - v) * t))

export function estiloDaMarca(hex) {
  const base = hexParaRgb(hex)
  if (!base) return undefined
  const B = [255, 255, 255], P = [0, 0, 0]
  const tons = {
    50: misturar(base, B, 0.92), 100: misturar(base, B, 0.84), 200: misturar(base, B, 0.68),
    300: misturar(base, B, 0.5), 400: misturar(base, B, 0.25), 500: misturar(base, B, 0.08),
    600: base, 700: misturar(base, P, 0.18), 800: misturar(base, P, 0.34), 900: misturar(base, P, 0.5),
  }
  const estilo = {}
  for (const [k, v] of Object.entries(tons)) estilo[`--brand-${k}`] = v.join(' ')
  return estilo
}
