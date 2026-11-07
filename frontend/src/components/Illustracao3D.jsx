import {
  CalendarCheck, Bell, CreditCard, TrendingUp,
  Video, Users, Globe, ShieldCheck, CheckCircle2
} from 'lucide-react'

const ICONES = {
  calendar: CalendarCheck,
  reminder: Bell,
  payment: CreditCard,
  analytics: TrendingUp,
  video: Video,
  people: Users,
  globe: Globe,
  security: ShieldCheck,
  smart: CheckCircle2,
}

/**
 * Pequenas ilustrações de interface com profundidade 3D em CSS.
 * São vetoriais, leves e reutilizáveis em cartões, cabeçalhos e páginas internas.
 */
export default function Illustracao3D({ type = 'calendar', size = 'feature', className = '' }) {
  const Icone = ICONES[type] || CalendarCheck
  return (
    <span
      className={`aa-3d aa-3d--${size} ${className}`.trim()}
      data-type={type}
      aria-hidden="true"
    >
      <span className="aa-3d__halo" />
      <span className="aa-3d__pedestal" />
      <span className="aa-3d__tile">
        <span className="aa-3d__shine" />
        <Icone className="aa-3d__icon" strokeWidth={1.65} />
      </span>
      <span className="aa-3d__spark aa-3d__spark--one" />
      <span className="aa-3d__spark aa-3d__spark--two" />
      <span className="aa-3d__bubble"><ShieldCheck strokeWidth={2.2} /></span>
    </span>
  )
}
