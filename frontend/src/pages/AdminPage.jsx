import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, CheckCircle, XCircle,
  Clock, TrendingUp, ShieldAlert, RefreshCw, CalendarCheck,
  Building2, Smartphone, Eye, EyeOff, LogOut, AlertTriangle
} from 'lucide-react'

const ADMIN_SECRET_KEY = 'agendaao-admin-secret'
const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

function fmtKz(v) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(v || 0)
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const PLANO_COR = {
  BASICO: 'bg-slate-100 text-slate-600',
  PROFISSIONAL: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-amber-100 text-amber-700',
}

const STATUS_COR = {
  ATIVO: 'bg-green-100 text-green-700',
  EXPIRADO: 'bg-red-100 text-red-700',
  SUSPENSO: 'bg-orange-100 text-orange-700',
}

async function adminFetch(path, options = {}, segredo) {
  const res = await fetch(`${API}/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': segredo,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error((await res.json()).erro || 'Erro')
  return res.json()
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [segredo, setSegredo] = useState(() => sessionStorage.getItem(ADMIN_SECRET_KEY) || '')
  const [mostrarSegredo, setMostrarSegredo] = useState(false)
  const [autenticado, setAutenticado] = useState(false)
  const [aba, setAba] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [negocios, setNegocios] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [pendentes, setPendentes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  const entrar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    try {
      const data = await adminFetch('/stats', {}, segredo)
      setStats(data)
      sessionStorage.setItem(ADMIN_SECRET_KEY, segredo)
      setAutenticado(true)
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Chave de admin incorreta' })
    } finally {
      setCarregando(false)
    }
  }

  const sair = () => {
    sessionStorage.removeItem(ADMIN_SECRET_KEY)
    setAutenticado(false)
    setSegredo('')
  }

  const carregarDados = async (s = segredo) => {
    setCarregando(true)
    try {
      const [st, neg, pend, pag] = await Promise.all([
        adminFetch('/stats', {}, s),
        adminFetch('/negocios', {}, s),
        adminFetch('/pagamentos-pendentes', {}, s),
        adminFetch('/pagamentos', {}, s),
      ])
      setStats(st)
      setNegocios(neg)
      setPendentes(pend)
      setPagamentos(pag)
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (autenticado) carregarDados()
  }, [autenticado])

  const confirmar = async (id) => {
    if (!confirm('Confirmar pagamento e activar plano?')) return
    try {
      await adminFetch(`/confirmar-pagamento/${id}`, { method: 'POST' }, segredo)
      setMensagem({ tipo: 'sucesso', texto: 'Plano activado com sucesso!' })
      carregarDados()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  const rejeitar = async (id) => {
    if (!confirm('Rejeitar este pagamento?')) return
    try {
      await adminFetch(`/rejeitar-pagamento/${id}`, { method: 'POST' }, segredo)
      setMensagem({ tipo: 'aviso', texto: 'Pagamento rejeitado' })
      carregarDados()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  const suspender = async (id) => {
    if (!confirm('Suspender este negocio?')) return
    try {
      await adminFetch(`/suspender-negocio/${id}`, { method: 'POST' }, segredo)
      setMensagem({ tipo: 'aviso', texto: 'Negocio suspenso' })
      carregarDados()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  const activar = async (id) => {
    const plano = prompt('Plano a activar? (BASICO, PROFISSIONAL, PREMIUM)', 'BASICO')
    if (!plano) return
    try {
      await adminFetch(`/activar-negocio/${id}`, { method: 'POST', body: JSON.stringify({ plano: plano.toUpperCase(), dias: 30 }) }, segredo)
      setMensagem({ tipo: 'sucesso', texto: 'Negocio activado por 30 dias' })
      carregarDados()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <CalendarCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-none">AgendaAO</p>
              <p className="text-slate-400 text-xs">Painel Admin</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert size={18} className="text-amber-400" />
              <h1 className="text-white font-semibold">Acesso Restrito</h1>
            </div>

            {mensagem && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {mensagem.texto}
              </div>
            )}

            <form onSubmit={entrar} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Chave de Administrador
                </label>
                <div className="relative">
                  <input
                    type={mostrarSegredo ? 'text' : 'password'}
                    value={segredo}
                    onChange={e => setSegredo(e.target.value)}
                    placeholder="Insere a chave admin"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setMostrarSegredo(!mostrarSegredo)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {mostrarSegredo ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={carregando}
                className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all">
                {carregando ? 'A verificar...' : 'Entrar no Admin'}
              </button>
            </form>
          </div>
          <p className="text-center text-slate-600 text-xs mt-4">
            <button onClick={() => navigate('/')} className="hover:text-slate-400 transition-colors">
              ← Voltar ao site
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ─── Dashboard Admin ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar Admin */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <CalendarCheck size={14} className="text-white" />
              </div>
              <span className="font-display font-bold text-sm">AgendaAO Admin</span>
            </div>
            <nav className="flex gap-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'pendentes', label: `Pendentes ${pendentes.length ? `(${pendentes.length})` : ''}`, icon: Clock },
                { id: 'negocios', label: 'Negócios', icon: Users },
                { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setAba(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${aba === id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                  <Icon size={13} />
                  {label}
                  {id === 'pendentes' && pendentes.length > 0 && (
                    <span className="ml-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {pendentes.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => carregarDados()} disabled={carregando}
              className="text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
            </button>
            <button onClick={sair}
              className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-xs transition-colors">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`mb-4 p-3 rounded-xl text-sm flex items-center justify-between
            ${mensagem.tipo === 'sucesso' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
              mensagem.tipo === 'aviso' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
              'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {mensagem.texto}
            <button onClick={() => setMensagem(null)} className="text-current opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
        {aba === 'dashboard' && stats && (
          <div>
            <h2 className="font-display text-xl font-bold mb-5">Visão Geral</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Negócios', valor: stats.totalNegocios, icon: Users, cor: 'text-blue-400 bg-blue-400/10' },
                { label: 'Activos', valor: stats.negociosActivos, icon: CheckCircle, cor: 'text-green-400 bg-green-400/10' },
                { label: 'Pagamentos Pendentes', valor: stats.pagamentosPendentes, icon: Clock, cor: 'text-amber-400 bg-amber-400/10' },
                { label: 'Novos este mês', valor: stats.novosNegociosMes, icon: TrendingUp, cor: 'text-brand-400 bg-brand-400/10' },
              ].map(({ label, valor, icon: Icon, cor }) => (
                <div key={label} className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cor}`}>
                    <Icon size={18} />
                  </div>
                  <p className="font-display text-2xl font-bold">{valor}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Receita Total</p>
                <p className="font-display text-3xl font-bold text-green-400">{fmtKz(stats.receitaTotal)}</p>
                <p className="text-xs text-slate-500 mt-1">Todos os tempos</p>
              </div>
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Receita Este Mês</p>
                <p className="font-display text-3xl font-bold text-brand-400">{fmtKz(stats.receitaMes)}</p>
                <p className="text-xs text-slate-500 mt-1">Pagamentos confirmados</p>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDENTES ─────────────────────────────────────────────────────── */}
        {aba === 'pendentes' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-xl font-bold">Pagamentos Pendentes</h2>
              {pendentes.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendentes.length}
                </span>
              )}
            </div>

            {pendentes.length === 0 ? (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
                <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">Sem pagamentos pendentes. Tudo em dia!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendentes.map(p => (
                  <div key={p.id} className="bg-slate-800 rounded-2xl border border-amber-500/30 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {p.metodo === 'EXPRESS'
                            ? <Smartphone size={15} className="text-brand-400" />
                            : <Building2 size={15} className="text-slate-400" />}
                          <span className="text-xs text-slate-400 font-semibold uppercase">
                            {p.metodo === 'EXPRESS' ? 'Multicaixa Express' : 'Transferência IBAN'}
                          </span>
                          <span className="text-xs text-slate-500">· {fmtData(p.criadoEm)}</span>
                        </div>
                        <p className="font-semibold text-white">{p.negocio?.nome}</p>
                        <p className="text-xs text-slate-400">{p.negocio?.email} · {p.negocio?.telefone}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-bold text-green-400">{fmtKz(p.valor)}</span>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                            Plano {p.assinatura?.plano || 'BASICO'}
                          </span>
                          <span className="font-mono text-xs text-slate-500">Ref: {p.referencia}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => confirmar(p.id)}
                          className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-500/20 transition-all">
                          <CheckCircle size={13} /> Confirmar
                        </button>
                        <button onClick={() => rejeitar(p.id)}
                          className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-all">
                          <XCircle size={13} /> Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NEGÓCIOS ──────────────────────────────────────────────────────── */}
        {aba === 'negocios' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-5">Todos os Negócios ({negocios.length})</h2>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Negócio', 'Plano', 'Status', 'Registado', 'Expira', 'Acções'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {negocios.map(n => {
                    const dono = n.usuarios?.[0]
                    return (
                      <tr key={n.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white text-sm">{n.nome}</p>
                          <p className="text-xs text-slate-500">{dono?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLANO_COR[n.plano] || 'bg-slate-700 text-slate-400'}`}>
                            {n.plano}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[n.planoStatus] || 'bg-slate-700 text-slate-400'}`}>
                            {n.planoStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(n.criadoEm).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {n.planoExpira ? new Date(n.planoExpira).toLocaleDateString('pt-PT') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => activar(n.id)}
                              className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors">
                              Activar
                            </button>
                            <button onClick={() => suspender(n.id)}
                              className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
                              Suspender
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {negocios.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-sm">Sem negócios registados ainda.</div>
              )}
            </div>
          </div>
        )}

        {/* ── PAGAMENTOS ────────────────────────────────────────────────────── */}
        {aba === 'pagamentos' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-5">Histórico de Pagamentos</h2>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Data', 'Negócio', 'Plano', 'Método', 'Valor', 'Referência', 'Estado'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {pagamentos.map(p => (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtData(p.criadoEm)}</td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium text-sm">{p.negocio?.nome}</p>
                        <p className="text-xs text-slate-500">{p.negocio?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{p.assinatura?.plano || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          {p.metodo === 'EXPRESS' ? <Smartphone size={12} /> : <Building2 size={12} />}
                          <span className="text-xs">{p.metodo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-400 text-sm">{fmtKz(p.valor)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.referencia || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${p.status === 'APROVADO' ? 'bg-green-500/20 text-green-400' :
                            p.status === 'PENDENTE' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagamentos.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-sm">Sem pagamentos registados.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
