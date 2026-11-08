import { create } from 'zustand'
import pt from './pt'
import en from './en'
import es from './es'
import fr from './fr'

// Textos do painel ficam em i18n/painel/*.js (cada ficheiro: export default { pt:{}, en:{}, es:{}, fr:{} })
const extras = Object.values(import.meta.glob('./painel/*.js', { eager: true })).map((m) => m.default)
const juntar = (l, base) => Object.assign({}, base, ...extras.map((x) => x?.[l] || {}))
const DICIONARIOS = { pt: juntar('pt', pt), en: juntar('en', en), es: juntar('es', es), fr: juntar('fr', fr) }
export const IDIOMAS = [
  { codigo: 'pt', nome: 'Português' },
  { codigo: 'en', nome: 'English' },
  { codigo: 'es', nome: 'Español' },
  { codigo: 'fr', nome: 'Français' },
]
export const LOCALES = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR' }
const CHAVE = 'agendaao-idioma'

function lerEscolha() {
  try { const g = localStorage.getItem(CHAVE); return DICIONARIOS[g] ? g : null } catch { return null }
}

// Idioma do navegador (o que o utilizador tem no telemovel/computador), se for um dos suportados
export function idiomaDoNavegador() {
  const lista = (typeof navigator !== 'undefined' && (navigator.languages?.length ? navigator.languages : [navigator.language])) || []
  for (const l of lista) {
    const p = String(l).slice(0, 2).toLowerCase()
    if (DICIONARIOS[p]) return p
  }
  return null
}

// Paises de lingua portuguesa (pelo fuso horario do aparelho): Angola, Mocambique, Portugal, Brasil, etc.
const FUSOS_PT = /^(Africa\/(Luanda|Maputo|Bissau|Sao_Tome)|Atlantic\/(Cape_Verde|Madeira|Azores)|Europe\/Lisbon|Asia\/(Dili|Macau)|America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Rio_Branco|Maceio|Araguaina|Santarem|Noronha|Boa_Vista|Eirunepe))$/
export function idiomaDoFuso() {
  let tz = ''
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch {}
  return FUSOS_PT.test(tz) ? 'pt' : null
}

// Escolha manual > pais (fuso horario) lusofono > idioma do navegador > ingles (lingua franca)
const inicial = () => lerEscolha() || idiomaDoFuso() || idiomaDoNavegador() || 'en'

export const useIdioma = create((set) => ({
  idioma: inicial(),
  escolhido: !!lerEscolha(),
  setIdioma: (idioma) => {
    if (!DICIONARIOS[idioma]) return
    try { localStorage.setItem(CHAVE, idioma) } catch {}
    set({ idioma, escolhido: true })
  },
  // so usado se a pessoa nao escolheu e o navegador esta num idioma nao suportado
  sugerir: (idioma) => set((s) => (s.escolhido || idiomaDoFuso() || idiomaDoNavegador() || !DICIONARIOS[idioma] ? s : { idioma })),
}))

export function traduzir(idioma, chave, vars) {
  let texto = DICIONARIOS[idioma]?.[chave] ?? DICIONARIOS.pt[chave] ?? chave
  if (vars) texto = texto.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : ''))
  return texto
}

// const { t, idioma, locale } = useT();  t('nav.sair')  t('book.para', { servico })
export function useT() {
  const idioma = useIdioma((s) => s.idioma)
  return { t: (chave, vars) => traduzir(idioma, chave, vars), idioma, locale: LOCALES[idioma] || 'pt-PT' }
}
