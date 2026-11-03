import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import PlanoGuard from './PlanoGuard'
import {
  LayoutDashboard, Calendar, Users, Scissors,
  BarChart2, Settings, CreditCard, LogOut, CalendarCheck, ShieldCheck, User, Star, Hourglass, LifeBuoy
} from 'lucide-react'

// Email de suporte definido no Vercel (VITE_SUPORTE_EMAIL); sem ele o botao nao aparece
const EMAIL_SUPORTE = import.meta.env.VITE_SUPORTE_EMAIL || ''

const nav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agenda',     icon: Calendar,        label: 'Agenda' },
  { to: '/clientes',   icon: Users,           label: 'Clientes' },
  { to: '/servicos',   icon: Scissors,        label: 'Serviços' },
  { to: '/profissionais', icon: User,         label: 'Profissionais' },
  { to: '/relatorios', icon: BarChart2,       label: 'Relatórios' },
  { to: '/lista-espera', icon: Hourglass,     label: 'Lista de espera' },
  { to: '/config',     icon: Settings,        label: 'Configurações' },
  { to: '/faturacao',  icon: CreditCard,      label: 'Faturação' },
  { to: '/avaliar',    icon: Star,            label: 'Depoimento' },
]

const PLANO_BADGE = {
  PREMIUM:       'bg-amber-50 text-amber-700 border border-amber-200',
  PROFISSIONAL:  'bg-blue-50 text-blue-700 border border-blue-200',
  BASICO:        'bg-slate-100 text-slate-500 border border-slate-200',
}

export default function Layout() {
  const { negocio, usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  // Calcular dias restantes do trial
  const agora = new Date()
  const diasRestantes = negocio?.planoExpira
    ? Math.ceil((new Date(negocio.planoExpira) - agora) / (1000 * 60 * 60 * 24))
    : 0;
  const isTrial = negocio?.plano === 'BASICO' && diasRestantes > 0;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 text-lg leading-none">AgendaAO</span>
          </div>
        </div>

        {/* Info do negocio */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-800 truncate">{negocio?.nome}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block
            ${isTrial
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : PLANO_BADGE[negocio?.plano] || PLANO_BADGE.BASICO}`}>
            {isTrial ? `TESTE - ${diasRestantes}d` : (negocio?.plano || 'BASICO')}
          </span>
        </div>

        {/* Navegacao */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`
            }>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Rodape sidebar */}
        <div className="p-3 border-t border-slate-100">
          {EMAIL_SUPORTE && (
            <a href={`mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(`${negocio?.plano === 'PREMIUM' ? '[PRIORITÁRIO] ' : ''}Suporte AgendaAO — ${negocio?.nome || ''}`)}`}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all">
              <LifeBuoy size={15} />
              {negocio?.plano === 'PREMIUM' ? 'Suporte prioritário' : 'Suporte'}
            </a>
          )}
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
              {usuario?.nome?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{usuario?.nome}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{usuario?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-500
                       hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteudo */}
      <main className="flex-1 overflow-y-auto">
        <PlanoGuard>
          <Outlet />
        </PlanoGuard>
      </main>
    </div>
  )
}
