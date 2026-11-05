import { useEffect, useRef, useState } from 'react'

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

function carregarScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existente = document.querySelector(`script[src="${SCRIPT_URL}"]`)
    if (existente) {
      existente.addEventListener('load', () => resolve())
      existente.addEventListener('error', reject)
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_URL
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// Botão oficial "Entrar com Google". Devolve o token (credential) ao componente pai,
// que o envia ao servidor para confirmação.
export default function GoogleButton({ clientId, onCredential, texto = 'continue_with' }) {
  const ref = useRef(null)
  const [erro, setErro] = useState(false)
  // Guarda a versão mais recente do callback sem reiniciar o botão
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!clientId) return
    let cancelado = false
    carregarScript().then(() => {
      if (cancelado || !ref.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => callbackRef.current?.(resp.credential),
      })
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        text: texto,
        shape: 'pill',
        width: Math.min(340, ref.current.parentElement?.clientWidth || 320),
        locale: document.documentElement.lang || 'pt-PT',
      })
    }).catch(() => setErro(true))
    return () => { cancelado = true }
  }, [clientId, texto])

  if (!clientId) return null
  if (erro) {
    return <p className="text-sm text-red-500 text-center">Não foi possível carregar o Google. Verifica a ligação à internet.</p>
  }
  return <div ref={ref} className="flex justify-center min-h-[44px]" />
}
