import { useEffect } from 'react'
import { useT } from '../i18n'
/** Camada decorativa global: não altera rotas, formulários, API ou regras de negócio. */
export default function PremiumMotion() {
  const { t } = useT()
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const selector = 'main > *, main section, main .card, main [data-premium-reveal], .auth-shell > div:not(.absolute)'
    let observer
    const scan = (root=document) => {
      const list=[]
      if(root.matches?.(selector)) list.push(root)
      root.querySelectorAll?.(selector).forEach(x=>list.push(x))
      list.forEach((el,i)=>{
        if(el.dataset.aaSeen || el.closest('[data-aa-scene]')) return
        if(el.matches('input,button,a,label,svg') || el.getBoundingClientRect().height<36) return
        el.dataset.aaSeen='1'; el.classList.add('aa-scroll-reveal')
        el.style.setProperty('--aa-stagger',`${(i%6)*60}ms`)
        if(!observer || reduced) el.classList.add('aa-in'); else observer.observe(el)
      })
    }
    if(!reduced && 'IntersectionObserver' in window) observer=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add('aa-in');observer.unobserve(e.target)}
    }),{threshold:.06,rootMargin:'0px 0px -40px 0px'})
    scan()
    const mo=new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)})))
    mo.observe(document.body,{childList:true,subtree:true})
    const move=e=>{
      if(reduced || !window.matchMedia('(hover:hover) and (pointer:fine)').matches)return
      const c=e.target.closest?.('main .card, main [data-tilt]')
      if(!c || e.target.closest('.fixed'))return
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5
      c.style.setProperty('--aa-rx',`${-y*3}deg`);c.style.setProperty('--aa-ry',`${x*3}deg`);c.classList.add('aa-tilting')
    }
    const reset=e=>{const c=e.target.closest?.('main .card, main [data-tilt]');if(c){c.style.setProperty('--aa-rx','0deg');c.style.setProperty('--aa-ry','0deg');c.classList.remove('aa-tilting')}}
    const imageError=e=>{if(e.target?.tagName==='IMG'&&!e.target.dataset.aaFallback){e.target.dataset.aaFallback='1';e.target.classList.add('aa-image-fallback')}}
    document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerout',reset,{passive:true});document.addEventListener('error',imageError,true)
    return()=>{mo.disconnect();observer?.disconnect();document.removeEventListener('pointermove',move);document.removeEventListener('pointerout',reset);document.removeEventListener('error',imageError,true)}
  },[])
  return <div className="aa-3d-world" aria-hidden="true" data-aa-scene>
    <div className="aa-world-glow"/><div className="aa-orbit aa-orbit-one"/><div className="aa-orbit aa-orbit-two"/>
    <div className="aa-3d-stack"><div className="aa-stack-shadow"/>
      <div className="aa-calendar-3d"><div className="aa-calendar-top"><i/><i/></div><div className="aa-calendar-brand">AGENDA AQUI</div><div className="aa-calendar-date">24</div><div className="aa-calendar-lines"><i/><i/><i/></div><div className="aa-calendar-check">✓</div></div>
      <div className="aa-float-chip aa-chip-bell"><span>✦</span><b>{t('lp.3d.nova')}</b><small>{t('lp.3d.conf')}</small></div>
      <div className="aa-float-chip aa-chip-clock"><span>◷</span><b>09:30</b><small>{t('lp.3d.hoje')}</small></div><div className="aa-3d-spark aa-spark-a">✧</div><div className="aa-3d-spark aa-spark-b">✦</div>
    </div>
  </div>
}
