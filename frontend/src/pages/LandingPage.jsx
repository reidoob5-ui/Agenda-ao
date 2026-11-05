import { Link } from 'react-router-dom'
import { DepoimentosRotativos } from '../components/Depoimentos'
import AssinaturaAda from '../components/AssinaturaAda'
import { useState } from 'react'
import { CalendarCheck, Bell, Video, Globe, Wallet, Star, ArrowRight, Check } from 'lucide-react'
import SeletorIdioma from '../components/SeletorIdioma'
import { useT } from '../i18n'
import { PRECOS, MOEDAS_PRECO } from '../utils/planos'
import { fmtMoeda, moedaSugerida } from '../utils/moeda'

const PLANOS = [
  { key: 'BASICO', popular: false, prof: 'plano.prof1', features: ['plano.b1', 'plano.b2', 'plano.b3', 'plano.b4', 'plano.b5'] },
  { key: 'PROFISSIONAL', popular: true, prof: 'plano.prof5', features: ['plano.p0', 'plano.p1', 'plano.p2', 'plano.p3', 'plano.p4', 'plano.p5', 'plano.p6'] },
  { key: 'PREMIUM', popular: false, prof: 'plano.profIlim', features: ['plano.m0', 'plano.m1', 'plano.m2', 'plano.m3', 'plano.m4', 'plano.m5', 'plano.m6', 'plano.m7'] },
]

export default function LandingPage() {
  const { t, locale } = useT()
  const [moeda, setMoeda] = useState(moedaSugerida())
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">AgendaAO</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#funcionalidades" className="hover:text-slate-900 transition-colors">{t('land.funcionalidades')}</a>
            <a href="#precos" className="hover:text-slate-900 transition-colors">{t('land.precos')}</a>
            <Link to="/depoimentos" className="hover:text-slate-900 transition-colors">{t('land.depoimentos')}</Link>
          </div>
          <div className="flex items-center gap-3">
            <SeletorIdioma />
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">{t('comum.entrar')}</Link>
            <Link to="/criar" className="btn-primary">{t('comum.comecarGratis')}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
          {t('land.badge')}
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
          {t('land.titulo1')}<br />
          <span className="text-brand-600">{t('land.titulo2')}</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          {t('land.texto1')}<br />
          {t('land.texto2')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/criar" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            {t('comum.criarConta')} <ArrowRight size={18} />
          </Link>
          <Link to="/b/demo" className="btn-ghost text-base px-8 py-3">
            {t('land.demo')}
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-4">{t('land.semCartao')}</p>
      </section>

      {/* Depoimentos reais, um de cada vez */}
      <DepoimentosRotativos />

      {/* Funcionalidades */}
      <section id="funcionalidades" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center mb-2">{t('land.tudoTitulo')}</h2>
          <p className="text-slate-500 text-center mb-12">{t('land.tudoSub')}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: CalendarCheck, k: 'f1', cor: 'text-brand-600 bg-brand-50' },
              { icon: Video, k: 'f2', cor: 'text-teal-600 bg-teal-50' },
              { icon: Bell, k: 'f3', cor: 'text-green-600 bg-green-50' },
              { icon: Globe, k: 'f4', cor: 'text-blue-600 bg-blue-50' },
              { icon: Wallet, k: 'f5', cor: 'text-purple-600 bg-purple-50' },
              { icon: Star, k: 'f6', cor: 'text-rose-600 bg-rose-50' },
            ].map(({ icon: Icon, k, cor }) => (
              <div key={k} className="card p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${cor}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1.5">{t(`land.${k}t`)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(`land.${k}d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center mb-2">{t('land.precosTitulo')}</h2>
          <p className="text-slate-500 text-center mb-6">{t('land.precosSub')}</p>
          <div className="flex justify-center gap-1.5 mb-10" role="tablist" aria-label={t('comum.moeda')}>
            {MOEDAS_PRECO.map(m => (
              <button key={m} role="tab" aria-selected={moeda === m} onClick={() => setMoeda(m)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${moeda === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANOS.map((p) => (
              <div key={p.key} className={`card p-7 relative ${p.popular ? 'border-2 border-brand-500 shadow-soft' : ''}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {t('land.popular')}
                  </span>
                )}
                <p className="font-display font-bold text-slate-800 text-lg mb-1">{t(`plano.${p.key}`)}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-3xl font-bold text-slate-900">
                    {p.key === 'BASICO' ? t('comum.gratis') : fmtMoeda(PRECOS[p.key][moeda], moeda, locale)}
                  </span>
                  {p.key !== 'BASICO' && <span className="text-slate-400 text-sm">{t('comum.porMes')}</span>}
                </div>
                <p className="text-xs text-slate-400 mb-6">{t(p.prof)}</p>
                <Link to="/criar" className={`block text-center py-2.5 rounded-xl text-sm font-semibold mb-6 transition-all
                  ${p.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  {t('land.comecarAgora')}
                </Link>
                <ul className="space-y-2.5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Check size={14} className="text-green-500 shrink-0" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            {t('land.ctaTitulo')}
          </h2>
          <p className="text-brand-100 mb-8">{t('land.ctaTexto')}</p>
          <Link to="/criar" className="bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all inline-flex items-center gap-2">
            {t('comum.criarConta')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white">
            <CalendarCheck size={16} />
            <span className="font-display font-bold">AgendaAO</span>
          </div>
          <AssinaturaAda fundo="escuro" comEmail />
          <p className="text-slate-500 text-sm">{t('land.rodape', { ano: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  )
}
