import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'

export default function NaoEncontradaPage() {
  const { t } = useT()
  useEffect(() => {
    // Nao indexar paginas que nao existem
    const m = document.createElement('meta')
    m.name = 'robots'
    m.content = 'noindex'
    document.head.appendChild(m)
    return () => m.remove()
  }, [])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', background: '#fff7f4', color: '#2a1f23', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 440 }}>
        <p style={{ margin: 0, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '5rem', lineHeight: 1, color: '#cf5b6c' }}>404</p>
        <h1 style={{ margin: '14px 0 8px', fontSize: '1.5rem' }}>{t('er.404Titulo')}</h1>
        <p style={{ margin: '0 0 24px', color: '#7a4a53' }}>{t('er.404Sub')}</p>
        <Link to="/" style={{ display: 'inline-block', padding: '12px 22px', borderRadius: 999, background: '#cf5b6c', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
          {t('er.voltar')}
        </Link>
      </div>
    </main>
  )
}
