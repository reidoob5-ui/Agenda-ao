import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import api from '../services/api'

const CHAVE = 'agendaao-depoimento-adiado'
const ADIAR_MS = 24 * 60 * 60 * 1000

function adiadoRecentemente() {
  try {
    const t = parseInt(localStorage.getItem(CHAVE) || '0')
    return t && Date.now() - t < ADIAR_MS
  } catch { return false }
}

// Depois de 10 dias de uso, pede ao dono do negócio que deixe o depoimento.
// "Mais tarde" adia o pedido por 24 horas; deixa de aparecer quando o depoimento é enviado.
export default function PedidoDepoimento() {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    if (adiadoRecentemente()) return
    api.get('/depoimentos/meu')
      .then(r => { if (r.data.pedir) setMostrar(true) })
      .catch(() => {})
  }, [])

  const adiar = () => {
    try { localStorage.setItem(CHAVE, String(Date.now())) } catch {}
    setMostrar(false)
  }

  if (!mostrar) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full text-center shadow-xl">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star size={28} className="text-amber-400 fill-amber-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Já usas o Agenda Aqui há 10 dias!</h2>
        <p className="text-sm text-slate-500 mb-6">
          Como está a correr? O teu depoimento demora 1 minuto e ajuda outros negócios a decidir.
        </p>
        <Link to="/avaliar" onClick={() => setMostrar(false)} className="btn-primary w-full py-3 block">
          Deixar o meu depoimento
        </Link>
        <button onClick={adiar} className="text-sm text-slate-400 hover:text-slate-600 mt-3">
          Mais tarde
        </button>
      </div>
    </div>
  )
}
