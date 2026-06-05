import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  CreditCard, Smartphone, Building2, Check, Clock,
  X, RefreshCw, AlertTriangle, Shield, ChevronDown, ChevronUp
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'

function fmtKz(v) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(v || 0)
}

const PLANOS = [
  {
    key: 'BASICO',
    label: 'Basico',
    preco: 15000,
    profissionais: '1 profissional',
    features: ['50 agendamentos/mes', 'Lembretes SMS', 'Agenda online', 'Painel basico'],
    cor: 'border-slate-200 hover:border-slate-300',
    destaque: false,
  },
  {
    key: 'PROFISSIONAL',
    label: 'Profissional',
    preco: 35000,
    profissionais: 'Ate 5 profissionais',
    features: ['Agendamentos ilimitados', 'WhatsApp + SMS', 'Relatorios financeiros', 'CRM de clientes', 'Multicaixa Express'],
    cor: 'border-brand-500 shadow-lg',
    destaque: true,
  },
  {
    key: 'PREMIUM',
    label: 'Premium',
    preco: 75000,
    profissionais: 'Ilimitado',
    features: ['Tudo do Profissional', 'Profissionais ilimitados', 'Programa de fidelidade', 'Suporte prioritario'],
    cor: 'border-slate-200 hover:border-slate-300',
    destaque: false,
  },
]

const STATUS_BADGE = {
  APROVADO: 'badge-green',
  PENDENTE: 'badge-yellow',
  RECUSADO: 'badge-red',
  EXPIRADO: 'badge-gray'
}
const STATUS_LABEL = { APROVADO: 'Confirmado', PENDENTE: 'Aguarda confirmacao', RECUSADO: 'Recusado', EXPIRADO: 'Expirado' }

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

  const carregarHistorico = async () => {
    try {
      const r = await api.get('/pagamentos/historico')
      setHistorico(r.data)
    } catch {}
  }

  useEffect(() => { carregarHistorico() }, [])

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!pagamentoAtivo || !polling) return
    const interval = setInterval(async () => {
      try {
        const r = await api.get(`/pagamentos/status/${pagamentoAtivo}`)
        if (r.data.status === 'APROVADO') {
          toast.success('Pagamento confirmado! Plano activado 🎉')
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
      toast.error(err.response?.data?.erro || 'Erro ao gerar pedido')
    } finally { setCarregando(false) }
  }

  const iniciarIban = async () => {
    setCarregando(true)
    try {
      const r = await api.post('/pagamentos/iniciar-iban', { plano: planoSelecionado, banco: bancoPref })
      setInfoIban(r.data)
      setModal('iban-info')
      carregarHistorico()
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao gerar instrucao')
    } finally { setCarregando(false) }
  }

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
      <h1 className="font-display text-2xl font-bold mb-6">Faturacao e Assinatura</h1>

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
                {planoStatus === 'ATIVO' ? 'Activo' : planoStatus === 'SUSPENSO' ? 'Suspenso' : 'Expirado'}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {fmtKz(planoActualInfo?.preco || 15000)}/mes
              {planoExpira && (
                <span className="ml-2 text-slate-400">
                  · {diasRestantes === 0
                    ? 'Expira hoje!'
                    : `Expira em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} (${format(new Date(planoExpira), "d 'de' MMMM", { locale: pt })})`}
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
              O teu plano expira em {diasRestantes === 0 ? 'hoje' : `${diasRestantes} dias`}. Renova agora para evitar interrupcoes.
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
            {mostrarPlanos ? 'Escolher plano para renovar' : 'Renovar / Mudar de plano'}
          </h2>
          {mostrarPlanos
            ? <ChevronUp size={18} className="text-slate-400" />
            : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarPlanos && (
          <div className="mt-5">
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
                    <p className="font-semibold text-slate-800">{p.label}</p>
                    {planoSelecionado === p.key && (
                      <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="font-display font-bold text-slate-900 text-xl">
                    {fmtKz(p.preco)}<span className="text-xs font-normal text-slate-400">/mes</span>
                  </p>
                  <p className="text-xs text-slate-400 mb-3">{p.profissionais}</p>
                  <ul className="space-y-1">
                    {p.features.slice(0, 3).map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Check size={10} className="text-green-500 shrink-0" />{f}
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
                  Plano seleccionado: <span className="text-brand-700">{PLANOS.find(p => p.key === planoSelecionado)?.label}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Validade: 30 dias apos confirmacao do pagamento</p>
              </div>
              <p className="font-display font-bold text-2xl text-slate-900">
                {fmtKz(PLANOS.find(p => p.key === planoSelecionado)?.preco || 15000)}
              </p>
            </div>

            {/* Metodos de pagamento */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Escolhe o metodo de pagamento
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
                  <p className="text-xs text-slate-400">Paga no telemóvel · Imediato</p>
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
                  <p className="text-sm font-semibold text-slate-800">Transferencia IBAN</p>
                  <p className="text-xs text-slate-400">Qualquer banco angolano</p>
                </div>
              </button>
            </div>

            {/* Nota de confirmacao manual */}
            <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Clock size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>Confirmacao em ate 24h.</strong> Apos o pagamento, envia o comprovativo para{' '}
                <strong>agendaaosuporte@gmail.com</strong> com o assunto{' '}
                <strong>"Pagamento AgendaAO - [teu nome de negocio]"</strong> para agilizar a activacao.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Historico de pagamentos */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Historico de pagamentos</h2>
        </div>
        {historico.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <CreditCard size={28} className="mx-auto mb-3 text-slate-200" />
            Sem pagamentos registados
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
                    {format(new Date(p.criadoEm), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium">
                    {p.assinatura?.plano || 'BASICO'}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-500">
                    {p.referencia || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {p.metodo === 'EXPRESS' ? <Smartphone size={13} /> : <Building2 size={13} />}
                      <span className="text-xs">{p.metodo === 'EXPRESS' ? 'Express' : 'IBAN'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-800">{fmtKz(p.valor)}</td>
                  <td className="px-4 py-4">
                    <span className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</span>
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
              <h2 className="font-display font-bold text-lg">Pagar com Multicaixa Express</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="bg-brand-50 rounded-2xl p-4 mb-5">
              <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">
                Plano {PLANOS.find(p => p.key === planoSelecionado)?.label}
              </p>
              <p className="font-display text-3xl font-bold text-brand-800">
                {fmtKz(PLANOS.find(p => p.key === planoSelecionado)?.preco)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Dados para pagamento</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Numero Express</span>
                <span className="font-mono font-bold text-slate-800 text-sm">925 856 294</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Nome</span>
                <span className="text-slate-700 text-sm font-medium">AgendaAO</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Valor</span>
                <span className="font-bold text-slate-800">
                  {fmtKz(PLANOS.find(p => p.key === planoSelecionado)?.preco)}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700">
                Apos o pagamento, o sistema cria automaticamente uma referencia unica.
                Envia o comprovativo para <strong>agendaaosuporte@gmail.com</strong> para activacao mais rapida.
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
              <h2 className="font-display font-bold text-lg">Instrucoes de pagamento</h2>
              <button onClick={() => { setModal(null); setPolling(false) }}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-2.5 mb-5">
              {[
                { label: 'Numero Express', valor: '925 856 294', mono: true },
                { label: 'Nome do recebedor', valor: 'AgendaAO', mono: false },
                { label: 'Valor a pagar', valor: fmtKz(infoExpress.valor), mono: false },
                { label: 'Referencia (obrigatoria)', valor: infoExpress.referencia, mono: true },
              ].map(({ label, valor, mono }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className={`text-sm font-bold text-slate-800 ${mono ? 'font-mono' : ''}`}>{valor}</span>
                </div>
              ))}
            </div>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-brand-700">
                <strong>Passo a passo:</strong><br />
                1. Abre o Multicaixa Express no teu telefone<br />
                2. Envia {fmtKz(infoExpress.valor)} para o numero <strong>925 856 294</strong><br />
                3. No campo "descricao" coloca: <strong>{infoExpress.referencia}</strong><br />
                4. Guarda o comprovativo e envia para agendaaosuporte@gmail.com
              </p>
            </div>

            <button onClick={() => {
              navigator.clipboard.writeText(`Numero: 925 856 294 | Valor: ${fmtKz(infoExpress.valor)} | Ref: ${infoExpress.referencia}`)
              toast.success('Dados copiados!')
            }} className="btn-ghost w-full text-sm mb-2">
              Copiar dados
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <RefreshCw size={12} className="animate-spin" />
              A verificar pagamento automaticamente...
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Escolher banco IBAN ── */}
      {modal === 'iban-escolha' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">Transferencia IBAN</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-5">
              <p className="text-xs text-slate-500 mb-0.5">Valor a transferir</p>
              <p className="font-display font-bold text-2xl text-slate-900">
                {fmtKz(PLANOS.find(p => p.key === planoSelecionado)?.preco)}
              </p>
              <p className="text-xs text-slate-400">Plano {PLANOS.find(p => p.key === planoSelecionado)?.label}</p>
            </div>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Escolhe o teu banco</p>
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
              <h2 className="font-display font-bold text-lg">Dados para transferencia</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
            </div>

            {/* Mostrar o IBAN preferido primeiro */}
            <div className="space-y-2.5 mb-5">
              {[
                { label: 'Titular', valor: infoIban.titular, mono: false },
                { label: bancoPref === 'ATLANTICO' ? 'IBAN Atlantico' : 'IBAN BAI',
                  valor: bancoPref === 'ATLANTICO' ? 'AO06.0055.0000.5012.2997.1018.1' : 'AO06.0040.0000.4755.2292.10181.9',
                  mono: true },
                { label: 'Valor', valor: fmtKz(infoIban.valor), mono: false },
                { label: 'Referencia (obrigatoria)', valor: infoIban.referencia, mono: true },
              ].map(({ label, valor, mono }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className={`text-sm font-bold text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{valor}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700">
                <strong>Importante:</strong> inclui sempre a referencia <strong>{infoIban.referencia}</strong> na descricao da transferencia.
                Apos transferir, envia o comprovativo para <strong>agendaaosuporte@gmail.com</strong>.
              </p>
            </div>

            <button onClick={() => {
              const iban = bancoPref === 'ATLANTICO' ? 'AO06.0055.0000.5012.2997.1018.1' : 'AO06.0040.0000.4755.2292.10181.9'
              navigator.clipboard.writeText(
                `Titular: ${infoIban.titular}\nIBAN: ${iban}\nValor: ${fmtKz(infoIban.valor)}\nReferencia: ${infoIban.referencia}`
              )
              toast.success('Dados copiados!')
            }} className="btn-ghost w-full mb-2 text-sm">
              Copiar dados
            </button>
            <button onClick={() => setModal(null)} className="btn-primary w-full text-sm">
              Ja fiz a transferencia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
