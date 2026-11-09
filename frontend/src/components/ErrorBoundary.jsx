import { Component } from 'react'

// Rede de seguranca: se uma pagina rebentar, mostra um ecra com saida em vez de ficar tudo branco.
// Texto proprio (sem depender do sistema de idiomas, que pode ser a causa do erro).
const TEXTOS = {
  pt: ['Algo correu mal', 'Já estamos a ver isto. Tenta recarregar a página.', 'Recarregar', 'Ir para o início'],
  en: ['Something went wrong', 'Please try reloading the page.', 'Reload', 'Go to home'],
  es: ['Algo salió mal', 'Intenta recargar la página.', 'Recargar', 'Ir al inicio'],
  fr: ['Une erreur est survenue', 'Essayez de recharger la page.', 'Recharger', "Aller à l'accueil"],
}

function textos() {
  let l = ''
  try { l = (navigator.language || '').slice(0, 2).toLowerCase() } catch {}
  return TEXTOS[l] || TEXTOS.en
}

export default class ErrorBoundary extends Component {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(erro, info) {
    console.error('[ErrorBoundary]', erro, info?.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children
    const [titulo, sub, recarregar, inicio] = textos()
    const botao = { display: 'inline-block', padding: '12px 22px', borderRadius: 999, fontWeight: 600, fontSize: 15, cursor: 'pointer', textDecoration: 'none', border: '1px solid #cf5b6c' }
    return (
      <main role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', background: '#fff7f4', color: '#2a1f23', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>{titulo}</h1>
          <p style={{ margin: '0 0 24px', color: '#7a4a53' }}>{sub}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => window.location.reload()} style={{ ...botao, background: '#cf5b6c', color: '#fff' }}>{recarregar}</button>
            <a href="/" style={{ ...botao, background: '#fff', color: '#cf5b6c' }}>{inicio}</a>
          </div>
        </div>
      </main>
    )
  }
}
