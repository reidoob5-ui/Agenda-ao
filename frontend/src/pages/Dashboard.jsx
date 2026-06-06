import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Calendar, Users, TrendingUp, Clock, Plus, ChevronRight, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const statusBadge = { PENDENTE: 'badge-yellow', CONFIRMADO: 'badge-green', CONCLUIDO: 'badge-gray', CANCELADO: 'badge-red', FALTA: 'badge-red' }
const statusLabel = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', FALTA: 'Falta' }

function fmtKz(v) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(v || 0)
}

// Converter string VAPID para Uint8Array para o Web Push
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Converter Buffer para Base64 de forma compativel
const arrayBufferToBase64 = (buffer) => {
  const binary = String.fromCharCode(...new Uint8Array(buffer))
  return window.btoa(binary)
}

// Sintetizar sinal sonoro (chime) nativo usando Web Audio API
const tocarSomNotificacao = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    // Primeiro tom (Do5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = 'sine'
    osc1.frequency.value = 523.25 // C5
    gain1.gain.setValueAtTime(0, ctx.currentTime)
    gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)

    // Segundo tom (Mi5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.value = 659.25 // E5
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08)
    gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.13)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc2.start(ctx.currentTime + 0.08)
    osc2.stop(ctx.currentTime + 0.45)
  } catch (e) {
    console.error('[Dashboard] Erro ao tocar som nativo:', e)
  }
}

export default function Dashboard() {
  const { negocio } = useAuthStore()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // 1. Registo e Subscricao de Web Push (Notificacoes de fundo gratis)
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('ℹ️ [Web Push] O navegador nao suporta notificacoes push.');
      return
    }

    const inicializarPush = async () => {
      try {
        // Pedir chave publica
        const r = await api.get('/negocios/push-key')
        const publicKey = r.data.publicKey
        if (!publicKey) return

        // Obter status de permissao
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.ready
        let sub = await reg.pushManager.getSubscription()

        // Se nao existe subscricao activa, criar uma
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          })
        }

        // Serializar chaves
        const keys = {
          p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
          auth: arrayBufferToBase64(sub.getKey('auth'))
        }

        // Submeter ao backend
        await api.post('/negocios/push-subscribe', {
          endpoint: sub.endpoint,
          keys
        })
        console.log('🔔 [Web Push] Navegador registado com sucesso para alertas!')
      } catch (err) {
        console.error('❌ [Web Push] Erro na subscricao:', err.message)
      }
    }

    // Registar apenas apos login bem-sucedido e dados carregados
    if (negocio) {
      inicializarPush()
    }
  }, [negocio])

  // 2. Carregar dados + Polling com Alerta Sonoro e Popups
  useEffect(() => {
    // Primeira carga
    api.get('/relatorios/dashboard')
      .then(r => {
        setDados(r.data)
        setCarregando(false)
      })
      .catch(() => setCarregando(false))

    // Polling a cada 25 segundos para monitorizar novos agendamentos
    const interval = setInterval(async () => {
      try {
        const r = await api.get('/relatorios/dashboard')
        
        setDados(prev => {
          if (prev && r.data.agendamentosHoje.length > prev.agendamentosHoje.length) {
            // Detetar novos agendamentos comparando IDs
            const novos = r.data.agendamentosHoje.filter(
              novo => !prev.agendamentosHoje.some(velho => velho.id === novo.id)
            )
            
            if (novos.length > 0) {
              const novo = novos[0]
              tocarSomNotificacao()
              toast.success(
                <div>
                  <p className="font-semibold">Novo agendamento recebido! 📅</p>
                  <p className="text-xs text-slate-500">{novo.cliente?.nome} marcou {novo.servico?.nome}</p>
                </div>, 
                { duration: 7000 }
              )
            }
          }
          return r.data
        })
      } catch (err) {
        console.error('[Dashboard] Erro no polling de atualizacoes:', err.message)
      }
    }, 25000)

    return () => clearInterval(interval)
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
        <div className="flex items-center gap-3">
          {/* Botao de ativar notificacoes de teste no browser */}
          {Notification.permission === 'default' && (
            <button onClick={() => Notification.requestPermission()}
              className="btn-ghost flex items-center gap-2 text-xs border border-slate-200 bg-white">
              <Bell size={14} className="text-brand-600 animate-bounce" />
              Ativar Alertas
            </button>
          )}
          <Link to="/agenda" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo agendamento
          </Link>
        </div>
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
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/b/${negocio?.slug}`); toast.success('Link copiado com sucesso! 📋') }}
            className="btn-ghost text-xs mt-2 self-start">
            Copiar link
          </button>
        </div>
      </div>
    </div>
  )
}
