import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck, Bell, Video, MapPin, Check, Wallet, LayoutDashboard, Calendar, Users, BarChart2,
  Settings, ArrowRight, RotateCcw, ArrowDown, Info,
} from 'lucide-react'
import { useT } from '../i18n'
import SeletorIdioma from '../components/SeletorIdioma'
import { fmtMoeda } from '../utils/moeda'
import { MARCA } from '../utils/marca'
import './demo.css'

// Tres exemplos de negocios diferentes (nada aqui vai para a base de dados).
const CENARIOS = [
  {
    id: 's1', moeda: 'AOA', metodo: 'Multicaixa Express',
    servicos: [{ k: 'a', dur: 50, preco: 25000, online: true }, { k: 'b', dur: 45, preco: 18000, online: true }, { k: 'c', dur: 60, preco: 30000, online: false }],
    base: [{ h: '09:00', cli: 'Carlos', s: 'b', pago: true }, { h: '11:00', cli: 'Beatriz', s: 'a', pago: false }],
  },
  {
    id: 's2', moeda: 'BRL', metodo: 'Pix',
    servicos: [{ k: 'a', dur: 45, preco: 250, online: true }, { k: 'b', dur: 60, preco: 400, online: true }, { k: 'c', dur: 90, preco: 600, online: false }],
    base: [{ h: '10:00', cli: 'Rafael', s: 'b', pago: true }, { h: '14:30', cli: 'Juliana', s: 'c', pago: false }],
  },
  {
    id: 's3', moeda: 'EUR', metodo: 'card',
    servicos: [{ k: 'a', dur: 40, preco: 35, online: false }, { k: 'b', dur: 60, preco: 45, online: false }, { k: 'c', dur: 60, preco: 25, online: true }],
    base: [{ h: '08:30', cli: 'Miguel', s: 'b', pago: true }, { h: '17:00', cli: 'Sofia', s: 'c', pago: false }],
  },
]
const HORAS = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']

export default function DemoPage() {
  const { t, locale } = useT()
  const [ci, setCi] = useState(0)
  const c = CENARIOS[ci]
  const [passo, setPasso] = useState(0) // 0 servico, 1 dia/hora, 2 confirmar, 3 pagar, 4 feito
  const [serv, setServ] = useState(null)
  const [dia, setDia] = useState(0)
  const [hora, setHora] = useState(null)
  const [agenda, setAgenda] = useState([])
  const [notifs, setNotifs] = useState([])
  const [novoId, setNovoId] = useState(null)
  const seq = useRef(0) // invalida timeouts de uma demonstracao anterior
  const painelRef = useRef(null)

  const dias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i + 1)
      return fmt.format(d)
    })
  }, [locale])

  const nomeServ = (cen, k) => t(`dm.${cen.id}.${k}`)
  const dinheiro = (v) => fmtMoeda(v, c.moeda, locale)
  const metodo = c.metodo === 'card' ? t('lp.pagCartao') : c.metodo

  const recomecar = (idx = ci) => {
    seq.current += 1
    const cen = CENARIOS[idx]
    setPasso(0); setServ(null); setDia(0); setHora(null); setNotifs([]); setNovoId(null)
    setAgenda(cen.base.map((b, i) => ({ id: `b${i}`, ...b, dia: 0, preco: cen.servicos.find((s) => s.k === b.s).preco })))
  }
  useEffect(() => { recomecar(ci) }, [ci]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { seq.current += 1 }, [])

  const notificar = (n) => setNotifs((l) => [{ id: Date.now() + Math.random(), ...n }, ...l].slice(0, 5))

  const confirmar = () => {
    const meu = seq.current
    const id = `n${Date.now()}`
    setAgenda((l) => [{ id, h: hora, cli: t('dm.cliente'), s: serv.k, pago: false, dia, preco: serv.preco, novo: true }, ...l])
    setNovoId(id)
    setPasso(3)
    setTimeout(() => {
      if (seq.current !== meu) return
      notificar({
        tipo: 'nova',
        texto: t('dm.nNova', { cliente: t('dm.cliente'), servico: nomeServ(c, serv.k), dia: dias[dia], hora }),
      })
    }, 500)
  }

  const pagar = () => {
    const meu = seq.current
    setPasso(4)
    setTimeout(() => {
      if (seq.current !== meu) return
      setAgenda((l) => l.map((a) => (a.id === novoId ? { ...a, pago: true } : a)))
      notificar({ tipo: 'pago', texto: t('dm.nPago', { valor: dinheiro(serv.preco), cliente: t('dm.cliente') }) })
    }, 700)
  }

  const recebido = agenda.filter((a) => a.pago).reduce((s, a) => s + a.preco, 0)
  const porPagar = agenda.filter((a) => !a.pago).length
  const passoTitulo = ['dm.p1', 'dm.p2', 'dm.p3', 'dm.p4', 'dm.p4'][passo]

  return (
    <div className="dm min-h-screen">
      {/* Topo */}
      <header className="dm-topo">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold dm-display text-xl text-slate-900">
            <span className="dm-logo"><CalendarCheck size={17} /></span>{MARCA}
          </Link>
          <div className="flex items-center gap-3">
            <SeletorIdioma />
            <Link to="/criar" className="dm-btn dm-btn-sm">{t('dm.criar')} <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 pt-10 pb-16">
        <div className="max-w-2xl">
          <h1 className="dm-display text-4xl sm:text-5xl leading-[1.05] text-slate-900">{t('dm.titulo')}</h1>
          <p className="mt-4 text-lg text-slate-600">{t('dm.sub')}</p>
        </div>

        <div className="dm-aviso mt-6" role="note">
          <Info size={16} aria-hidden /> <span>{t('dm.aviso')}</span>
        </div>

        {/* Escolha do exemplo */}
        <div className="mt-8" role="tablist" aria-label={t('dm.escolhe')}>
          <div className="flex flex-wrap gap-2">
            {CENARIOS.map((x, i) => (
              <button key={x.id} role="tab" aria-selected={ci === i} onClick={() => setCi(i)}
                className={`dm-tab ${ci === i ? 'is-on' : ''}`}>
                {t(`dm.${x.id}.tab`)}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">{t('dm.dica')}</p>

        <div className="grid lg:grid-cols-2 gap-6 mt-6 items-start">
          {/* ===== Lado do cliente ===== */}
          <section aria-labelledby="dm-lado1">
            <h2 id="dm-lado1" className="dm-rotulo">{t('dm.lado1')}</h2>
            <div className="dm-cartao">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="dm-avatar">{t(`dm.${c.id}.neg`).charAt(0)}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{t(`dm.${c.id}.neg`)}</p>
                  <p className="text-sm text-slate-500">{t(`dm.${c.id}.prof`)}</p>
                </div>
              </div>

              <h3 className="mt-5 mb-3 font-semibold text-slate-900">{t(passoTitulo)}</h3>

              {passo === 0 && (
                <ul className="grid gap-2.5">
                  {c.servicos.map((s) => (
                    <li key={s.k}>
                      <button className="dm-servico" onClick={() => { setServ(s); setPasso(1) }}>
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-900">{nomeServ(c, s.k)}</span>
                          <span className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                            {s.online ? <Video size={14} aria-hidden /> : <MapPin size={14} aria-hidden />}
                            {t(s.online ? 'dm.online' : 'dm.presencial')} · {t('dm.min', { n: s.dur })}
                          </span>
                        </span>
                        <strong className="dm-valor">{dinheiro(s.preco)}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {passo === 1 && (
                <div>
                  <div className="dm-dias" role="radiogroup">
                    {dias.map((d, i) => (
                      <button key={d} role="radio" aria-checked={dia === i} onClick={() => setDia(i)} className={`dm-chip ${dia === i ? 'is-on' : ''}`}>{d}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {HORAS.map((h) => (
                      <button key={h} onClick={() => setHora(h)} className={`dm-chip dm-hora ${hora === h ? 'is-on' : ''}`}>{h}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-5">
                    <button className="dm-link" onClick={() => { setPasso(0); setHora(null) }}>{t('comum.voltar')}</button>
                    <button className="dm-btn" disabled={!hora} onClick={() => setPasso(2)}>{t('comum.continuar')}</button>
                  </div>
                </div>
              )}

              {passo === 2 && serv && (
                <div>
                  <dl className="dm-resumo">
                    <div><dt>{t('book.servico')}</dt><dd>{nomeServ(c, serv.k)}</dd></div>
                    <div><dt>{t('book.data')}</dt><dd>{dias[dia]}</dd></div>
                    <div><dt>{t('book.hora')}</dt><dd>{hora}</dd></div>
                    <div><dt>{t('book.valor')}</dt><dd>{dinheiro(serv.preco)}</dd></div>
                  </dl>
                  <div className="flex items-center justify-between mt-5">
                    <button className="dm-link" onClick={() => setPasso(1)}>{t('comum.voltar')}</button>
                    <button className="dm-btn" onClick={confirmar}>{t('dm.confirmar')}</button>
                  </div>
                </div>
              )}

              {(passo === 3 || passo === 4) && serv && (
                <div>
                  <div className="dm-ok"><Check size={18} aria-hidden /> <div><strong>{t('dm.feitoT')}</strong><p>{t('dm.feitoD')}</p></div></div>
                  {passo === 3 && (
                    <>
                      <button className="dm-btn w-full mt-4 justify-center" onClick={pagar}>
                        <Wallet size={16} /> {t('dm.pagar', { valor: dinheiro(serv.preco), metodo })}
                      </button>
                      <p className="mt-2 text-xs text-slate-500 text-center">{t('dm.simulado')}</p>
                    </>
                  )}
                  {passo === 4 && (
                    <div className="dm-ok dm-ok-forte mt-3"><Check size={18} aria-hidden /> <div><strong>{t('dm.pagoT')}</strong><p>{t('dm.pagoD')}</p></div></div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <button className="dm-link lg:hidden" onClick={() => painelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                      <ArrowDown size={14} /> {t('dm.verPainel')}
                    </button>
                    {passo === 4 && (
                      <button className="dm-link" onClick={() => recomecar()}><RotateCcw size={14} /> {t('dm.recomecar')}</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ===== Lado do dono (painel) ===== */}
          <section aria-labelledby="dm-lado2" ref={painelRef} className="scroll-mt-20">
            <h2 id="dm-lado2" className="dm-rotulo">{t('dm.lado2')}</h2>
            <div className="dm-painel">
              <aside className="dm-menu" aria-hidden>
                {[LayoutDashboard, Calendar, Users, BarChart2, Settings].map((Ic, i) => (
                  <span key={i} className={i === 1 ? 'is-on' : ''}><Ic size={17} /></span>
                ))}
              </aside>
              <div className="dm-painel-corpo">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 truncate">{t(`dm.${c.id}.neg`)}</p>
                  <span className="dm-selo">{MARCA} · {t('dm.painel')}</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <div className="dm-stat"><span>{t('dm.recebido')}</span><strong key={recebido} className="dm-sobe">{dinheiro(recebido)}</strong></div>
                  <div className="dm-stat"><span>{t('dm.marc')}</span><strong key={agenda.length} className="dm-sobe">{agenda.length}</strong></div>
                  <div className="dm-stat"><span>{t('dm.pend')}</span><strong key={porPagar} className="dm-sobe">{porPagar}</strong></div>
                </div>

                <h3 className="dm-sub-rotulo">{t('dm.agenda')}</h3>
                <ul className="grid gap-2">
                  {agenda.map((a) => (
                    <li key={a.id} className={`dm-linha ${a.id === novoId && a.novo ? 'is-novo' : ''}`}>
                      <span className="dm-hora-badge">{a.h}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900 truncate">{a.cli}</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                          {c.servicos.find((s) => s.k === a.s).online && <Video size={12} aria-hidden />}
                          {nomeServ(c, a.s)}{a.id === novoId && a.novo ? ` · ${dias[a.dia]}` : ''}
                        </span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block text-sm font-semibold text-slate-900">{dinheiro(a.preco)}</span>
                        <span className={`dm-estado ${a.pago ? 'pago' : ''}`}>{t(a.pago ? 'dm.pago' : 'dm.porPagar')}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <h3 className="dm-sub-rotulo"><Bell size={14} aria-hidden /> {t('dm.notif')}</h3>
                <ul className="grid gap-2 min-h-[72px]" aria-live="polite">
                  {notifs.length === 0 && <li className="text-sm text-slate-400">{t('dm.notifVazio')}</li>}
                  {notifs.map((n) => (
                    <li key={n.id} className={`dm-notif ${n.tipo === 'pago' ? 'pago' : ''}`}>
                      <span className="dm-notif-ic">{n.tipo === 'pago' ? <Wallet size={15} /> : <Bell size={15} />}</span>
                      <span className="text-sm text-slate-800">{n.texto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Convite final */}
        <div className="dm-cta mt-14">
          <div>
            <h2 className="dm-display text-3xl">{t('dm.ctaTitulo')}</h2>
            <p className="mt-1 text-slate-600">{t('dm.ctaSub')} {t('land.semCartao')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/criar" className="dm-btn">{t('dm.criar')} <ArrowRight size={16} /></Link>
            <Link to="/" className="dm-btn dm-btn-claro">{t('dm.inicio')}</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
