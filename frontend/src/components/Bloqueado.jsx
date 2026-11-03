import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { NOMES_PLANO } from '../utils/planos'

// Cartao de "recurso de plano superior" com botao para ver os planos
export default function Bloqueado({ planoNecessario = 'PROFISSIONAL', titulo, texto, compacto = false }) {
  return (
    <div className={`rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 text-center ${compacto ? 'p-4' : 'p-8'}`}>
      <div className="w-10 h-10 mx-auto rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mb-3">
        <Lock size={18} />
      </div>
      <p className="font-semibold text-slate-800">{titulo || `Disponível no plano ${NOMES_PLANO[planoNecessario]}`}</p>
      {texto && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{texto}</p>}
      <Link to="/faturacao" className="btn-primary inline-block mt-4">
        Ver planos — {NOMES_PLANO[planoNecessario]}
      </Link>
    </div>
  )
}
