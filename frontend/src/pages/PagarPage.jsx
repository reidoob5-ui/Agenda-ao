import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useT } from '../i18n'
import SeletorIdioma from '../components/SeletorIdioma'

// Pagina de pagamento (Paddle). O servidor cria a transacao e devolve /pagar?_ptxn=...
// O Paddle.js le o _ptxn e abre sozinho o checkout (cartao, PayPal, Apple/Google Pay, Pix em BRL).
const PADDLE_JS = 'https://cdn.paddle.com/paddle/v2/paddle.js'

export default function PagarPage() {
  const { t } = useT()
  const nav = useNavigate()
  const [estado, setEstado] = useState('carregando') // carregando | pago | erro

  useEffect(() => {
    const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
    const ambiente = import.meta.env.VITE_PADDLE_ENV === 'live' ? 'production' : 'sandbox'
    const temTransacao = new URLSearchParams(window.location.search).has('_ptxn')
    if (!token || !temTransacao) { setEstado('erro'); return }

    let cancelado = false
    const iniciar = () => {
      if (cancelado || !window.Paddle) return
      try {
        if (ambiente === 'sandbox') window.Paddle.Environment.set('sandbox')
        window.Paddle.Initialize({
          token,
          eventCallback: (ev) => {
            if (ev?.name === 'checkout.completed') {
              setEstado('pago')
              setTimeout(() => nav('/faturacao?pago=1', { replace: true }), 2500)
            }
            if (ev?.name === 'checkout.closed') nav('/faturacao', { replace: true })
          },
        })
      } catch { setEstado('erro') }
    }

    if (window.Paddle) iniciar()
    else {
      const s = document.createElement('script')
      s.src = PADDLE_JS; s.async = true; s.onload = iniciar; s.onerror = () => setEstado('erro')
      document.head.appendChild(s)
    }
    return () => { cancelado = true }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><SeletorIdioma /></div>
      <div className="max-w-sm text-center">
        {estado === 'carregando' && (<>
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-display font-bold text-slate-800 mb-1 flex items-center justify-center gap-2"><Shield size={16} /> {t('pagar.titulo')}</p>
          <p className="text-sm text-slate-500">{t('pagar.aCarregar')}</p>
        </>)}
        {estado === 'pago' && (<>
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
          <p className="font-display font-bold text-slate-800">{t('pagar.pago')}</p>
        </>)}
        {estado === 'erro' && (<>
          <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-4">{t('pagar.erro')}</p>
          <Link to="/faturacao" className="btn-primary px-6 py-2.5 inline-block">{t('pagar.voltar')}</Link>
        </>)}
      </div>
    </div>
  )
}
