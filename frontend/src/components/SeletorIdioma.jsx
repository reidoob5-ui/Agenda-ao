import { useEffect } from 'react'
import { Globe } from 'lucide-react'
import { IDIOMAS, useIdioma } from '../i18n'

// Escolher idioma. Fica por defeito no idioma do navegador da pessoa.
export default function SeletorIdioma({ className = '', escuro = false }) {
  const { idioma, setIdioma } = useIdioma()
  useEffect(() => { document.documentElement.lang = idioma }, [idioma])
  return (
    <label className={`inline-flex items-center gap-1.5 text-sm ${escuro ? 'text-slate-300' : 'text-slate-500'} ${className}`}>
      <Globe size={15} aria-hidden />
      <span className="sr-only">Language</span>
      <select value={idioma} onChange={(e) => setIdioma(e.target.value)}
        className={`bg-transparent border-0 py-1 pr-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 rounded ${escuro ? 'text-slate-200' : 'text-slate-600'}`}>
        {IDIOMAS.map(i => <option key={i.codigo} value={i.codigo} className="text-slate-900">{i.nome}</option>)}
      </select>
    </label>
  )
}
