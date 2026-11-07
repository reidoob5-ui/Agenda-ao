import { useEffect } from 'react'

/** Efeitos decorativos progressivos. Não altera rotas, estado ou eventos de negócio. */
export default function PremiumMotion() {
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const selector = [
      '.h-screen > main > *',
      '.h-screen > main .card',
      '.auth-card',
      '.auth-shell > div',
      '.min-h-screen > main > *',
      '.booking-card',
      '[data-premium-reveal]'
    ].join(',')

    let observer
    const reveal = (root = document) => {
      root.querySelectorAll?.(selector).forEach((el, index) => {
        if (el.dataset.premiumObserved) return
        el.dataset.premiumObserved = '1'
        el.classList.add('aa-reveal')
        el.style.setProperty('--aa-delay', `${Math.min(index % 5, 4) * 55}ms`)
        if (!observer) el.classList.add('is-visible')
        else observer.observe(el)
      })
    }

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' })
    }

    reveal()
    const mutations = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === 1) reveal(node)
      }))
    })
    mutations.observe(document.body, { childList: true, subtree: true })

    // Imagens remotas ou carregadas pelo utilizador nunca devem deixar um ícone partido.
    const onImageError = event => {
      const img = event.target
      if (img?.tagName !== 'IMG' || img.dataset.fallbackApplied) return
      img.dataset.fallbackApplied = '1'
      img.classList.add('aa-image-failed')
      img.setAttribute('aria-hidden', 'true')
    }
    document.addEventListener('error', onImageError, true)

    return () => {
      mutations.disconnect()
      observer?.disconnect()
      document.removeEventListener('error', onImageError, true)
    }
  }, [])

  return null
}
