import { Link } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarCheck, Bell, Video, Check, Plus } from 'lucide-react'
import { DepoimentosRotativos } from '../components/Depoimentos'
import AssinaturaAda from '../components/AssinaturaAda'
import SeletorIdioma from '../components/SeletorIdioma'
import { useT, useIdioma, IDIOMAS } from '../i18n'
import { PRECOS, MOEDAS_PRECO } from '../utils/planos'
import { fmtMoeda, moedaSugerida } from '../utils/moeda'
import { fmtHora } from '../utils/tempo'
import Illustracao3D from '../components/Illustracao3D'
import { MARCA } from '../utils/marca'
import './landing.css'

const PLANOS = [
  { key: 'BASICO', popular: false, prof: 'plano.prof1', features: ['plano.b1', 'plano.b2', 'plano.b3', 'plano.b4', 'plano.b5'] },
  { key: 'PROFISSIONAL', popular: true, prof: 'plano.prof5', features: ['plano.p0', 'plano.p1', 'plano.p2', 'plano.p3', 'plano.p4', 'plano.p5', 'plano.p6'] },
  { key: 'PREMIUM', popular: false, prof: 'plano.profIlim', features: ['plano.m0', 'plano.m1', 'plano.m2', 'plano.m3', 'plano.m4', 'plano.m5', 'plano.m6', 'plano.m7'] },
]

const CIDADES = [
  { id: 'luanda', tz: 'Africa/Luanda', n: { pt: 'Luanda', en: 'Luanda', es: 'Luanda', fr: 'Luanda' } },
  { id: 'sp', tz: 'America/Sao_Paulo', n: { pt: 'São Paulo', en: 'São Paulo', es: 'São Paulo', fr: 'São Paulo' } },
  { id: 'lis', tz: 'Europe/Lisbon', n: { pt: 'Lisboa', en: 'Lisbon', es: 'Lisboa', fr: 'Lisbonne' } },
  { id: 'ny', tz: 'America/New_York', n: { pt: 'Nova Iorque', en: 'New York', es: 'Nueva York', fr: 'New York' } },
  { id: 'mpm', tz: 'Africa/Maputo', n: { pt: 'Maputo', en: 'Maputo', es: 'Maputo', fr: 'Maputo' } },
  { id: 'lon', tz: 'Europe/London', n: { pt: 'Londres', en: 'London', es: 'Londres', fr: 'Londres' } },
]

// Exemplos ilustrativos do quadro de marcacoes
const CENAS = [
  { cidade: 'luanda', serv: 'lp.s1', quem: 'lp.p1', hora: '14:30', moeda: 'AOA', valor: 12000, pag: 'Multicaixa Express', online: false },
  { cidade: 'sp', serv: 'lp.s2', quem: 'lp.p2', hora: '10:00', moeda: 'BRL', valor: 180, pag: 'Pix', online: true },
  { cidade: 'lis', serv: 'lp.s3', quem: 'lp.p3', hora: '16:15', moeda: 'EUR', valor: 60, pag: 'lp.pagCartao', online: true },
  { cidade: 'ny', serv: 'lp.s4', quem: 'lp.p4', hora: '09:00', moeda: 'USD', valor: 90, pag: 'PayPal', online: true },
]

const reduzMovimento = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useAgora(ms) {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setAgora(new Date()), ms); return () => clearInterval(id) }, [ms])
  return agora
}

function useVisto(ref) {
  const [visto, setVisto] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setVisto(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisto(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return visto
}

function Visto() {
  return (
    <svg className="lp-check" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="9" fill="#16a34a" />
      <path d="M5 9.4l2.6 2.6L13 6.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- Topo: quadro de marcacoes ao vivo ---------- */
function QuadroMarcacoes({ t, locale, idioma }) {
  const [i, setI] = useState(0)
  const agora = useAgora(15000)
  useEffect(() => {
    if (reduzMovimento()) return
    const id = setInterval(() => setI((x) => (x + 1) % CENAS.length), 4800)
    return () => clearInterval(id)
  }, [i])
  const c = CENAS[i]
  const cid = CIDADES.find((x) => x.id === c.cidade)
  const rotuloPag = c.pag.startsWith('lp.') ? t(c.pag) : c.pag
  return (
    <div className="relative lp-hero-visual">
      <div className="lp-hero-photo">
        <div className="lp-hero-glow" />
        <img className="lp-hero-person" src="/images/hero-profissional.webp?v=3" alt={t('lp.heroAlt')} fetchPriority="high" />
      </div>
      <div className="lp-hero-decoration lp-hero-decoration--calendar"><Illustracao3D type="calendar" size="small" /></div>
      <div className="lp-hero-decoration lp-hero-decoration--reminder"><Illustracao3D type="reminder" size="small" /></div>
      <div className="lp-board" aria-live="polite">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{cid.n[idioma] || cid.n.en}</span>
          <span className="lp-tabular">{fmtHora(agora, cid.tz, locale)}</span>
        </div>
        <div key={i} className="lp-swap">
          <p className="lp-display text-7xl font-extrabold mt-5 lp-tabular">{c.hora}</p>
          <p className="text-xl font-semibold mt-2">{t(c.serv)}</p>
          <p className="text-slate-500">{t(c.quem)}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.online ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
              {c.online && <Video size={12} />}{c.online ? t('lp.online') : t('book.presencial')}
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600">{rotuloPag}</span>
          </div>
          <div className="flex items-end justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
            <span className="lp-display text-3xl font-bold">{fmtMoeda(c.valor, c.moeda, locale)}</span>
            <span className="flex items-center gap-2 text-sm font-medium text-green-700"><Visto />{t('lp.confirmada')}</span>
          </div>
        </div>
      </div>
      <div className="lp-float" role="status">
        <Bell size={16} aria-hidden />
        <span>{t('lp.lembrete')}</span>
      </div>
      <div className="flex items-center gap-2 mt-10 justify-end">
        <span className="text-xs text-slate-400 mr-1">{t('lp.exemplo')}</span>
        {CENAS.map((s, n) => (
          <button key={s.cidade} onClick={() => setI(n)} aria-label={CIDADES.find((x) => x.id === s.cidade).n[idioma]}
            aria-current={n === i} className={`h-2.5 rounded-full transition-all ${n === i ? 'w-7 bg-brand-500' : 'w-2.5 bg-rose-200 hover:bg-rose-300'}`} />
        ))}
      </div>
    </div>
  )
}

/* ---------- Faixa com relogios das cidades ---------- */
function Relogios({ t, locale, idioma }) {
  const agora = useAgora(10000)
  return (
    <section className="lp-ink">
      <div className="max-w-6xl mx-auto px-6 py-14 grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
        <div>
          <h2 className="lp-display lp-h2 max-w-md">{t('lp.relTitulo')}</h2>
          <p className="text-slate-600 mt-3">{t('lp.relSub')}</p>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-7">
          {CIDADES.map((c) => (
            <li key={c.id} className="lp-clock">
              <p className="text-sm text-slate-500">{c.n[idioma] || c.n.en}</p>
              <p className="lp-display text-4xl font-bold lp-tabular">{fmtHora(agora, c.tz, locale)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------- So WhatsApp vs. com pagina de marcacao ---------- */
function AntesDepois({ t }) {
  const [modo, setModo] = useState('sem')
  const bolhas = [['c', 'lp.w1'], ['o', 'lp.w2'], ['c', 'lp.w3'], ['o', 'lp.w4'], ['c', 'lp.w5']]
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="lp-display lp-h2 max-w-lg">{t('lp.adTitulo')}</h2>
        <div className="inline-flex mt-7 p-1 rounded-full bg-white shadow-sm ring-1 ring-slate-200" role="group">
          {[['sem', 'lp.adSem'], ['com', 'lp.adCom']].map(([k, rot]) => (
            <button key={k} aria-pressed={modo === k} onClick={() => setModo(k)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${modo === k ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {t(rot)}
            </button>
          ))}
        </div>
        <p className="mt-5 text-lg text-slate-600 max-w-md leading-relaxed">{t(modo === 'sem' ? 'lp.adSemTxt' : 'lp.adComTxt')}</p>
      </div>
      <div className="lp-fone-scene">
        <div className="lp-fone">
        {modo === 'sem' ? (
          <div key="sem" className="lp-fone-tela lp-swap" style={{ background: '#fff3ef' }}>
            {bolhas.map(([q, k]) => <div key={k} className={`lp-bolha ${q}`}>{t(k)}</div>)}
          </div>
        ) : (
          <div key="com" className="lp-fone-tela lp-swap items-stretch justify-center" style={{ background: '#fff8f5' }}>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-sm"><Visto />{t('lp.confirmada')}</div>
              <p className="lp-display text-5xl font-extrabold mt-3 lp-tabular">17:30</p>
              <p className="font-semibold mt-1">{t('lp.s1')}</p>
            </div>
            <div className="lp-notification rounded-2xl px-4 py-3 text-sm flex items-center gap-2.5">
              <Bell size={15} aria-hidden />{t('lp.lembrete')}
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  )
}

/* ---------- Funcionalidades ---------- */
function Funcionalidades({ t, locale }) {
  const { idioma, setIdioma } = useIdioma()
  const refBarras = useRef(null)
  const barrasVisiveis = useVisto(refBarras)
  const alturas = [38, 52, 45, 68, 60, 82, 96]
  return (
    <section id="funcionalidades" className="max-w-6xl mx-auto px-6 pb-20">
      <div className="lp-section-heading">
        <span className="lp-eyebrow"><span /> {t('land.funcionalidades')}</span>
        <h2 className="lp-display lp-h2 max-w-2xl mt-4">{t('lp.bTitulo')}</h2>
        <p className="text-slate-500 mt-4 max-w-xl leading-relaxed">{t('lp.bSub')}</p>
      </div>
      <div className="lp-feature-grid mt-10">
        {/* Consulta por vídeo */}
        <article className="lp-feature-card lp-feature-card--wide">
          <div className="lp-feature-card__copy">
            <span className="lp-feature-index">{t('lp.bi1')}</span>
            <h3 className="lp-display text-2xl">{t('lp.bVideoT')}</h3>
            <p>{t('lp.bVideoD')}</p>
            <span className="lp-feature-link"><Video size={15} /> {t('book.entrarSessao')}</span>
          </div>
          <Illustracao3D type="video" size="feature" className="lp-feature-art" />
          <div className="lp-video-mini" aria-hidden="true">
            <span /><span /><span />
          </div>
        </article>

        {/* Pagamentos e moeda */}
        <article className="lp-feature-card lp-feature-card--wide lp-feature-card--warm">
          <div className="lp-feature-card__copy">
            <span className="lp-feature-index">{t('lp.bi2')}</span>
            <h3 className="lp-display text-2xl">{t('lp.bPayT')}</h3>
            <p>{t('lp.bPayD')}</p>
            <div className="lp-currency-row">
              {['AOA', 'BRL', 'USD', 'EUR'].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
          <div className="lp-payment-art">
            <Illustracao3D type="payment" size="feature" />
            <div className="lp-payment-receipt"><Check size={17} /><span>{t('lp.paySeguro')}</span></div>
          </div>
        </article>

        {/* Lembretes */}
        <article className="lp-feature-card">
          <Illustracao3D type="reminder" size="feature" />
          <span className="lp-feature-index">{t('lp.bi3')}</span>
          <h3 className="lp-display text-xl">{t('lp.bLembT')}</h3>
          <p>{t('lp.bLembD')}</p>
        </article>

        {/* Idiomas */}
        <article className="lp-feature-card lp-feature-card--language">
          <Illustracao3D type="globe" size="feature" />
          <span className="lp-feature-index">{t('lp.bi4')}</span>
          <h3 className="lp-display text-xl">{t('lp.bIdT')}</h3>
          <p>{t('lp.bIdD')}</p>
          <div className="lp-language-pills">
            {IDIOMAS.map((i) => (
              <button key={i.codigo} onClick={() => setIdioma(i.codigo)} aria-pressed={idioma === i.codigo}
                className={idioma === i.codigo ? 'is-active' : ''}>
                {i.nome}
              </button>
            ))}
          </div>
        </article>

        {/* Relatórios */}
        <article ref={refBarras} className={`lp-feature-card lp-feature-card--reports ${barrasVisiveis ? 'lp-in' : ''}`}>
          <Illustracao3D type="analytics" size="feature" />
          <span className="lp-feature-index">{t('lp.bi5')}</span>
          <h3 className="lp-display text-xl">{t('lp.bRelT')}</h3>
          <p>{t('lp.bRelD')}</p>
          <svg viewBox="0 0 140 64" className="lp-report-bars" aria-hidden>
            {alturas.map((h, k) => (
              <rect key={k} className="lp-bar" x={k * 20 + 2} y={64 - h * 0.62} width="14" height={h * 0.62} rx="4"
                fill={k === alturas.length - 1 ? '#df7d85' : '#efd0d0'} style={{ transitionDelay: `${k * 70}ms` }} />
            ))}
          </svg>
        </article>
      </div>
      <div className="lp-everything-more mt-5">
        <Illustracao3D type="smart" size="small" />
        <div>
          <h3 className="lp-display text-2xl">{t('lp.maisT')}</h3>
          <p>{t('lp.maisD')}</p>
        </div>
      </div>
    </section>
  )
}

/* ---------- Galeria visual com movimento ao entrar no ecrã ---------- */
function ExperienciaVisual({ t }) {
  return (
    <section className="lp-experiencia max-w-6xl mx-auto px-6 py-20">
      <div className="lp-experiencia-top">
        <div>
          <span className="lp-eyebrow"><span /> {t('land.funcionalidades')}</span>
          <h2 className="lp-display lp-h2 mt-4 max-w-2xl">{t('lp.exp.h2')}</h2>
        </div>
        <p className="text-slate-500 leading-relaxed max-w-sm">{t('lp.exp.p')}</p>
      </div>
      <div className="lp-photo-grid mt-10">
        <figure className="lp-photo lp-photo-main">
          <img src="/images/salao.webp" alt={t('lp.exp.alt1')} loading="lazy" />
          <figcaption><span>{t('lp.exp.c1')}</span><strong>{t('lp.exp.t1')}</strong></figcaption>
        </figure>
        <figure className="lp-photo lp-photo-side">
          <img src="https://images.unsplash.com/photo-1758691461957-474a7686e388?auto=format&fit=crop&w=1400&q=85" alt="Profissional de saúde a atender uma paciente num consultório médico moderno" loading="lazy" />
          <figcaption><span>SAÚDE E BEM-ESTAR</span><strong>Consultas num consultório acolhedor</strong></figcaption>
        </figure>
        <div className="lp-photo-note">
          <span className="lp-note-icon"><CalendarCheck size={19}/></span>
          <p className="lp-display text-2xl font-bold">{t('lp.exp.nota')}</p>
          <span className="text-sm text-slate-500">{t('lp.exp.notap')}</span>
        </div>
      </div>
    </section>
  )
}

/* ---------- Para quem ---------- */
function ParaQuem({ t }) {
  const lista = t('lp.quem').split('|')
  const tons = ['bg-white', 'bg-[#fff0ef]', 'bg-[#f8eee8]', 'bg-[#f5e8e6]']
  return (
    <section className="max-w-6xl mx-auto px-6 pb-20">
      <h2 className="lp-display lp-h2 max-w-xl mb-8">{t('lp.paraTitulo')}</h2>
      <ul className="flex flex-wrap gap-3">
        {lista.map((nome, k) => (
          <li key={nome} className={`${tons[k % tons.length]} rounded-full px-5 py-2.5 font-semibold text-slate-800 ring-1 ring-slate-200/60 ${k % 3 === 1 ? 'text-lg' : ''}`}>{nome}</li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Precos ---------- */
function Precos({ t, locale }) {
  const [moeda, setMoeda] = useState(moedaSugerida())
  return (
    <section id="precos" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="lp-display lp-h2 text-center mb-2">{t('land.precosTitulo')}</h2>
        <p className="text-slate-500 text-center mb-6">{t('land.precosSub')}</p>
        <div className="flex justify-center gap-1.5 mb-10" role="tablist" aria-label={t('comum.moeda')}>
          {MOEDAS_PRECO.map((m) => (
            <button key={m} role="tab" aria-selected={moeda === m} onClick={() => setMoeda(m)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${moeda === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANOS.map((p) => (
            <div key={p.key} className={`rounded-[28px] p-7 relative ${p.popular ? 'lp-ink' : 'bg-slate-50 ring-1 ring-slate-200'}`}>
              {p.popular && (
                <span className="absolute -top-3 left-7 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">{t('land.popular')}</span>
              )}
              <p className="lp-display font-bold text-lg mb-1">{t(`plano.${p.key}`)}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="lp-display text-4xl font-extrabold lp-tabular">
                  {p.key === 'BASICO' ? t('comum.gratis') : fmtMoeda(PRECOS[p.key][moeda], moeda, locale)}
                </span>
                {p.key !== 'BASICO' && <span className={`text-sm ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>{t('comum.porMes')}</span>}
              </div>
              <p className={`text-xs mb-6 ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>{t(p.prof)}</p>
              <Link to="/criar" className={`block text-center py-3 rounded-full text-sm font-semibold mb-6 transition-all
                ${p.popular ? 'bg-brand-600 text-white hover:bg-brand-500' : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50'}`}>
                {t('land.comecarAgora')}
              </Link>
              <ul className="space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${p.popular ? 'text-slate-200' : 'text-slate-600'}`}>
                    <Check size={15} className="text-green-500 shrink-0 mt-0.5" />{t(f)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Perguntas frequentes ---------- */
function Faq({ t }) {
  return (
    <section className="lp-faq max-w-3xl mx-auto px-6 py-20">
      <h2 className="lp-display lp-h2 mb-8">{t('lp.faqT')}</h2>
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {[1, 2, 3, 4, 5].map((n) => (
          <details key={n} className="group py-5">
            <summary className="flex items-center justify-between gap-4 font-semibold text-lg">
              {t(`lp.fq${n}`)}
              <Plus size={20} className="lp-mais shrink-0 text-slate-400" aria-hidden />
            </summary>
            <p className="mt-3 text-slate-600 leading-relaxed max-w-prose">{t(`lp.fa${n}`)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default function LandingPage() {
  const { t, idioma, locale } = useT()
  const partesTitulo = t('lp.h1').split(/,\s*/)
  // Efeito de construcao ao rolar: so em "Tudo o que acontece..." e nas Perguntas Frequentes (o resto da pagina fica sempre visivel)
  useLayoutEffect(() => {
    const root = document.querySelector('.lp')
    if (!root) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    let observer
    let itens = []
    try {
      // Cada bloco comeca o seu atraso do zero: assim as pecas entram uma a uma dentro do proprio bloco
      const grupos = [
        '.lp-faq h2, .lp-faq details',
        '.lp-feature-card, .lp-everything-more',
      ]
      grupos.forEach((sel) => {
        root.querySelectorAll(sel).forEach((el, i) => {
          el.classList.add('lp-build')
          el.style.setProperty('--lp-d', `${i * 110}ms`)
          itens.push(el)
        })
      })
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-in'); observer.unobserve(e.target) }
        })
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' })
      itens.forEach((el) => observer.observe(el))
    } catch {
      itens.forEach((el) => el.classList.add('is-in'))
    }
    return () => observer?.disconnect()
  }, [])
  return (
    <div className="lp min-h-screen">
      {/* Barra de topo */}
      <header className="sticky top-3 z-50 px-3">
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur rounded-full h-14 pl-5 pr-2.5 flex items-center justify-between shadow-sm ring-1 ring-slate-200/70">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center"><CalendarCheck size={16} className="text-white" /></span>
            <span className="lp-display font-bold text-lg">{MARCA}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#funcionalidades" className="hover:text-slate-900">{t('land.funcionalidades')}</a>
            <a href="#precos" className="hover:text-slate-900">{t('land.precos')}</a>
            <Link to="/depoimentos" className="hover:text-slate-900">{t('land.depoimentos')}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <SeletorIdioma />
            <Link to="/login" className="hidden sm:block text-sm font-semibold text-slate-700 px-3">{t('comum.entrar')}</Link>
            <Link to="/criar" className="bg-brand-600 text-white text-sm font-semibold rounded-full px-4 py-2 hover:bg-brand-700 shadow-sm">{t('comum.comecarGratis')}</Link>
          </div>
        </div>
      </header>

      {/* Topo */}
      <section className="lp-hero-section max-w-6xl mx-auto px-6 pt-14 pb-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
        <div className="lp-hero-copy">
          <span className="lp-eyebrow"><span /> {t('lp.eyebrow')}</span>
          <h1 className="lp-display lp-h1 max-w-2xl"><span>{partesTitulo[0]}</span>{partesTitulo.length > 1 && <><br /><em>{partesTitulo.slice(1).join(', ')}</em></>}</h1>
          <p className="text-lg md:text-xl text-slate-600 mt-6 max-w-xl leading-relaxed">{t('lp.sub')}</p>
          <div className="flex flex-wrap items-center gap-3 mt-9">
            <Link to="/criar" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full px-8 py-3.5 text-base transition-colors">{t('comum.criarConta')}</Link>
            <Link to="/demo" className="font-semibold rounded-full px-7 py-3.5 text-base ring-1 ring-slate-300 hover:bg-white transition-colors">{t('land.demo')}</Link>
          </div>
          <p className="text-sm text-slate-500 mt-4">{t('land.semCartao')}</p>
        </div>
        <QuadroMarcacoes t={t} locale={locale} idioma={idioma} />
      </section>

      <Relogios t={t} locale={locale} idioma={idioma} />
      <AntesDepois t={t} />
      <ExperienciaVisual t={t} />
      <Funcionalidades t={t} locale={locale} />
      <ParaQuem t={t} />

      {/* Depoimentos reais, um de cada vez */}
      <DepoimentosRotativos />

      <Precos t={t} locale={locale} />
      <Faq t={t} />

      {/* Chamada final */}
      <section className="lp-final-cta">
        <div className="lp-final-cta__inner max-w-5xl mx-auto px-6 py-16 text-center">
          <Illustracao3D type="smart" size="small" />
          <h2 className="lp-display lp-h2 mt-3">{t('land.ctaTitulo')}</h2>
          <p className="text-slate-600 mt-4">{t('land.ctaTexto')}</p>
          <Link to="/criar" className="inline-flex items-center justify-center gap-2 mt-8 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full px-9 py-4 transition-colors shadow-sm">{t('comum.criarConta')} <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="lp-footer py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="lp-footer-mark"><CalendarCheck size={17} /></span>
            <span className="lp-display font-bold">{MARCA}</span>
          </div>
          <AssinaturaAda fundo="claro" comEmail />
          <div className="text-center md:text-right">
            <p className="text-slate-500 text-sm">{t('land.rodape', { ano: new Date().getFullYear() })}</p>
            <p className="text-xs mt-1.5 space-x-3">
              <Link to="/termos" className="text-slate-500 hover:text-brand-700">{t('legal.termos')}</Link>
              <Link to="/privacidade" className="text-slate-500 hover:text-brand-700">{t('legal.privacidade')}</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
