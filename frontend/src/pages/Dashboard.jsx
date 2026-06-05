import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { Calendar, Users, TrendingUp, Clock, Plus, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const statusBadge = { PENDENTE: 'badge-yellow', CONFIRMADO: 'badge-green', CONCLUIDO: 'badge-gray', CANCELADO: 'badge-red', FALTA: 'badge-red' }
const statusLabel = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', FALTA: 'Falta' }

function fmtKz(v) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(v || 0)
}

export default function Dashboard() {
  const { negocio } = useAuthStore()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get('/relatorios/dashboard').then(r => { setDados(r.data); setCarregando(false) }).catch(() => setCarregando(false))
  }, [])

  const hoje = format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })

  if (carregando) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Bom dia! 👋</h1>
          <p className="text-slate-500 text-sm capitalize">{hoje}</p>
        </div>
        <Link to="/agenda" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo agendamento
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Agendamentos hoje', valor: dados?.totalHoje || 0, icon: Calendar, cor: 'text-brand-600 bg-brand-50' },
          { label: 'Confirmados', valor: dados?.confirmadosHoje || 0, icon: Clock, cor: 'text-green-600 bg-green-50' },
          { label: 'Receita hoje', valor: fmtKz(dados?.receitaHoje), icon: TrendingUp, cor: 'text-purple-600 bg-purple-50', grande: true },
          { label: 'Clientes novos', valor: dados?.novosClientes || 0, icon: Users, cor: 'text-blue-600 bg-blue-50' },
        ].map(({ label, valor, icon: Icon, cor, grande }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cor}`}>
              <Icon size={18} />
            </div>
            <p className={`font-display font-bold text-slate-900 ${grande ? 'text-xl' : 'text-2xl'}`}>{valor}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Agendamentos do dia */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Agendamentos de hoje</h2>
          <Link to="/agenda" className="text-sm text-brand-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Ver agenda <ChevronRight size={14} />
          </Link>
        </div>

        {!dados?.agendamentosHoje?.length ? (
          <div className="px-6 py-12 text-center">
            <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Sem agendamentos para hoje</p>
            <Link to="/agenda" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus size={14} /> Criar agendamento
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {dados.agendamentosHoje.map(ag => (
              <div key={ag.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="text-center min-w-[52px]">
                  <p className="font-display font-bold text-slate-800 text-sm">
                    {format(new Date(ag.dataHora), 'HH:mm')}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {ag.cliente?.nome?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{ag.cliente?.nome}</p>
                  <p className="text-xs text-slate-400">{ag.servico?.nome} · {ag.profissional?.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{fmtKz(ag.preco)}</p>
                  <span className={statusBadge[ag.status]}>{statusLabel[ag.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receita do mês */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Receita do mês</p>
          <p className="font-display text-3xl font-bold text-slate-900">{fmtKz(dados?.receitaMes)}</p>
          <p className="text-xs text-slate-400 mt-1">{dados?.agendamentosMes} agendamentos concluídos</p>
        </div>
        <div className="card p-5 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Link de agendamento</p>
          <p className="text-sm text-slate-600 font-mono bg-slate-50 rounded-lg px-3 py-2 truncate">
            {window.location.origin}/b/{negocio?.slug}
          </p>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/b/${negocio?.slug}`); }}
            className="btn-ghost text-xs mt-2 self-start">
            Copiar link
          </button>
        </div>
      </div>
    </div>
  )
}
