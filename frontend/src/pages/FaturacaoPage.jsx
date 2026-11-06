import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  CreditCard, Smartphone, Building2, Check, Clock,
  X, RefreshCw, AlertTriangle, Shield, ChevronDown, ChevronUp, Globe
} from 'lucide-react'
import { useT } from '../i18n'
import { fmtMoeda, moedaSugerida } from '../utils/moeda'
import { PRECOS, MOEDAS_PRECO } from '../utils/planos'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'

function fmtKz(v) {
  if (v === 0) return 'Grátis'
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(v || 0)
}

const PLANOS = [
  {
    key: 'BASICO',
    label: 'Basico',
    preco: 0,
    profissionais: 'plano.prof1',
    features: ['plano.b2', 'plano.b3', 'plano.b4', 'plano.b5'],
    cor: 'border-slate-200 hover:border-slate-300',
    destaque: false,
  },
  {
    key: 'PROFISSIONAL',
    label: 'Profissional',
    preco: 8000,
    profissionais: 'plano.prof5',
    features: ['plano.p2', 'plano.p3', 'plano.p4', 'plano.p5', 'plano.p6'],
    cor: 'border-brand-500 shadow-lg',
    destaque: true,
  },
  {
    key: 'PREMIUM',
    label: 'Premium',
    preco: 19000,
    profissionais: 'plano.profIlim',
    features: ['plano.m0', 'plano.m1', 'plano.m2', 'plano.m3', 'plano.m4', 'plano.m5', 'plano.m6', 'plano.m7'],
    cor: 'border-slate-200 hover:border-slate-300',
    destaque: false,
  },
]

const precoEm = (plano, moeda) => (plano === 'BASICO' ? 0 : PRECOS[plano]?.[moeda] ?? 0)

const STATUS_BADGE = {
  APROVADO: 'badge-green',
  PENDENTE: 'badge-yellow',
  RECUSADO: 'badge-red',
  EXPIRADO: 'badge-gray'
}

export default function FaturacaoPage() {
  const { negocio, atualizarNegocio } = useAuthStore()
  const [historico, setHistorico] = useState([])
  const [modal, setModal] = useState(null)
  const [planoSelecionado, setPlanoSelecionado] = useState(negocio?.plano || 'BASICO')
  const [bancoPref, setBancoPref] = useState('ATLANTICO')
  const [pagamentoAtivo, setPagamentoAtivo] = useState(null)
  const [infoExpress, setInfoExpress] = useState(null)
  const [infoIban, setInfoIban] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [polling, setPolling] = useState(false)
  const [mostrarPlanos, setMostrarPlanos] = useState(false)
  const { t, locale } = useT()
  const [moedaPag, setMoedaPag] = useState(() => moedaSugerida())
  const fmtP = (plano) => (precoEm(plano, moedaPag) === 0 ? t('comum.gratis') : fmtMoeda(precoEm(plano, moedaPag), moedaPag, locale))

  const carregarHistorico = async () => {
    try {
      const r = await api.get('/pagamentos/historico')
      setHistorico(r.data)
    } catch {}
  }

  useEffect(() => { carregarHistorico() }, [])

  // Voltou do pagamento online: o webhook ativa o plano em segundos; vamos atualizando
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('pago')) return
    let n = 0
    const id = setInterval(async () => {
      n++
      try {
        const me = await api.get('/auth/me')
        atualizarNegocio(me.data.negocio)
        carregarHistorico()
        if (me.data.negocio?.plano !== 'BASICO' || n >= 12) clearInterval(id)
      } catch { if (n >= 12) clearInterval(id) }
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!pagamentoAtivo || !polling) return
    const interval = setInterval(async () => {
      try {
        const r = await api.get(`/pagamentos/status/${pagamentoAtivo}`)
        if (r.data.status === 'APROVADO') {
          toast.success(t('ct.fat.pagConfirmado'))
          setPolling(false); setPagamentoAtivo(null); setModal(null)
          carregarHistorico()
          // Actualizar o negocio no store
          const me = await api.get('/auth/me')
          atualizarNegocio(me.data.negocio)
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [pagamentoAtivo, polling])

  const iniciarExpress = async () => {
    setCarregando(true)
    try {
      const r = await api.post('/pagamentos/iniciar-express', { plano: planoSelecionado })
      setInfoExpress(r.data)
      setPagamentoAtivo(r.data.pagamentoId)
      setPolling(true)
      setModal('express-info')
      carregarHistorico()
    } catch (err) {
      toast.error(err.response?.data?.erro || t('ct.fat.erroPedido'))
    } finally { setCarregando(false) }
  }

  // Cartao / PayPal / Apple Pay / Google Pay / Pix (BRL) via Paddle
  const iniciarOnline = async () => {
    setCarregando(true)
    try {
      const r = await api.post('/pagamentos/iniciar-paddle', { plano: planoSelecionado, moeda: moedaPag })
      window.location.href = r.data.checkoutUrl
    } catch (err) {
      toast.error(err.response?.data?.erro || t('fat.erroOnline'))
      setCarregando(false)
    }
  }

  const iniciarIban = async () => {
    setCarregando(true)
    try {
      const r = await api.post('/pagamentos/iniciar-iban', { plano: planoSelecionado, banco: bancoPref })
      setInfoIban(r.data)
      setModal('iban-info')
      carregarHistorico()
    } catch (err) {
      toast.error(err.response?.data?.erro || t('ct.fat.erroInstr'))
    } finally { setCarregando(false) }
  }

  const ativarGratis = async () => {
    setCarregando(true)
    try {
      await api.post('/pagamentos/ativar-gratis')
      toast.success(t('ct.fat.gratisAtivado'))
      const me = await api.get('/auth/me')
      atualizarNegocio(me.data.negocio)
      setMostrarPlanos(false)
    } catch (err) {
      toast.error(err.response?.data?.erro || t('ct.fat.erroAtivar'))
    } finally { setCarregando(false) }
  }

  const planoSelecionadoGratis = PLANOS.find(p => p.key === planoSelecionado)?.preco === 0

  const planoAtual = negocio?.plano || 'BASICO'
  const planoStatus = negocio?.planoStatus || 'ATIVO'
  const planoExpira = negocio?.planoExpira
  const planoActualInfo = PLANOS.find(p => p.key === planoAtual)

  const agora = new Date()
  const diasRestantes = planoExpira
    ? Math.max(0, Math.ceil((new Date(planoExpira) - agora) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-display text-2xl font-bold mb-6">{t('ct.fat.titulo')}</h1>

      {/* Card: Status do Plano Actual */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Plano actual</p>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {planoActualInfo?.label || planoAtual}
              </h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                ${planoStatus === 'ATIVO' ? 'bg-green-100 text-green-700' :
                  planoStatus === 'SUSPENSO' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'}`}>
                {planoStatus === 'ATIVO' ? t('ct.fat.stAtivo') : planoStatus === 'SUSPENSO' ? t('ct.fat.stSuspenso') : t('ct.fat.stExpirado')}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {fmtKz(planoActualInfo?.preco ?? 0)}{planoActualInfo?.preco !== 0 && t('comum.porMes')}
              {planoExpira && (
                <span className="ml-2 text-slate-400">
                  · {diasRestantes === 0
                    ? t('ct.fat.expiraHoje')
                    : t(diasRestantes === 1 ? 'ct.fat.expiraEm1' : 'ct.fat.expiraEmN', { n: diasRestantes, data: new Date(planoExpira).toLocaleDateString(locale, { day: 'numeric', month: 'long' }) })}
                </span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
            <Shield size={22} className="text-brand-600" />
          </div>
        </div>

        {/* Aviso de proximidade de expiracao */}
        {diasRestantes !== null && diasRestantes <= 7 && planoStatus === 'ATIVO' && (
          <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              {diasRestantes === 0 ? t('ct.fat.avisoHoje') : t('ct.fat.avisoDias', { n: diasRestantes })}
            </p>
          </div>
        )}
      </div>

      {/* Seleccionar Plano */}
      <div className="card p-6 mb-5">
        <button
          onClick={() => setMostrarPlanos(!mostrarPlanos)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="font-semibold text-slate-800">
            {mostrarPlanos ? t('ct.fat.escolherRenovar') : t('ct.fat.renovarMudar')}
          </h2>
          {mostrarPlanos
            ? <ChevronUp size={18} className="text-slate-400" />
            : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarPlanos && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">{t('fat.moedaPag')}</span>
              <div className="flex gap-1">
                {MOEDAS_PRECO.map(m => (
                  <button key={m} onClick={() => setMoedaPag(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${moedaPag === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-5">
              {PLANOS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPlanoSelecionado(p.key)}
                  className={`relative text-left rounded-2xl border-2 p-4 transition-all
                    ${planoSelecionado === p.key
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-brand-300 bg-white'}`}
                >
                  {p.destaque && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Mais popular
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-800">{t(`plano.${p.key}`)}</p>
                    {planoSelecionado === p.key && (
                      <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="font-display font-bold text-slate-900 text-xl">
                    {fmtP(p.key)}{p.preco !== 0 && <span className="text-xs font-normal text-slate-400">{t('comum.porMes')}</span>}
                  </p>
                  <p className="text-xs text-slate-400 mb-3">{t(p.profissionais)}</p>
                  <ul className="space-y-1">
                    {p.features.slice(0, 3).map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Check size={10} className="text-green-500 shrink-0" />{t(f)}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Plano seleccionado */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {t('ct.fat.planoSel')} <span className="text-brand-700">{t(`plano.${planoSelecionado}`)}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {PLANOS.find(p => p.key === planoSelecionado)?.preco === 0
                    ? t('ct.fat.validadeGratis')
                    : t('ct.fat.validade30')}
                </p>
              </div>
              <p className="font-display font-bold text-2xl text-slate-900">
                {fmtP(planoSelecionado)}
              </p>
            </div>

            {planoSelecionadoGratis ? (
              <button
                onClick={ativarGratis}
                disabled={carregando}
                className="btn-primary w-full py-3"
              >
                {carregando ? t('ct.fat.ativando') : t('ct.fat.ativarGratis')}
              </button>
            ) : (<>
            {/* Metodos de pagamento */}
            {moedaPag !== 'AOA' ? (
              <div>
                <button onClick={iniciarOnline} disabled={carregando}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-brand-500 bg-brand-50 hover:bg-brand-100 transition-all text-left">
                  <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shrink-0"><CreditCard size={20} className="text-white" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{carregando ? t('fat.aAbrir') : t('fat.pagarOnline', { valor: fmtP(planoSelecionado) })}</p>
                    <p className="text-xs text-slate-500">{moedaPag === 'BRL' ? t('fat.metodosBRL') : t('fat.metodos')}</p>
                  </div>
                </button>
                <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5"><Shield size={12} /> {t('fat.seguro')}</p>
              </div>
            ) : (<>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {t('ct.fat.escolheMetodo')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModal('express-escolha')}
                disabled={carregando}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-200 transition-colors">
                  <Smartphone size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Multicaixa Express</p>
                  <p className="text-xs text-slate-400">{t('ct.fat.expressSub')}</p>
                </div>
              </button>

              <button
                onClick={() => setModal('iban-escolha')}
                disabled={carregando}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <Building2 size={20} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t('ct.fat.ibanTitulo')}</p>
                  <p className="text-xs text-slate-400">{t('ct.fat.ibanSub')}</p>
                </div>
              </button>
            </div>

            {/* Nota de confirmacao manual */}
            <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Clock size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>{t('ct.fat.conf24')}</strong> {t('ct.fat.confApos')}{' '}
                <strong>agendaaosuporte@gmail.com</strong> {t('ct.fat.confAssunto')}{' '}
                <strong>{t('ct.fat.confAssuntoVal')}</strong> {t('ct.fat.confFim')}
              </p>
            </div>
            </>)}
            </>)}
          </div>
        )}
      </div>

      {/* Historico de pagamentos */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{t('ct.fat.historico')}</h2>
        </div>
        {historico.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <CreditCard size={28} className="mx-auto mb-3 text-slate-200" />
            {t('ct.fat.vazio')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                {['Data', 'Plano', 'Referencia', 'Metodo', 'Valor', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide first:px-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historico.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(p.criadoEm).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium">
                    {p.assinatura?.plano || 'BASICO'}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-500">
                    {p.referencia || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {p.metodo === 'EXPRESS' ? <Smartphone size={13} /> : p.metodo === 'PADDLE' ? <CreditCard size={13} /> : <Building2 size={13} />}
                      <span className="text-xs">{p.metodo === 'EXPRESS' ? 'Express' : p.metodo === 'PADDLE' ? 'Online' : 'IBAN'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-800">{fmtMoeda(p.valor, p.moeda || 'AOA', locale)}</td>
                  <td className="px-4 py-4">
                    <span className={STATUS_BADGE[p.status]}>{t(`ct.fat.st${p.status}`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: Confirmar Express ── */}
      {modal === 'express-escolha' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">{t('ct.fat.payExpress')}</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="bg-brand-50 rounded-2xl p-4 mb-5">
              <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">
                {t('ct.fat.planoNome', { plano: t(`plano.${planoSelecionado}`) })}
              </p>
              <p className="font-display text-3xl font-bold text-brand-800">
                {fmtKz(PLANOS.find(p => p.key === planoSelecionado)?.preco)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{t('ct.fat.dadosPag')}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{t('ct.fat.numExpress')}</span>
                <span className="font-mono font-bold text-slate-800 text-sm">925 856 294</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{t('ct.fat.nome')}</span>
                <span className="text-slate-700 text-sm font-medium">Agenda Aqui</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{t('ct.fat.thValor')}</span>
                <span className="font-bold text-slate-800">
                  {fmtKz(PLANOS.find(p => p.key === planoSelecionado)?.preco)}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700">
                {t('ct.fat.expNota1')} <strong>agendaaosuporte@gmail.com</strong> {t('ct.fat.expNota2')}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={iniciarExpress} disabled={carregando} className="btn-primary flex-1">
                {carregando ? 'A gerar...' : 'Gerar referencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Info Express (apos gerar) ── */}
      {modal === 'express-info' && infoExpress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">{t('ct.fat.instrucoes')}</h2>
              <button onClick={() => { setModal(null); setPolling(false) }}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-2.5 mb-5">
              {[
                { label: t('ct.fat.numExpress'), valor: '925 856 294', mono: true },
                { label: t('ct.fat.nomeReceb'), valor: 'Agenda Aqui', mono: false },
                { label: t('ct.fat.valorPagar'), valor: fmtKz(infoExpress.valor), mono: false },
                { label: t('ct.fat.refObrig'), valor: infoExpress.referencia, mono: true },
              ].map(({ label, valor, mono }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className={`text-sm font-bold text-slate-800 ${mono ? 'font-mono' : ''}`}>{valor}</span>
                </div>
              ))}
            </div>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-brand-700">
                <strong>{t('ct.fat.passoTit')}</strong><br />
                {t('ct.fat.p1')}<br />
                {t('ct.fat.p2', { valor: fmtKz(infoExpress.valor) })} <strong>925 856 294</strong><br />
                {t('ct.fat.p3')} <strong>{infoExpress.referencia}</strong><br />
                {t('ct.fat.p4')} agendaaosuporte@gmail.com
              </p>
            </div>

            <button onClick={() => {
              navigator.clipboard.writeText(t('ct.fat.cpExpress', { num: '925 856 294', valor: fmtKz(infoExpress.valor), ref: infoExpress.referencia }))
              toast.success(t('ct.fat.copiados'))
            }} className="btn-ghost w-full text-sm mb-2">
              {t('ct.fat.copiar')}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <RefreshCw size={12} className="animate-spin" />
              {t('ct.fat.verificando')}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Escolher banco IBAN ── */}
      {modal === 'iban-escolha' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">{t('ct.fat.ibanTitulo')}</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-5">
              <p className="text-xs text-slate-500 mb-0.5">{t('ct.fat.valorTransf')}</p>
              <p className="font-display font-bold text-2xl text-slate-900">
                {fmtKz(PLANOS.find(p => p.key === planoSelecionado)?.preco)}
              </p>
              <p className="text-xs text-slate-400">{t('ct.fat.planoNome', { plano: t(`plano.${planoSelecionado}`) })}</p>
            </div>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{t('ct.fat.escolheBanco')}</p>
            <div className="space-y-2 mb-5">
              {[
                { key: 'ATLANTICO', label: 'Banco Atlantico' },
                { key: 'BAI', label: 'BAI - Banco Angolano de Investimentos' },
              ].map(b => (
                <button key={b.key} onClick={() => setBancoPref(b.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all
                    ${bancoPref === b.key ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="text-sm font-medium text-slate-700">{b.label}</span>
                  {bancoPref === b.key && <Check size={15} className="text-brand-600" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={iniciarIban} disabled={carregando} className="btn-primary flex-1">
                {carregando ? 'A gerar...' : 'Ver dados IBAN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Info IBAN ── */}
      {modal === 'iban-info' && infoIban && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">{t('ct.fat.dadosTransf')}</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>

            {/* Mostrar o IBAN preferido primeiro */}
            <div className="space-y-2.5 mb-5">
              {[
                { label: t('ct.fat.titular'), valor: infoIban.titular, mono: false },
                { label: bancoPref === 'ATLANTICO' ? 'IBAN Atlantico' : 'IBAN BAI',
                  valor: bancoPref === 'ATLANTICO' ? 'AO06.0055.0000.5012.2997.1018.1' : 'AO06.0040.0000.4755.2292.10181.9',
                  mono: true },
                { label: t('ct.fat.valor'), valor: fmtKz(infoIban.valor), mono: false },
                { label: t('ct.fat.refObrig'), valor: infoIban.referencia, mono: true },
              ].map(({ label, valor, mono }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className={`text-sm font-bold text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{valor}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700">
                <strong>{t('ct.fat.impt')}</strong> {t('ct.fat.imp1')} <strong>{infoIban.referencia}</strong> {t('ct.fat.imp2')} <strong>agendaaosuporte@gmail.com</strong>.
              </p>
            </div>

            <button onClick={() => {
              const iban = bancoPref === 'ATLANTICO' ? 'AO06.0055.0000.5012.2997.1018.1' : 'AO06.0040.0000.4755.2292.10181.9'
              navigator.clipboard.writeText(
                t('ct.fat.cpIban', { titular: infoIban.titular, iban, valor: fmtKz(infoIban.valor), ref: infoIban.referencia })
              )
              toast.success(t('ct.fat.copiados'))
            }} className="btn-ghost w-full mb-2 text-sm">
              {t('ct.fat.copiar')}
            </button>
            <button onClick={() => setModal(null)} className="btn-primary w-full text-sm">
              {t('ct.fat.jaFiz')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
