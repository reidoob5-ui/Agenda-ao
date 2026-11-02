import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import api from '../services/api'

// Tempo que cada depoimento fica visível na página inicial (em milissegundos).
// Para mudar a velocidade, altera só este número.
export const TEMPO_VISIVEL_MS = 2000
const TEMPO_FADE_MS = 500

export function Estrelas({ valor, tamanho = 16 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${valor} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={tamanho}
          className={n <= valor ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
        />
      ))}
    </span>
  )
}

// Logótipo do negócio; se não houver, mostra a inicial do nome
export function Avatar({ nome, logo, tamanho = 44 }) {
  const [falhou, setFalhou] = useState(false)
  const estilo = { width: tamanho, height: tamanho }
  if (logo && !falhou) {
    return (
      <img
        src={logo}
        alt={`Logótipo de ${nome}`}
        style={estilo}
        className="rounded-full object-cover border border-slate-100 shrink-0"
        onError={() => setFalhou(true)}
      />
    )
  }
  return (
    <div
      style={{ ...estilo, fontSize: tamanho * 0.42 }}
      className="rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0"
    >
      {(nome || '?').trim().charAt(0).toUpperCase()}
    </div>
  )
}

// Faixa da página inicial: mostra um depoimento de cada vez e troca com fade.
// Se ainda não houver depoimentos reais, não mostra nada (nunca inventamos depoimentos).
export function DepoimentosRotativos() {
  const [itens, setItens] = useState([])
  const [resumo, setResumo] = useState(null)
  const [indice, setIndice] = useState(0)
  const [visivel, setVisivel] = useState(true)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    let vivo = true
    api.get('/depoimentos?limit=20')
      .then(r => {
        if (!vivo) return
        setItens(r.data.itens || [])
        setResumo({ media: r.data.media, total: r.data.total })
      })
      .catch(() => {})
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (itens.length < 2 || pausado) return
    let trocar
    const esconder = setTimeout(() => {
      setVisivel(false)
      trocar = setTimeout(() => {
        setIndice(i => (i + 1) % itens.length)
        setVisivel(true)
      }, TEMPO_FADE_MS)
    }, TEMPO_VISIVEL_MS)
    return () => { clearTimeout(esconder); clearTimeout(trocar) }
  }, [indice, itens.length, pausado])

  if (!itens.length) return null
  const atual = itens[indice % itens.length]

  return (
    <section
      className="max-w-3xl mx-auto px-6 pb-14"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      onTouchEnd={() => setPausado(false)}
    >
      <div className="bg-white border border-slate-100 shadow-soft rounded-2xl p-5 min-h-[132px] flex flex-col justify-center">
        <div
          style={{ opacity: visivel ? 1 : 0, transition: `opacity ${TEMPO_FADE_MS}ms ease` }}
          aria-live="polite"
        >
          <div className="flex items-center gap-3 mb-2">
            <Avatar nome={atual.negocio.nome} logo={atual.negocio.logo} />
            <div className="text-left min-w-0">
              <p className="font-semibold text-slate-800 truncate">{atual.negocio.nome}</p>
              <Estrelas valor={atual.estrelas} tamanho={14} />
            </div>
          </div>
          <p className="text-sm text-slate-600 text-left leading-relaxed line-clamp-3">“{atual.texto}”</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center mt-3">
        {resumo?.total ? `${resumo.media.toFixed(1)} ★ · ${resumo.total} depoimento${resumo.total !== 1 ? 's' : ''} · ` : ''}
        <Link to="/depoimentos" className="text-brand-600 font-semibold hover:underline">Ver todos</Link>
      </p>
    </section>
  )
}
