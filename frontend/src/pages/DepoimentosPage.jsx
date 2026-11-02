import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import api from '../services/api'
import { Estrelas, Avatar } from '../components/Depoimentos'

const POR_PAGINA = 20

// Página pública de depoimentos, ao estilo das lojas de aplicações
export default function DepoimentosPage() {
  const [dados, setDados] = useState(null)
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [maisCarregando, setMaisCarregando] = useState(false)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    api.get(`/depoimentos?limit=${POR_PAGINA}`)
      .then(r => { setDados(r.data); setItens(r.data.itens) })
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  const carregarMais = async () => {
    setMaisCarregando(true)
    try {
      const r = await api.get(`/depoimentos?limit=${POR_PAGINA}&offset=${itens.length}`)
      setItens(atual => [...atual, ...r.data.itens])
    } catch { /* mantém o que já está */ }
    setMaisCarregando(false)
  }

  const total = dados?.total || 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">AgendaAO</span>
          </Link>
          <Link to="/criar" className="btn-primary">Começar grátis →</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">O que dizem os nossos clientes</h1>
        <p className="text-slate-500 mb-8">Depoimentos de negócios que já usam o AgendaAO.</p>

        {carregando && <p className="text-slate-400 text-center py-16">A carregar...</p>}
        {erro && <p className="text-slate-500 text-center py-16">Não foi possível carregar os depoimentos. Tenta novamente daqui a pouco.</p>}

        {!carregando && !erro && total === 0 && (
          <div className="card p-10 text-center">
            <p className="font-semibold text-slate-700 mb-1">Ainda não há depoimentos</p>
            <p className="text-sm text-slate-400">Os primeiros depoimentos aparecem aqui depois de 10 dias de uso.</p>
          </div>
        )}

        {total > 0 && (
          <>
            {/* Resumo: nota média + barras por estrelas */}
            <div className="card p-6 mb-6 flex flex-col sm:flex-row gap-6 items-center">
              <div className="text-center sm:pr-6 sm:border-r border-slate-100">
                <p className="font-display text-5xl font-bold text-slate-900">{dados.media.toFixed(1)}</p>
                <div className="mt-1"><Estrelas valor={Math.round(dados.media)} tamanho={18} /></div>
                <p className="text-xs text-slate-400 mt-1">{total} depoimento{total !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {[5, 4, 3, 2, 1].map(n => {
                  const qtd = dados.distribuicao[n] || 0
                  const pct = total ? Math.round((qtd / total) * 100) : 0
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-3 text-right">{n}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right">{qtd}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lista */}
            <div className="space-y-4">
              {itens.map(d => (
                <article key={d.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar nome={d.negocio.nome} logo={d.negocio.logo} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{d.negocio.nome}</p>
                      {d.negocio.cidade && <p className="text-xs text-slate-400">{d.negocio.cidade}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Estrelas valor={d.estrelas} tamanho={14} />
                    <span className="text-xs text-slate-400">
                      {format(new Date(d.criadoEm), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{d.texto}</p>
                </article>
              ))}
            </div>

            {itens.length < total && (
              <div className="text-center mt-6">
                <button onClick={carregarMais} disabled={maisCarregando} className="btn-ghost">
                  {maisCarregando ? 'A carregar...' : 'Ver mais depoimentos'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
