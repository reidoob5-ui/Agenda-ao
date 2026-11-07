import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import PlanoGuard from './PlanoGuard'
import AssinaturaAda from '../AssinaturaAda'
import SeletorIdioma from '../SeletorIdioma'
import { useT } from '../../i18n'
import { EMAIL_SUPORTE } from '../../utils/marca'
import Illustracao3D from '../Illustracao3D'
import {
  LayoutDashboard, Calendar, Users, Scissors,
  BarChart2, Settings, CreditCard, LogOut, CalendarCheck, ShieldCheck, User, Star, Hourglass, LifeBuoy
} from 'lucide-react'

const nav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/agenda',     icon: Calendar,        label: 'nav.agenda' },
  { to: '/clientes',   icon: Users,           label: 'nav.clientes' },
  { to: '/servicos',   icon: Scissors,        label: 'nav.servicos' },
  { to: '/profissionais', icon: User,         label: 'nav.profissionais' },
  { to: '/relatorios', icon: BarChart2,       label: 'nav.relatorios' },
  { to: '/lista-espera', icon: Hourglass,     label: 'nav.listaEspera' },
  { to: '/config',     icon: Settings,        label: 'nav.config' },
  { to: '/faturacao',  icon: CreditCard,      label: 'nav.faturacao' },
  { to: '/avaliar',    icon: Star,            label: 'nav.depoimento' },
]

const PLANO_BADGE = {
  PREMIUM:       'bg-[#fff0ef] text-[#a65361] border border-[#f0d1d2]',
  PROFISSIONAL:  'bg-[#fff5f1] text-[#9c6c66] border border-[#efdcd5]',
  BASICO:        'bg-[#f7f0ee] text-[#88777b] border border-[#eadfdd]',
}

export default function Layout() {
  const { t } = useT()
  const { negocio, usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const paginaAtual = nav.find(item => location.pathname.startsWith(item.to)) || nav[0]
  const iconeAtual = ({
    '/dashboard': 'analytics', '/agenda': 'calendar', '/clientes': 'people',
    '/servicos': 'smart', '/profissionais': 'people', '/relatorios': 'analytics',
    '/lista-espera': 'reminder', '/config': 'security', '/faturacao': 'payment', '/avaliar': 'globe'
  })[paginaAtual.to] || 'calendar'

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
            <span className="font-display font-bold text-slate-900 text-lg leading-none">Agenda Aqui</span>
          </div>
        </div>

        {/* Info do negocio */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-800 truncate">{negocio?.nome}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block
            ${isTrial
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : PLANO_BADGE[negocio?.plano] || PLANO_BADGE.BASICO}`}>
            {isTrial ? t('nav.teste', { n: diasRestantes }) : t(`plano.${negocio?.plano || 'BASICO'}`)}
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
              {t(label)}
            </NavLink>
          ))}
        </nav>

        {/* Rodape sidebar */}
        <div className="p-3 border-t border-slate-100">
          {EMAIL_SUPORTE && (
            <a href={`mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(`${negocio?.plano === 'PREMIUM' ? '[PRIORITÁRIO] ' : ''}Suporte Agenda Aqui — ${negocio?.nome || ''}`)}`}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all">
              <LifeBuoy size={15} />
              {negocio?.plano === 'PREMIUM' ? t('nav.suportePrio') : t('nav.suporte')}
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
            {t('nav.sair')}
          </button>
          <SeletorIdioma className="mt-2 px-3" />
          <AssinaturaAda tamanho="sm" className="mt-3 pt-3 border-t border-slate-100" />
        </div>
      </aside>

      {/* Conteudo */}
      <main className="flex-1 overflow-y-auto">
        <div className="aa-app-topbar">
          <div className="aa-app-topbar__brand">
            <Illustracao3D type={iconeAtual} size="mini" />
            <div className="min-w-0">
              <p className="aa-app-topbar__eyebrow">Agenda Aqui · {t('lp.painel')}</p>
              <p className="aa-app-topbar__title truncate">{t(paginaAtual.label)}</p>
            </div>
          </div>
          {negocio?.nome && <span className="aa-app-topbar__status truncate" title={negocio.nome}>{negocio.nome}</span>}
        </div>
        <div className="aa-page-content">
          <PlanoGuard>
            <Outlet />
          </PlanoGuard>
        </div>
      </main>
    </div>
  )
}
