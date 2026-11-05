import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { CalendarCheck, Clock, ChevronLeft, Check, MapPin, Phone, AlertTriangle, Hourglass, PartyPopper, XCircle, ExternalLink, Video, Copy } from 'lucide-react'
import { estiloDaMarca } from '../utils/planos'
import AssinaturaAda from '../components/AssinaturaAda'
import SeletorIdioma from '../components/SeletorIdioma'
import { useT, useIdioma } from '../i18n'
import { fmtMoeda } from '../utils/moeda'
import { brCodePix } from '../utils/pix'
import { FUSO_PADRAO, fusoDoNavegador, hojeNoFuso, somarDias, rotuloDia, paraInstante, fmtHora, fmtDataLonga, fmtDataCurta, nomeDoFuso } from '../utils/tempo'

export default function BookingPage() {
  const { slug } = useParams()
  const { t, locale } = useT()
  const sugerirIdioma = useIdioma((s) => s.sugerir)
  const [negocio, setNegocio] = useState(null)
  const [erro, setErro] = useState(null)
  const [passo, setPasso] = useState(1) // 1=serviço 2=profissional 3=data/hora 4=dados 5=enviado 6=confirmado 7=recusado
  const [servicoSel, setServico] = useState(null)
  const [profSel, setProf] = useState(null)
  const [dataSel, setData] = useState('')
  const [horaSel, setHora] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoad, setSlotsLoad] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' })
  const [enviando, setEnviando] = useState(false)
  const [agendamento, setAgendamento] = useState(null)
  const [conflito, setConflito] = useState(null) // { mensagem, sugestoes[], listaEspera }
  const [pendingPayload, setPendingPayload] = useState(null)
  const [espera, setEspera] = useState(null) // { nome, telefone } quando o dia está cheio
  const [copiado, setCopiado] = useState(false)
  const pollingRef = useRef(null)

  // Tudo o que o negócio define: fuso horário, moeda, idioma
  const fuso = negocio?.fusoHorario || FUSO_PADRAO
  const moeda = negocio?.moeda || 'AOA'
  const fmt = (v) => fmtMoeda(v, moeda, locale)
  const fusoCliente = useMemo(() => fusoDoNavegador(), [])

  useEffect(() => {
    api.get(`/public/negocio/${slug}`)
      .then(r => { setNegocio(r.data); sugerirIdioma(r.data.idioma) })
      .catch((err) => setErro(err.response?.data?.mensagem || err.response?.data?.erro || t('book.erroNegocio')))
  }, [slug])

  // Carregar horários quando muda data/profissional/serviço
  useEffect(() => {
    if (!dataSel || !profSel || !servicoSel) return
    setSlotsLoad(true)
    api.get(`/public/negocio/${slug}/disponibilidade?profissionalId=${profSel.id}&servicoId=${servicoSel.id}&data=${dataSel}`)
      .then(r => setSlots(r.data.slots))
      .finally(() => setSlotsLoad(false))
  }, [dataSel, profSel, servicoSel])

  // Limpar polling ao sair da página
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])

  const reiniciar = () => {
    setPasso(1); setServico(null); setProf(null); setData(''); setHora('')
    setForm({ nome: '', telefone: '', email: '' }); setAgendamento(null)
  }

  const enviarPedido = async (payload) => {
    setEnviando(true)
    try {
      const r = await api.post(`/public/negocio/${slug}/agendar`, payload)
      const ag = r.data.agendamento
      setAgendamento({ ...ag, negocio })
      setConflito(null)
      setPendingPayload(null)
      setPasso(5)
      iniciarPolling(ag.id)
    } catch (err) {
      const data = err.response?.data
      if (err.response?.status === 409 && (data?.sugestoes?.length > 0 || data?.listaEspera)) {
        setPendingPayload(payload)
        setConflito({ mensagem: data.mensagem || t('book.ocupado'), sugestoes: data.sugestoes || [], listaEspera: !!data.listaEspera })
      } else {
        toast.error(data?.mensagem || data?.erro || 'Error')
      }
    } finally {
      setEnviando(false)
    }
  }

  // A hora escolhida é a do fuso do negócio; o servidor interpreta-a nesse fuso
  const confirmar = (e) => {
    e.preventDefault()
    enviarPedido({ ...form, profissionalId: profSel.id, servicoId: servicoSel.id, dataHora: `${dataSel}T${horaSel}:00` })
  }

  const aceitarSugestao = (horaStr) => {
    setHora(horaStr)
    enviarPedido({ ...pendingPayload, dataHora: `${dataSel}T${horaStr}:00` })
  }

  const enviarListaEspera = async (dados, dataDesejada) => {
    setEnviando(true)
    try {
      const r = await api.post(`/public/negocio/${slug}/lista-espera`, {
        ...dados, servicoId: servicoSel?.id, profissionalId: profSel?.id, dataDesejada,
      })
      toast.success(r.data.mensagem)
      setEspera(null); setConflito(null); setPendingPayload(null)
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Error')
    } finally { setEnviando(false) }
  }

  // Polling: verifica estado da marcação a cada 5 segundos
  const iniciarPolling = (id) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/public/agendamento/${id}/status`)
        if (data.status === 'CONFIRMADO') { clearInterval(pollingRef.current); setAgendamento(data); setPasso(6) }
        else if (data.status === 'CANCELADO') { clearInterval(pollingRef.current); setAgendamento(data); setPasso(7) }
      } catch (_) { /* silencioso */ }
    }, 5000)
  }

  // Link do Google Calendar (inclui o link da consulta online, se houver)
  const linkCalendario = (ag) => {
    if (!ag?.dataHora) return '#'
    const inicio = new Date(ag.dataHora)
    const fim = new Date(inicio.getTime() + (ag.duracaoMin || 30) * 60000)
    const f = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const local = ag.negocio?.endereco || ag.negocio?.cidade || ''
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${ag.servico?.nome} — ${ag.negocio?.nome}`,
      dates: `${f(inicio)}/${f(fim)}`,
      details: [ag.profissional?.nome, ag.linkSessao && `${t('book.sessaoOnline')}: ${ag.linkSessao}`, ag.negocio?.telefone && `${t('book.contacto')}: ${ag.negocio.telefone}`].filter(Boolean).join('\n'),
      location: ag.linkSessao || local,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  // Próximos 14 dias, contados no fuso do negócio
  const diasDisponiveis = useMemo(() => {
    const hoje = hojeNoFuso(fuso)
    return Array.from({ length: 14 }, (_, i) => somarDias(hoje, i))
  }, [fuso])

  const profsFiltrados = servicoSel
    ? (servicoSel.profissionais?.map(sp => sp.profissional).filter(Boolean) || negocio?.profissionais || [])
    : []

  // Hora escolhida vista no fuso de quem está a marcar (só aparece se for diferente)
  const horaDoCliente = (dataStr, horaStr) => {
    if (!dataStr || !horaStr || !fusoCliente || fusoCliente === fuso) return null
    const inst = paraInstante(dataStr, horaStr, fuso)
    const aqui = fmtHora(inst, fusoCliente, locale)
    const dia = fmtDataCurta(inst, fusoCliente, locale)
    const dNeg = fmtDataCurta(inst, fuso, locale)
    return dia === dNeg ? aqui : `${aqui} (${dia})`
  }

  // Pix (só para negócios no Brasil que indicaram a chave)
  const codigoPix = useMemo(() => {
    if (!negocio?.chavePix || moeda !== 'BRL' || !agendamento?.preco) return null
    try {
      return brCodePix({ chave: negocio.chavePix, valor: agendamento.preco, nome: negocio.nome, cidade: negocio.cidade || 'BRASIL', txid: String(agendamento.id || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 20) })
    } catch { return null }
  }, [negocio, moeda, agendamento])

  const copiarPix = async () => {
    try { await navigator.clipboard.writeText(codigoPix); setCopiado(true); toast.success(t('book.pixCopiado')); setTimeout(() => setCopiado(false), 2500) } catch { /* sem permissão */ }
  }

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

  const passosNomes = [t('book.servico'), t('book.profissional'), t('book.dataHora'), t('book.dados')]
  const quandoLongo = (ag) => fmtDataLonga(ag.dataHora, fuso, locale)
  const quandoCurto = (ag) => `${fmtDataCurta(ag.dataHora, fuso, locale)} · ${fmtHora(ag.dataHora, fuso, locale)}`
  const linhasResumo = (ag) => [
    { label: t('book.servico'), valor: ag.servico?.nome },
    { label: t('book.profissional'), valor: ag.profissional?.nome },
    { label: t('book.data'), valor: quandoLongo(ag) },
    { label: t('book.hora'), valor: `${fmtHora(ag.dataHora, fuso, locale)} (${nomeDoFuso(fuso)})` },
    { label: t('book.duracao'), valor: t('comum.minutos', { n: ag.duracaoMin }) },
    { label: t('book.valor'), valor: fmt(ag.preco) },
  ]

  return (
    <div className="min-h-screen bg-slate-50" style={estiloDaMarca(negocio.corPrimaria)}>
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
            {negocio.logo
              ? <img src={negocio.logo} alt={negocio.nome} className="w-full h-full object-cover rounded-xl" />
              : negocio.nome?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-slate-900 text-lg leading-tight">{negocio.nome}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {negocio.endereco && <span className="flex items-center gap-1"><MapPin size={11} />{negocio.cidade}</span>}
              {negocio.telefone && <span className="flex items-center gap-1"><Phone size={11} />{negocio.telefone}</span>}
            </div>
          </div>
          <SeletorIdioma />
        </div>

        {passo < 5 && (
          <div className="max-w-lg mx-auto px-4 pb-4">
            <div className="flex items-center gap-1">
              {passosNomes.map((label, i) => (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div className={`flex items-center gap-1.5 text-xs font-medium transition-all
                    ${i + 1 === passo ? 'text-brand-600' : i + 1 < passo ? 'text-green-600' : 'text-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${i + 1 === passo ? 'bg-brand-100 text-brand-700' : i + 1 < passo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
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
            <h2 className="font-display font-bold text-xl text-slate-900 mb-4">{t('book.escolheServico')}</h2>
            <div className="space-y-2">
              {negocio.servicos?.map(s => (
                <button key={s.id} onClick={() => { setServico(s); setPasso(2) }}
                  className="w-full card p-4 flex items-center justify-between hover:border-brand-300 hover:shadow-soft transition-all text-left">
                  <div>
                    <p className="font-semibold text-slate-800">{s.nome}</p>
                    {s.descricao && <p className="text-xs text-slate-400 mt-0.5">{s.descricao}</p>}
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1"><Clock size={11} />{t('comum.minutos', { n: s.duracaoMin })}</span>
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${s.online ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                        {s.online && <Video size={10} />}{s.online ? t('book.online') : t('book.presencial')}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-display font-bold text-brand-600 text-lg">{fmt(s.preco)}</p>
                  </div>
                </button>
              ))}
              {!negocio.servicos?.length && (
                <p className="text-slate-400 text-sm text-center py-8">{t('book.semServicos')}</p>
              )}
            </div>
          </div>
        )}

        {/* PASSO 2 — Profissional */}
        {passo === 2 && (
          <div>
            <button onClick={() => setPasso(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <ChevronLeft size={16} /> {t('comum.voltar')}
            </button>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-1">{t('book.escolheProf')}</h2>
            <p className="text-sm text-slate-400 mb-4">{t('book.para', { servico: servicoSel?.nome })}</p>
            <div className="space-y-2">
              <button onClick={() => { setProf(profsFiltrados[0] || negocio.profissionais[0]); setPasso(3) }}
                className="w-full card p-4 flex items-center gap-3 hover:border-brand-300 hover:shadow-soft transition-all text-left">
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold shrink-0">★</div>
                <div>
                  <p className="font-semibold text-slate-800">{t('book.qualquer')}</p>
                  <p className="text-xs text-slate-400">{t('book.qualquerSub')}</p>
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

        {/* PASSO 3 — Data e hora */}
        {passo === 3 && (
          <div>
            <button onClick={() => setPasso(2)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <ChevronLeft size={16} /> {t('comum.voltar')}
            </button>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-1">{t('book.escolheData')}</h2>
            <p className="text-xs text-slate-400 mb-4">{t('book.fusoNeg', { fuso: nomeDoFuso(fuso) })}</p>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {diasDisponiveis.map(d => {
                const r = rotuloDia(d, locale)
                return (
                  <button key={d} onClick={() => { setData(d); setHora('') }}
                    className={`shrink-0 px-3 py-2 rounded-xl text-center transition-all border
                      ${dataSel === d ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                    <p className="text-[10px] capitalize">{r.semana}</p>
                    <p className="font-bold text-sm">{r.dia}</p>
                    <p className="text-[10px] capitalize">{r.mes}</p>
                  </button>
                )
              })}
            </div>

            {dataSel && (
              <>
                <h3 className="font-semibold text-slate-700 text-sm mb-3">{t('book.horarios')}</h3>
                {slotsLoad ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {slots.filter(s => s.disponivel).map(s => (
                      <button key={s.hora} onClick={() => setHora(s.hora)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                          ${horaSel === s.hora ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-400'}`}>
                        {s.hora}
                      </button>
                    ))}
                    {slots.filter(s => s.disponivel).length === 0 && (
                      <div className="col-span-4 text-center text-slate-400 text-sm py-6">
                        <p>{t('book.semHorarios')}</p>
                        {negocio.listaEspera && (
                          <button type="button" onClick={() => setEspera({ nome: '', telefone: '' })}
                            className="mt-3 text-brand-700 font-semibold underline">
                            {t('book.avisemMe')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {horaSel && horaDoCliente(dataSel, horaSel) && (
                  <p className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 mb-4">
                    {t('book.naTuaHora', { hora: horaDoCliente(dataSel, horaSel) })}
                  </p>
                )}
              </>
            )}

            {horaSel && (
              <button onClick={() => setPasso(4)} className="btn-primary w-full py-3">
                {t('book.continuarCom', { hora: horaSel })}
              </button>
            )}
          </div>
        )}

        {/* PASSO 4 — Dados */}
        {passo === 4 && (
          <div>
            <button onClick={() => setPasso(3)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
              <ChevronLeft size={16} /> {t('comum.voltar')}
            </button>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-2">{t('book.osTeusDados')}</h2>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-brand-700 font-medium">{servicoSel?.nome}</span>
                <span className="font-bold text-brand-800">{fmt(servicoSel?.preco)}</span>
              </div>
              <p className="text-xs text-brand-500">
                {profSel?.nome} · {dataSel && fmtDataCurta(paraInstante(dataSel, horaSel, fuso), fuso, locale)} · {horaSel} ({nomeDoFuso(fuso)})
              </p>
              {horaDoCliente(dataSel, horaSel) && <p className="text-xs text-teal-700 mt-1">{t('book.naTuaHora', { hora: horaDoCliente(dataSel, horaSel) })}</p>}
              {servicoSel?.online && <p className="text-xs text-teal-700 mt-1 flex items-center gap-1"><Video size={11} /> {t('book.sessaoAviso')}</p>}
            </div>

            <form onSubmit={confirmar} className="space-y-4">
              <div>
                <label className="label">{t('book.nomeCompleto')}</label>
                <input className="input" placeholder={t('book.oTeuNome')} value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <label className="label">{t('book.telemovel')}</label>
                <input className="input" type="tel" placeholder={t('reg.telefoneEx')} value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })} required />
                <p className="text-xs text-slate-400 mt-1">{t('book.telemovelAjuda')}</p>
              </div>
              <div>
                <label className="label">{t('book.emailOpc')}</label>
                <input className="input" type="email" placeholder="you@email.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">{t('book.emailAjuda')}</p>
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-base" disabled={enviando}>
                {enviando ? t('book.enviando') : t('book.enviar')}
              </button>
              <p className="text-xs text-slate-400 text-center">{t('book.confirmarBreve')}</p>
            </form>
          </div>
        )}

        {/* PASSO 5 — A aguardar confirmação */}
        {passo === 5 && agendamento && (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <Hourglass size={40} className="text-amber-500 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">{t('book.pedidoEnviado')}</h2>
            <p className="text-slate-500 mb-1">{t('book.obrigado', { nome: agendamento.cliente?.nome?.split(' ')[0] })}</p>
            <p className="text-xs text-slate-400 mb-5">{t('book.atualizaAuto')}</p>

            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2.5 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {t('book.aguardando')}
            </div>

            <div className="card p-5 text-left mb-6">
              {linhasResumo(agendamento).map(({ label, valor }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-slate-800 capitalize">{valor}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 mb-5 text-left">
              <p className="font-semibold mb-1">{t('book.oQueAcontece')}</p>
              <ul className="space-y-1 text-xs text-blue-600">
                <li>• {t('book.acontece1')}</li>
                <li>• {t('book.acontece2')}</li>
                <li>• {t('book.acontece3')}</li>
              </ul>
            </div>
          </div>
        )}

        {/* PASSO 6 — CONFIRMADO */}
        {passo === 6 && agendamento && (
          <div className="py-6">
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-center mb-6 overflow-hidden">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl">
                  <Check size={48} className="text-green-500" strokeWidth={3} />
                </div>
                <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <PartyPopper size={13} /> {t('book.confirmado')}
                </div>
                <h2 className="font-display text-3xl font-bold text-white mb-2">{t('book.marcacaoConfirmada')}</h2>
                <p className="text-green-100 text-sm">{t('book.lugarGarantido')}</p>
              </div>
            </div>

            {/* Consulta online: botão grande para entrar */}
            {agendamento.linkSessao && (
              <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-5 mb-5 text-center">
                <p className="font-display font-bold text-teal-800 mb-1 flex items-center justify-center gap-2"><Video size={18} /> {t('book.sessaoOnline')}</p>
                <p className="text-xs text-teal-700 mb-3">{t('book.sessaoAviso')}</p>
                <a href={agendamento.linkSessao} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                  <Video size={16} /> {t('book.entrarSessao')} <ExternalLink size={13} className="opacity-70" />
                </a>
              </div>
            )}

            <div className="bg-white rounded-2xl border-2 border-green-200 shadow-md overflow-hidden mb-5">
              <div className="bg-green-50 px-5 py-3 flex items-center gap-2 border-b border-green-100">
                <CalendarCheck size={16} className="text-green-600" />
                <span className="text-sm font-bold text-green-800">{t('book.detalhes')}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {[...linhasResumo(agendamento), ...(agendamento.negocio?.telefone ? [{ label: t('book.contacto'), valor: agendamento.negocio.telefone }] : [])].map(({ label, valor }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-bold text-slate-900 text-right max-w-[60%] capitalize">{valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pix (Brasil) */}
            {codigoPix && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 text-center">
                <p className="font-display font-bold text-slate-800 mb-1">{t('book.pixTitulo')} · {fmt(agendamento.preco)}</p>
                <p className="text-xs text-slate-500 mb-3">{t('book.pixTexto')}</p>
                <div className="inline-block p-3 bg-white border border-slate-100 rounded-xl mb-3"><QRCodeSVG value={codigoPix} size={160} level="M" /></div>
                <button onClick={copiarPix} className="btn-ghost w-full flex items-center justify-center gap-2">
                  {copiado ? <Check size={15} /> : <Copy size={15} />} {t('book.pixCopiar')}
                </button>
                <p className="text-[11px] text-slate-400 mt-2">{t('book.pixAviso')}</p>
              </div>
            )}

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-5">
              <p className="text-center font-display font-bold text-amber-800 text-base mb-1">{t('book.naoEsquecas')}</p>
              <p className="text-center text-amber-700 text-sm">
                {t('book.eEm', { quando: quandoCurto(agendamento) })} {t('book.screenshot')}
              </p>
            </div>

            <div className="space-y-3">
              <a href={linkCalendario(agendamento)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-md">
                <CalendarCheck size={18} />
                {t('book.addCalendario')}
                <ExternalLink size={13} className="opacity-70" />
              </a>
              <button onClick={reiniciar} className="w-full py-3 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                {t('book.outraMarcacao')}
              </button>
            </div>
          </div>
        )}

        {/* PASSO 7 — RECUSADO */}
        {passo === 7 && (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={44} className="text-red-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">{t('book.recusado')}</h2>
            <p className="text-slate-500 mb-6">{t('book.recusadoTexto')}</p>
            {agendamento?.negocio?.telefone && (
              <a href={`tel:${agendamento.negocio.telefone}`}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 rounded-xl transition-all mb-5">
                <Phone size={16} /> {agendamento.negocio.telefone}
              </a>
            )}
            <div>
              <button onClick={reiniciar} className="btn-primary px-8 py-3">{t('book.tentarOutro')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de espera (dia cheio) */}
      {espera && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={(e) => { e.preventDefault(); enviarListaEspera(espera, dataSel ? `${dataSel}T00:00:00` : undefined) }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-900">{t('book.listaEspera')}</h3>
            <p className="text-sm text-slate-500">{t('book.listaEsperaTexto')}</p>
            <div><label className="label">{t('book.nomeCompleto')}</label>
              <input className="input" required value={espera.nome} onChange={e => setEspera({ ...espera, nome: e.target.value })} /></div>
            <div><label className="label">{t('book.telemovel')}</label>
              <input className="input" type="tel" required placeholder={t('reg.telefoneEx')} value={espera.telefone} onChange={e => setEspera({ ...espera, telefone: e.target.value })} /></div>
            <div className="flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setEspera(null)}>{t('comum.cancelar')}</button>
              <button type="submit" className="btn-primary flex-1" disabled={enviando}>{t('book.entrarLista')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Conflito: horários livres mais próximos */}
      {conflito && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-amber-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 text-center mb-2">{t('book.ocupado')}</h3>
            <p className="text-sm text-slate-500 text-center mb-5">{conflito.mensagem}</p>

            {conflito.sugestoes.length > 0 && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 text-center">{t('book.maisProximos')}</p>
                <div className="flex gap-3 justify-center mb-5">
                  {conflito.sugestoes.map(hora => (
                    <button key={hora} onClick={() => aceitarSugestao(hora)} disabled={enviando}
                      className="flex-1 py-3 rounded-xl bg-brand-50 border-2 border-brand-200 hover:bg-brand-600 hover:text-white hover:border-brand-600 text-brand-700 font-display font-bold text-lg transition-all disabled:opacity-50">
                      {hora}
                    </button>
                  ))}
                </div>
              </>
            )}

            {conflito.listaEspera && pendingPayload && (
              <button onClick={() => enviarListaEspera({ nome: pendingPayload.nome, telefone: pendingPayload.telefone }, pendingPayload.dataHora)} disabled={enviando}
                className="w-full py-2.5 mb-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {t('book.avisemMe')}
              </button>
            )}
            <button onClick={() => { setConflito(null); setPendingPayload(null) }}
              className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
              {t('book.outraData')}
            </button>
          </div>
        </div>
      )}

      {!negocio.semMarca && (
        <div className="text-center py-6">
          <a href="/" className="text-xs text-slate-300 hover:text-slate-500 transition-colors flex items-center justify-center gap-1">
            <CalendarCheck size={12} />
            {t('book.feitoCom')}
          </a>
          <AssinaturaAda tamanho="sm" className="mt-4" />
        </div>
      )}
    </div>
  )
}
