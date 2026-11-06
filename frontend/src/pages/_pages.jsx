// ─── AGENDA PAGE ─────────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { dfLocale } from '../utils/dfLocale'
import { useT, traduzir, IDIOMAS } from '../i18n'
import { ChevronLeft, ChevronRight, X, Check, Clock, User, Scissors, Plus, Video } from 'lucide-react'
import { fmtDinheiro } from '../utils/moeda'
import { fmtHora, FUSO_PADRAO } from '../utils/tempo'
const hhmm = (v) => fmtHora(v, useAuthStore.getState().negocio?.fusoHorario || FUSO_PADRAO, 'en-GB')
import { useAuthStore } from '../store/authStore'
import { linkWhatsApp } from '../utils/whatsapp'
import { usePlano } from '../utils/planos'
import Bloqueado from '../components/Bloqueado'

const STATUS_BADGE = { PENDENTE:'badge-yellow',CONFIRMADO:'badge-green',CONCLUIDO:'badge-gray',CANCELADO:'badge-red' }
function fmtKz(v){return fmtDinheiro(v)}

export function AgendaPage() {
  const { negocio } = useAuthStore()
  const { t, idioma } = useT()
  const [dataAtual, setDataAtual] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState([])
  const [pendentes, setPendentes] = useState([])
  const [abaPendentes, setAbaPendentes] = useState(false)

  const slug = negocio?.slug

  // Mensagem de WhatsApp para o cliente (abre o WhatsApp com o texto pronto)
  const linkMensagem = (ag) => {
    // A mensagem vai para o cliente: usa o idioma do negócio, não o do dono
    const idN = IDIOMAS.some(i => i.codigo === negocio?.idioma) ? negocio.idioma : idioma
    const tn = (k, v) => traduzir(idN, k, v)
    const data = format(parseISO(ag.dataHora), tn('ag.fmt.diaMes'), { locale: dfLocale(idN) })
    const quando = tn('ag.quando', { data, hora: hhmm(ag.dataHora) })
    const vars = { cliente: ag.cliente?.nome, negocio: negocio?.nome, servico: ag.servico?.nome, profissional: ag.profissional?.nome, quando }
    const texto = tn(ag.status === 'PENDENTE' ? 'ag.msg.pendente' : 'ag.msg.confirmado', vars)
    return linkWhatsApp(ag.cliente?.telefone, texto)
  }

  const carregar = async () => {
    const data = format(dataAtual, 'yyyy-MM-dd')
    const r = await api.get(`/agendamentos?data=${data}`)
    setAgendamentos(r.data)
  }

  const carregarPendentes = async () => {
    try {
      const r = await api.get(`/public/negocio/${slug}/pendentes`)
      setPendentes(r.data)
    } catch(err) { console.error(err) }
  }

  useEffect(() => { carregar() }, [dataAtual])
  useEffect(() => { if (slug) carregarPendentes() }, [slug])

  // Polling de 20s para detectar novos pedidos pendentes
  useEffect(() => {
    if (!slug) return
    const iv = setInterval(carregarPendentes, 20000)
    return () => clearInterval(iv)
  }, [slug])

  const atualizarStatus = async (id, status) => {
    await api.patch(`/agendamentos/${id}/status`, { status })
    toast.success(t('ag.toast.estado')); carregar()
  }

  const aprovar = async (id) => {
    try {
      await api.patch(`/public/negocio/${slug}/agendamento/${id}/aprovar`)
      toast.success(t('ag.toast.aprovado'))
      carregarPendentes(); carregar()
    } catch(err) { toast.error(err.response?.data?.erro || t('ag.err.aprovar')) }
  }

  const rejeitar = async (id) => {
    try {
      await api.patch(`/public/negocio/${slug}/agendamento/${id}/rejeitar`)
      toast.success(t('ag.toast.rejeitado'))
      carregarPendentes(); carregar()
    } catch(err) { toast.error(err.response?.data?.erro || t('ag.err.rejeitar')) }
  }

  return (
    <div className="p-6">
      {/* Cabeçalho com navegação de datas + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setDataAtual(d => subDays(d, 1))} className="btn-ghost p-2"><ChevronLeft size={16}/></button>
          <h1 className="font-display text-xl font-bold text-slate-900 capitalize">
            {format(dataAtual, t('ag.fmt.diaSemana'), { locale: dfLocale(idioma) })}
          </h1>
          <button onClick={() => setDataAtual(d => addDays(d, 1))} className="btn-ghost p-2"><ChevronRight size={16}/></button>
          <button onClick={() => setDataAtual(new Date())} className="btn-ghost text-xs px-3">{t('ag.hoje')}</button>
        </div>

        {/* Tabs: Agenda | Pedidos Pendentes */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
          <button
            onClick={() => setAbaPendentes(false)}
            className={`px-4 py-2 font-medium transition-all ${
              !abaPendentes ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}>
            {t('ag.tab.agenda')}
          </button>
          <button
            onClick={() => setAbaPendentes(true)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-all ${
              abaPendentes ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}>
            {t('ag.tab.pendentes')}
            {pendentes.length > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                abaPendentes ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
              }`}>
                {pendentes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ABA: Agenda */}
      {!abaPendentes && (
        <div className="card overflow-hidden">
          {agendamentos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-400">{t('ag.vazio.dia')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.col.hora')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.col.cliente')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.col.servico')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.col.profissional')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.col.valor')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.col.estado')}</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {agendamentos.map(ag => (
                  <tr key={ag.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-display font-bold text-slate-800">{hhmm(ag.dataHora)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                          {ag.cliente?.nome?.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{ag.cliente?.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{ag.servico?.nome}</td>
                    <td className="px-4 py-4 text-slate-600">{ag.profissional?.nome}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{fmtKz(ag.preco)}</td>
                    <td className="px-4 py-4"><span className={STATUS_BADGE[ag.status]}>{t('ag.status.' + ag.status)}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {ag.status === 'CONFIRMADO' && ag.linkSessao && (
                          <a href={ag.linkSessao} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-medium px-2 flex items-center gap-1">
                            <Video size={12}/> {t('ag.entrarConsulta')}
                          </a>
                        )}
                        {['PENDENTE','CONFIRMADO'].includes(ag.status) && linkMensagem(ag) && (
                          <a href={linkMensagem(ag)} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-medium px-2">
                            WhatsApp
                          </a>
                        )}
                        {ag.status === 'CONFIRMADO' && (
                          <button onClick={() => atualizarStatus(ag.id,'CONCLUIDO')} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium px-2">
                            {t('ag.feito')}
                          </button>
                        )}
                        {['PENDENTE','CONFIRMADO'].includes(ag.status) && (
                          <button onClick={() => atualizarStatus(ag.id,'CANCELADO')} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                            <X size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ABA: Pedidos Pendentes */}
      {abaPendentes && (
        <div>
          {pendentes.length === 0 ? (
            <div className="card py-16 text-center">
              <Check size={32} className="text-green-400 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">{t('ag.vazio.pendentes')}</p>
              <p className="text-slate-300 text-sm mt-1">{t('ag.vazio.pendentesSub')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendentes.map(ag => {
                const dataFmt = format(parseISO(ag.dataHora), t('ag.fmt.diaMesAno'), { locale: dfLocale(idioma) })
                const horaFmt = hhmm(ag.dataHora)
                return (
                  <div key={ag.id} className="card p-5 border-l-4 border-amber-400">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
                            {ag.cliente?.nome?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{ag.cliente?.nome}</p>
                            <p className="text-xs text-slate-400">{ag.cliente?.telefone}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600 pl-11">
                          <span className="flex items-center gap-1"><Scissors size={13} className="text-brand-500"/>{ag.servico?.nome}</span>
                          <span className="flex items-center gap-1"><User size={13} className="text-slate-400"/>{ag.profissional?.nome}</span>
                          <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400"/>{t('ag.quando', { data: dataFmt, hora: horaFmt })}</span>
                        </div>
                        <p className="pl-11 font-display font-bold text-brand-600">{fmtKz(ag.preco)}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => aprovar(ag.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all shadow-sm">
                          <Check size={14}/> {t('ag.aprovar')}
                        </button>
                        <button
                          onClick={() => rejeitar(ag.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-all border border-red-100">
                          <X size={14}/> {t('ag.rejeitar')}
                        </button>
                        {linkMensagem(ag) && (
                          <a href={linkMensagem(ag)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-green-50 text-green-700 text-sm font-semibold transition-all border border-green-200">
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CLIENTES PAGE ────────────────────────────────────────────────────────────
export function ClientesPage() {
  const { tem } = usePlano()
  const { t, idioma } = useT()
  const { negocio } = useAuthStore()
  // Mensagem para o cliente: idioma do negócio, não do dono
  const msgOla = (nome) => {
    const idN = IDIOMAS.some(i => i.codigo === negocio?.idioma) ? negocio.idioma : idioma
    return traduzir(idN, 'ag.msg.ola', { nome: nome?.split(' ')[0] || '' })
  }
  const [clientes, setClientes] = useState([])
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome:'',telefone:'',email:'' })
  const [selecionado, setSelecionado] = useState(null)

  const carregar = async () => {
    const r = await api.get(`/clientes${q ? `?q=${q}` : ''}`)
    setClientes(r.data)
  }

  useEffect(() => { carregar() }, [q])

  const criarCliente = async (e) => {
    e.preventDefault()
    try {
      await api.post('/clientes', form)
      toast.success(t('ag.cli.criado')); setModal(false); setForm({nome:'',telefone:'',email:''}); carregar()
    } catch(err) { toast.error(err.response?.data?.erro || t('ag.err.generico')) }
  }

  const verCliente = async (id) => {
    // Basico: so a ficha simples (contacto). Historico/CRM e do Profissional para cima.
    if (!tem('crm')) {
      setSelecionado({ ...clientes.find(c => c.id === id), semCrm: true })
      return
    }
    try {
      const r = await api.get(`/clientes/${id}`)
      setSelecionado(r.data)
    } catch (err) { toast.error(err.response?.data?.erro || t('ag.err.abrirCliente')) }
  }

  // Premium: usar pontos de fidelidade (ex.: desconto na proxima visita)
  const usarPontos = async () => {
    const txt = window.prompt(t('ag.cli.promptPontos', { n: selecionado.pontosFidelidade }))
    if (!txt) return
    const pontos = parseInt(txt)
    if (!(pontos > 0)) return toast.error(t('ag.cli.numInvalido'))
    try {
      const r = await api.post(`/clientes/${selecionado.id}/pontos/usar`, { pontos })
      setSelecionado({ ...selecionado, pontosFidelidade: r.data.pontosFidelidade })
      toast.success(t('ag.cli.pontosUsados', { n: pontos }))
      carregar()
    } catch (err) { toast.error(err.response?.data?.erro || t('ag.err.usarPontos')) }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">{t('ag.cli.titulo')}</h1>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> {t('ag.cli.novo')}
        </button>
      </div>
      <div className="card mb-4 p-4">
        <input className="input" placeholder={t('ag.cli.pesquisar')} value={q}
          onChange={e=>setQ(e.target.value)} />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.col.cliente')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.cli.col.telefone')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.cli.col.visitas')}</th>
            {tem('fidelidade') && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.cli.col.pontos')}</th>}
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {clientes.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={()=>verCliente(c.id)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                      {c.nome?.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800">{c.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600">{c.telefone}</td>
                <td className="px-4 py-4 font-semibold text-slate-800">{c._count?.agendamentos || 0}</td>
                {tem('fidelidade') && <td className="px-4 py-4"><span className="badge-blue">{t('ag.cli.pts', { n: c.pontosFidelidade })}</span></td>}
                <td className="px-4 py-4"><ChevronRight size={14} className="text-slate-300"/></td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">{t('ag.cli.nenhum')}</div>
        )}
      </div>

      {/* Modal criar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">{t('ag.cli.novo')}</h2>
              <button onClick={()=>setModal(false)}><X size={18} className="text-slate-400"/></button>
            </div>
            <form onSubmit={criarCliente} className="space-y-4">
              <div><label className="label">{t('ag.cli.nome')}</label>
                <input className="input" placeholder={t('ag.cli.nomePh')} value={form.nome}
                  onChange={e=>setForm({...form,nome:e.target.value})} required/></div>
              <div><label className="label">{t('ag.cli.telefone')}</label>
                <input className="input" placeholder="+244 923 456 789" value={form.telefone}
                  onChange={e=>setForm({...form,telefone:e.target.value})} required/></div>
              <div><label className="label">{t('ag.cli.emailOpt')}</label>
                <input className="input" type="email" placeholder="email@exemplo.com" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})}/></div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">{t('ag.cli.cancelar')}</button>
                <button type="submit" className="btn-primary flex-1">{t('ag.cli.criar')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer cliente */}
      {selecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-end z-50">
          <div className="bg-white w-full md:w-96 h-full md:h-auto md:rounded-l-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg">{selecionado.nome}</h2>
              <button onClick={()=>setSelecionado(null)}><X size={18} className="text-slate-400"/></button>
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-slate-600">📱 {selecionado.telefone}</p>
              {selecionado.email && <p className="text-sm text-slate-600">📧 {selecionado.email}</p>}
              {tem('fidelidade') && (
                <p className="text-sm flex items-center gap-2">
                  <span className="badge-blue">{t('ag.cli.pontos', { n: selecionado.pontosFidelidade })}</span>
                  <button onClick={usarPontos} className="text-xs font-semibold text-brand-700 hover:underline">{t('ag.cli.usarPontos')}</button>
                </p>
              )}
              {selecionado.telefone && linkWhatsApp(selecionado.telefone, msgOla(selecionado.nome)) && (
                <a href={linkWhatsApp(selecionado.telefone, msgOla(selecionado.nome))} target="_blank" rel="noreferrer"
                   className="inline-block text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  {t('ag.cli.falarWhats')}
                </a>
              )}
            </div>
            {selecionado.semCrm ? (
              <Bloqueado compacto planoNecessario="PROFISSIONAL"
                titulo={t('ag.cli.bloqTitulo')}
                texto={t('ag.cli.bloqTexto')} />
            ) : (<>
            <h3 className="font-semibold text-slate-700 text-sm mb-3">{t('ag.cli.historial')}</h3>
            <div className="space-y-2">
              {selecionado.agendamentos?.slice(0,10).map(ag => (
                <div key={ag.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{ag.servico?.nome}</p>
                    <p className="text-xs text-slate-400">{format(parseISO(ag.dataHora),'dd/MM/yyyy')}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{fmtKz(ag.preco)}</span>
                </div>
              ))}
            </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SERVIÇOS PAGE ────────────────────────────────────────────────────────────
export function ServicosPage() {
  const { t } = useT()
  const [servicos, setServicos] = useState([])
  const [profissionais, setProfissionais] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome:'',descricao:'',duracaoMin:30,preco:0,online:false,profissionalIds:[] })

  const carregar = async () => {
    const [s,p] = await Promise.all([api.get('/servicos'),api.get('/profissionais')])
    setServicos(s.data); setProfissionais(p.data)
  }
  useEffect(()=>{ carregar() },[])

  const criarServico = async (e) => {
    e.preventDefault()
    try {
      await api.post('/servicos', form)
      toast.success(t('ag.srv.criado')); setModal(false); carregar()
    } catch(err) { toast.error(err.response?.data?.erro || t('ag.err.generico')) }
  }

  const toggleAtivo = async (id, ativo) => {
    await api.put(`/servicos/${id}`, { ativo: !ativo })
    carregar()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">{t('ag.srv.titulo')}</h1>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> {t('ag.srv.novo')}
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.srv.col.servico')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.srv.col.duracao')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.srv.col.preco')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.srv.col.profissionais')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{t('ag.srv.col.activo')}</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {servicos.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-800">{s.nome}{s.online && <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold"><Video size={10}/> {t('ag.srv.online')}</span>}</td>
                <td className="px-4 py-4 text-slate-600">{t('ag.srv.min', { n: s.duracaoMin })}</td>
                <td className="px-4 py-4 font-semibold text-slate-800">{fmtKz(s.preco)}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {s.profissionais?.slice(0,3).map(sp => (
                      <span key={sp.profissional?.id} className="badge-gray">{sp.profissional?.nome}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <button onClick={()=>toggleAtivo(s.id,s.ativo)}
                    className={`relative w-10 h-5 rounded-full transition-all ${s.ativo ? 'bg-green-500' : 'bg-slate-200'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.ativo ? 'left-5' : 'left-0.5'}`}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">{t('ag.srv.novo')}</h2>
              <button onClick={()=>setModal(false)}><X size={18} className="text-slate-400"/></button>
            </div>
            <form onSubmit={criarServico} className="space-y-4">
              <div><label className="label">{t('ag.cli.nome')}</label>
                <input className="input" placeholder={t('ag.srv.nomePh')} value={form.nome}
                  onChange={e=>setForm({...form,nome:e.target.value})} required/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t('ag.srv.duracaoMin')}</label>
                  <input className="input" type="number" min="5" step="5" value={form.duracaoMin}
                    onChange={e=>setForm({...form,duracaoMin:parseInt(e.target.value)})}/></div>
                <div><label className="label">{t('ag.srv.precoMoeda', { moeda: useAuthStore.getState().negocio?.moeda || 'AOA' })}</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.preco}
                    onChange={e=>setForm({...form,preco:parseFloat(e.target.value)||0})}/></div>
              </div>
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-teal-300">
                <input type="checkbox" className="mt-0.5" checked={form.online} onChange={e=>setForm({...form,online:e.target.checked})}/>
                <span><span className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Video size={14} className="text-teal-600"/> {t('ag.srv.sessaoOnline')}</span>
                <span className="block text-xs text-slate-400">{t('ag.srv.sessaoOnlineDesc')}</span></span>
              </label>
              <div><label className="label">{t('ag.srv.col.profissionais')}</label>
                <div className="flex flex-wrap gap-2">
                  {profissionais.map(p => (
                    <button type="button" key={p.id}
                      onClick={()=>{const ids=form.profissionalIds;setForm({...form,profissionalIds:ids.includes(p.id)?ids.filter(i=>i!==p.id):[...ids,p.id]})}}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.profissionalIds.includes(p.id)?'bg-brand-50 border-brand-500 text-brand-700':'border-slate-200 text-slate-500'}`}>
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">{t('ag.cli.cancelar')}</button>
                <button type="submit" className="btn-primary flex-1">{t('ag.cli.criar')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Re-exports simples para as outras páginas
export { default as RelatoriosPage } from './RelatoriosPage'
export { default as ConfigPage } from './ConfigPage'
export { default as FaturacaoPage } from './FaturacaoPage'
export { default as BookingPage } from './BookingPage'
