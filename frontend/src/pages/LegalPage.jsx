import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { useT } from '../i18n'
import { legal, ATUALIZADO } from '../i18n/legal'
import { EMPRESA, EMAIL_SUPORTE } from '../utils/marca'
import SeletorIdioma from '../components/SeletorIdioma'

// tipo: 'termos' | 'privacidade'
export default function LegalPage({ tipo }) {
  const { t, idioma, locale } = useT()
  const doc = legal(idioma, tipo)
  const sub = (txt) => txt.replace(/\{empresa\}/g, EMPRESA).replace(/\{email\}/g, EMAIL_SUPORTE).replace(/\{produto\}/g, 'Agenda Aqui')
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-900"><CalendarCheck size={18} className="text-brand-600" /><span className="font-display font-bold">Agenda Aqui</span></Link>
          <SeletorIdioma />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">{doc.titulo}</h1>
        <p className="text-xs text-slate-400 mb-8">{t('legal.atualizado')}: {new Date(ATUALIZADO).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div className="space-y-6">
          {doc.secoes.map(([h, p]) => (
            <section key={h}>
              <h2 className="font-semibold text-slate-800 mb-1.5">{h}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{sub(p)}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-slate-100 flex gap-5 text-sm">
          <Link to="/termos" className="text-brand-700 hover:underline">{t('legal.termos')}</Link>
          <Link to="/privacidade" className="text-brand-700 hover:underline">{t('legal.privacidade')}</Link>
        </div>
      </main>
    </div>
  )
}
