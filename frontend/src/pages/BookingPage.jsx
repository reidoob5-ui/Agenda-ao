import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { CalendarCheck, Clock, ChevronLeft, Check, MapPin, Phone, AlertTriangle, Hourglass } from 'lucide-react'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { pt } from 'date-fns/locale'

function fmtKz(v) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(v || 0)
}

export default function BookingPage() {
  const { slug } = useParams()
  const [negocio, setNegocio] = useState(null)
  const [erro, setErro] = useState(null)
  const [passo, setPasso] = useState(1) // 1=serviço 2=profissional 3=data/hora 4=dados 5=enviado
  const [servicoSel, setServico] = useState(null)
  const [profSel, setProf] = useState(null)
  const [dataSel, setData] = useState('')
  const [horaSel, setHora] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoad, setSlotsLoad] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' })
  const [enviando, setEnviando] = useState(false)
  const [agendamento, setAgendamento] = useState(null)
  
  // Estado para conflito de horário
  const [conflito, setConflito] = useState(null) // { mensagem, sugestoes[] }
  const [pendingPayload, setPendingPayload] = useState(null) // payload a re-enviar com sugestão

  useEffect(() => {
    api.get(`/public/negocio/${slug}`)
      .then(r => setNegocio(r.data))
      .catch((err) => {
        const msg = err.response?.data?.mensagem || err.response?.data?.erro || 'Negócio não encontrado'
        setErro(msg)
      })
  }, [slug])

  // Carregar slots quando muda data/profissional/serviço
  useEffect(() => {
    if (!dataSel || !profSel || !servicoSel) return
    setSlotsLoad(true)
    api.get(`/public/negocio/${slug}/disponibilidade?profissionalId=${profSel.id}&servicoId=${servicoSel.id}&data=${dataSel}`)
      .then(r => setSlots(r.data.slots))
      .finally(() => setSlotsLoad(false))
  }, [dataSel, profSel, servicoSel])

  const enviarPedido = async (payload) => {
    setEnviando(true)
    try {
      const r = await api.post(`/public/negocio/${slug}/agendar`, payload)
      setAgendamento(r.data.agendamento)
      setConflito(null)
      setPendingPayload(null)
      setPasso(5)
    } catch (err) {
      const data = err.response?.data
      if (err.response?.status === 409 && data?.sugestoes?.length > 0) {
        // Backend detectou conflito — mostrar modal com sugestões
        setPendingPayload(payload)
        setConflito({ mensagem: data.mensagem || 'Horário ocupado', sugestoes: data.sugestoes })
      } else {
        toast.error(data?.erro || 'Erro ao enviar pedido')
      }
    } finally {
      setEnviando(false)
    }
  }

  const confirmar = (e) => {
    e.preventDefault()
    const dataHora = `${dataSel}T${horaSel}:00`
    enviarPedido({
      ...form,
      profissionalId: profSel.id,
      servicoId: servicoSel.id,
      dataHora
    })
  }

  const aceitarSugestao = (horaStr) => {
    const dataHora = `${dataSel}T${horaStr}:00`
    setHora(horaStr)
    enviarPedido({ ...pendingPayload, dataHora })
  }

  // Gerar próximos 14 dias
  const diasDisponiveis = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i)
    return { data: format(d, 'yyyy-MM-dd'), label: format(d, "EEE d MMM", { locale: pt }), passado: isBefore(d, startOfDay(new Date())) }
  }).filter(d => !d.passado)

  // Profissionais que fazem o serviço selecionado
  const profsFiltrados = servicoSel
    ? (servicoSel.profissionais?.map(sp => sp.profissional).filter(Boolean) || negocio?.profissionais || [])
    : []

  if (erro) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <CalendarCheck size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{erro}</p>
      </div>
    </div>
  )

  if (!negocio) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
            {negocio.logo
              ? <img src={negocio.logo} alt={negocio.nome} className="w-full h-full object-cover rounded-xl" />
              : negocio.nome?.charAt(0)
            }
          </div>
          <div>
            <h1 className="font-display font-bold text-slate-900 text-lg leading-tight">{negocio.nome}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {negocio.endereco && <span className="flex items-center gap-1"><MapPin size={11}/>{negocio.cidade}</span>}
              {negocio.telefone && <span className="flex items-center gap-1"><Phone size={11}/>{negocio.telefone}</span>}
            </div>
          </div>
        </div>

        {passo < 5 && (
          <div className="max-w-lg mx-auto px-4 pb-4">
            <div className="flex items-center gap-1">
              {['Serviço', 'Profissional', 'Data & Hora', 'Dados'].map((label, i) => (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div className={`flex items-center gap-1.5 text-xs font-medium transition-all
                    ${i + 1 === passo ? 'text-brand-600' : i + 1 < passo ? 'text-green-600' : 'text-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${i + 1 === passo ? 'bg-brand-100 text-brand-700' :
                        i + 1 < passo ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-400'}`}>
                      {i + 1 < passo ? <Check size={10} /> : i + 1}
                    </div>
                    <span className="hidden sm:block">{label}</span>
                  </div>
                  {i < 3 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i + 1 < passo ? 'bg-green-300' : 'bg-slate-100'}`} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* PASSO 1 — Serviço */}
        {passo === 1 && (
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Escolhe o serviço</h2>
            <div className="space-y-2">
              {negocio.servicos?.map(s => (
                <button key={s.id} onClick={() => { setServico(s); setPasso(2) }}
                  className="w-full card p-4 flex items-center justify-between hover:border-brand-300 hover:shadow-soft transition-all text-left">
                  <div>
                    <p className="font-semibold text-slate-800">{s.nome}</p>
                    {s.descricao && <p className="text-xs text-slate-400 mt-0.5">{s.descricao}</p>}
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={11} />{s.duracaoMin} minutos
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-display font-bold text-brand-600 text-lg">{fmtKz(s.preco)}</p>
                  </div>
                </button>
              ))}
              {!negocio.servicos?.length && (
                <p className="text-slate-400 text-sm text-center py-8">Este negócio ainda não tem serviços configurados.</p>
              )}
            </div>
          </div>
        )}

        {/* PASSO 2 — Profissional */}
        {passo === 2 && (
          <div>
            <button onClick={() => setPasso(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-1">Escolhe o profissional</h2>
            <p className="text-sm text-slate-400 mb-4">Para {servicoSel?.nome}</p>
            <div className="space-y-2">
              <button onClick={() => { setProf(profsFiltrados[0] || negocio.profissionais[0]); setPasso(3) }}
                className="w-full card p-4 flex items-center gap-3 hover:border-brand-300 hover:shadow-soft transition-all text-left">
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold shrink-0">
                  ★
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Qualquer disponível</p>
                  <p className="text-xs text-slate-400">Atribui automaticamente ao primeiro livre</p>
                </div>
              </button>

              {profsFiltrados.map(p => (
                <button key={p.id} onClick={() => { setProf(p); setPasso(3) }}
                  className="w-full card p-4 flex items-center gap-3 hover:border-brand-300 hover:shadow-soft transition-all text-left">
                  <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                    {p.foto ? <img src={p.foto} alt={p.nome} className="w-full h-full object-cover rounded-full" /> : p.nome?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{p.nome}</p>
                    {p.bio && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 3 — Data & Hora */}
        {passo === 3 && (
          <div>
            <button onClick={() => setPasso(2)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Escolhe a data</h2>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {diasDisponiveis.map(d => (
                <button key={d.data} onClick={() => { setData(d.data); setHora('') }}
                  className={`shrink-0 px-3 py-2 rounded-xl text-center transition-all border
                    ${dataSel === d.data
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                  <p className="text-[10px] capitalize">{d.label.split(' ')[0]}</p>
                  <p className="font-bold text-sm">{d.label.split(' ')[1]}</p>
                  <p className="text-[10px] capitalize">{d.label.split(' ')[2]}</p>
                </button>
              ))}
            </div>

            {dataSel && (
              <>
                <h3 className="font-semibold text-slate-700 text-sm mb-3">Horários disponíveis</h3>
                {slotsLoad ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {slots.filter(s => s.disponivel).map(s => (
                      <button key={s.hora} onClick={() => setHora(s.hora)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                          ${horaSel === s.hora
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-brand-400'}`}>
                        {s.hora}
                      </button>
                    ))}
                    {slots.filter(s => s.disponivel).length === 0 && (
                      <p className="col-span-4 text-center text-slate-400 text-sm py-6">
                        Sem horários disponíveis neste dia. Escolhe outro dia.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {horaSel && (
              <button onClick={() => setPasso(4)} className="btn-primary w-full py-3">
                Continuar com {horaSel} →
              </button>
            )}
          </div>
        )}

        {/* PASSO 4 — Dados pessoais */}
        {passo === 4 && (
          <div>
            <button onClick={() => setPasso(3)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Os teus dados</h2>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-brand-700 font-medium">{servicoSel?.nome}</span>
                <span className="font-bold text-brand-800">{fmtKz(servicoSel?.preco)}</span>
              </div>
              <p className="text-xs text-brand-500">
                {profSel?.nome} · {dataSel && format(new Date(dataSel), "d 'de' MMMM", { locale: pt })} às {horaSel}
              </p>
            </div>

            <form onSubmit={confirmar} className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input className="input" placeholder="O teu nome" value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <label className="label">Número de telemóvel</label>
                <input className="input" placeholder="+244 923 456 789" value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })} required />
                <p className="text-xs text-slate-400 mt-1">Recebes o lembrete aqui antes do agendamento</p>
              </div>
              <div>
                <label className="label">Email (opcional)</label>
                <input className="input" type="email" placeholder="teu@email.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">Recebes a confirmação por email quando aprovado</p>
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-base" disabled={enviando}>
                {enviando ? 'A enviar pedido...' : 'Enviar pedido de agendamento'}
              </button>
              <p className="text-xs text-slate-400 text-center">
                O negócio irá confirmar o teu pedido em breve.
              </p>
            </form>
          </div>
        )}

        {/* PASSO 5 — Pedido enviado, a aguardar aprovação */}
        {passo === 5 && agendamento && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
              <Hourglass size={36} className="text-amber-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Pedido enviado!</h2>
            <p className="text-slate-500 mb-2">Obrigado, <strong>{agendamento.cliente?.nome?.split(' ')[0]}</strong>!</p>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-full mb-6 animate-pulse">
              <Clock size={14} />
              A aguardar aprovação do negócio
            </div>

            <div className="card p-5 text-left mb-6">
              {[
                { label: 'Serviço', valor: agendamento.servico?.nome },
                { label: 'Profissional', valor: agendamento.profissional?.nome },
                { label: 'Data', valor: format(new Date(agendamento.dataHora), "d 'de' MMMM 'de' yyyy", { locale: pt }) },
                { label: 'Hora', valor: format(new Date(agendamento.dataHora), 'HH:mm') },
                { label: 'Valor', valor: fmtKz(agendamento.preco) },
              ].map(({ label, valor }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-slate-800">{valor}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 mb-5 text-left">
              <p className="font-semibold mb-1">📬 O que acontece agora?</p>
              <ul className="space-y-1 text-xs text-blue-600">
                <li>• O negócio irá aprovar ou rejeitar o teu pedido</li>
                <li>• Se forneceste email, receberás a confirmação por email</li>
                <li>• O teu lugar fica reservado até à decisão</li>
              </ul>
            </div>

            <button onClick={() => { setPasso(1); setServico(null); setProf(null); setData(''); setHora(''); setForm({ nome:'', telefone:'', email:'' }); setAgendamento(null) }}
              className="btn-ghost text-sm">
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>

      {/* Modal de conflito — Sugestão de horários livres */}
      {conflito && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-amber-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 text-center mb-2">
              Horário ocupado
            </h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              {conflito.mensagem}
            </p>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 text-center">
              Horários livres mais próximos
            </p>

            <div className="flex gap-3 justify-center mb-5">
              {conflito.sugestoes.map(hora => (
                <button
                  key={hora}
                  onClick={() => aceitarSugestao(hora)}
                  disabled={enviando}
                  className="flex-1 py-3 rounded-xl bg-brand-50 border-2 border-brand-200 hover:bg-brand-600 hover:text-white hover:border-brand-600 text-brand-700 font-display font-bold text-lg transition-all disabled:opacity-50">
                  {hora}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setConflito(null); setPendingPayload(null) }}
              className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
              Escolher outra data
            </button>
          </div>
        </div>
      )}

      {/* Footer powered by */}
      <div className="text-center py-6">
        <a href="/" className="text-xs text-slate-300 hover:text-slate-500 transition-colors flex items-center justify-center gap-1">
          <CalendarCheck size={12} />
          Powered by AgendaAO
        </a>
      </div>
    </div>
  )
}
