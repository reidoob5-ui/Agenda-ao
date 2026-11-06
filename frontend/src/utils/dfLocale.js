import { pt, enGB, es, fr } from 'date-fns/locale'
// Locale do date-fns para o idioma activo: format(data, "EEEE, d MMMM", { locale: dfLocale(idioma) })
const MAPA = { pt, en: enGB, es, fr }
export const dfLocale = (idioma) => MAPA[idioma] || pt
