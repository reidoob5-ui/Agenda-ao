import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { AlertTriangle, CreditCard, ShieldOff } from 'lucide-react'
import { useT } from '../../i18n'

/**
 * PlanoGuard — exibe banner de aviso se plano expirado/suspenso
 * Nao bloqueia o render, apenas alerta. O backend bloqueia as rotas criticas.
 */
export default function PlanoGuard({ children }) {
  const { negocio } = useAuthStore()
  const { t } = useT()

  if (!negocio) return children

  const agora = new Date()
  const expirou = negocio.planoExpira && new Date(negocio.planoExpira) < agora
  const status = expirou ? 'EXPIRADO' : negocio.planoStatus

  if (status === 'INATIVO') {
    return (
      <>
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              {t('ag.pg.inativa')}
            </p>
          </div>
          <Link to="/faturacao"
            className="shrink-0 flex items-center gap-1.5 bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-all">
            <CreditCard size={12} />
            {t('ag.pg.ativar')}
          </Link>
        </div>
        {children}
      </>
    )
  }

  if (status === 'EXPIRADO') {
    return (
      <>
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {t('ag.pg.expirou')}
            </p>
          </div>
          <Link to="/faturacao"
            className="shrink-0 flex items-center gap-1.5 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all">
            <CreditCard size={12} />
            {t('ag.pg.renovar')}
          </Link>
        </div>
        {children}
      </>
    )
  }

  if (status === 'SUSPENSO') {
    return (
      <>
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldOff size={16} className="text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 font-medium">
              {t('ag.pg.suspensa')}
            </p>
          </div>
          <Link to="/faturacao"
            className="shrink-0 flex items-center gap-1.5 bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-all">
            <CreditCard size={12} />
            {t('ag.pg.verFat')}
          </Link>
        </div>
        {children}
      </>
    )
  }

  // Plano activo — verificar se expira em breve (menos de 5 dias)
  if (negocio.planoExpira) {
    const diasRestantes = Math.ceil((new Date(negocio.planoExpira) - agora) / (1000 * 60 * 60 * 24))
    if (diasRestantes <= 5 && diasRestantes > 0) {
      return (
        <>
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                {t('ag.pg.expira1')} <strong>{diasRestantes} {t(diasRestantes !== 1 ? 'ag.pg.dias' : 'ag.pg.dia')}</strong>{t('ag.pg.expira2')}
              </p>
            </div>
            <Link to="/faturacao"
              className="shrink-0 text-amber-700 text-xs font-semibold hover:underline">
              {t('ag.pg.renovarCurto')}
            </Link>
          </div>
          {children}
        </>
      )
    }
  }

  return children
}
