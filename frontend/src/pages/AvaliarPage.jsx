import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Avatar } from '../components/Depoimentos'

const TEXTO_MIN = 10
const TEXTO_MAX = 400

// Reduz a imagem para 160x160 (JPEG) no próprio telemóvel antes de enviar
function reduzirImagem(ficheiro, lado = 160) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(ficheiro)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = lado; canvas.height = lado
      const ctx = canvas.getContext('2d')
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, lado, lado)
      ctx.drawImage(img, sx, sy, min, min, 0, 0, lado, lado)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')) }
    img.src = url
  })
}

export default function AvaliarPage() {
  const { negocio, atualizarNegocio } = useAuthStore()
  const [estado, setEstado] = useState(null)
  const [estrelas, setEstrelas] = useState(0)
  const [texto, setTexto] = useState('')
  const [logo, setLogo] = useState(negocio?.logo || null)
  const [logoNovo, setLogoNovo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    api.get('/depoimentos/meu').then(r => {
      setEstado(r.data)
      if (r.data.depoimento) {
        setEstrelas(r.data.depoimento.estrelas)
        setTexto(r.data.depoimento.texto)
      }
    }).catch(() => toast.error('Erro ao carregar'))
  }, [])

  const escolherLogo = async (e) => {
    const ficheiro = e.target.files?.[0]
    if (!ficheiro) return
    if (!ficheiro.type.startsWith('image/')) return toast.error('Escolhe uma imagem')
    try {
      setLogo(await reduzirImagem(ficheiro))
      setLogoNovo(true)
    } catch { toast.error('Não consegui ler essa imagem') }
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!estrelas) return toast.error('Escolhe de 1 a 5 estrelas')
    if (texto.trim().length < TEXTO_MIN) return toast.error(`Escreve pelo menos ${TEXTO_MIN} caracteres`)
    setEnviando(true)
    try {
      // O logótipo do negócio é o que aparece no depoimento
      if (logoNovo && logo) {
        await api.put('/negocios/meu', { logo })
        atualizarNegocio({ ...negocio, logo })
        setLogoNovo(false)
      }
      await api.put('/depoimentos/meu', { estrelas, texto })
      toast.success('Obrigado pelo teu depoimento! 🎉')
      const r = await api.get('/depoimentos/meu')
      setEstado(r.data)
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao guardar')
    } finally { setEnviando(false) }
  }

  if (!estado) return <div className="p-6 text-slate-400">A carregar...</div>

  if (!estado.elegivel) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="font-display text-2xl font-bold mb-3">Deixar depoimento</h1>
        <div className="card p-6">
          <p className="text-slate-700 font-medium mb-1">Ainda não é possível</p>
          <p className="text-sm text-slate-500">
            Podes deixar o teu depoimento depois de 10 dias de uso. Faltam {estado.diasEmFalta} dia{estado.diasEmFalta !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="font-display text-2xl font-bold mb-1">
        {estado.depoimento ? 'O teu depoimento' : 'Deixar depoimento'}
      </h1>
      <p className="text-sm text-slate-500 mb-5">
        Conta a outros negócios como o AgendaAO te ajuda. Aparece na página inicial e na página de{' '}
        <Link to="/depoimentos" className="text-brand-600 font-semibold hover:underline">depoimentos</Link>.
      </p>

      <form onSubmit={enviar} className="card p-6 space-y-5">
        <div>
          <label className="label">Quantas estrelas dás?</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button type="button" key={n} onClick={() => setEstrelas(n)} aria-label={`${n} estrelas`} className="p-0.5">
                <Star size={34} className={n <= estrelas ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">O teu depoimento</label>
          <textarea
            className="input min-h-[120px]"
            maxLength={TEXTO_MAX}
            placeholder="Ex: Os meus clientes marcam sozinhos e deixei de perder horas ao telefone."
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{texto.length}/{TEXTO_MAX}</p>
        </div>

        <div>
          <label className="label">Logótipo ou foto (aparece junto ao teu nome)</label>
          <div className="flex items-center gap-4">
            <Avatar nome={negocio?.nome} logo={logo} tamanho={56} />
            <div>
              <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost text-sm inline-flex items-center gap-2">
                <ImagePlus size={15} /> {logo ? 'Mudar imagem' : 'Escolher imagem'}
              </button>
              <p className="text-xs text-slate-400 mt-1">Sem imagem, mostramos a inicial do teu negócio.</p>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={escolherLogo} />
          </div>
        </div>

        <button type="submit" disabled={enviando} className="btn-primary w-full py-3">
          {enviando ? 'A guardar...' : estado.depoimento ? 'Atualizar depoimento' : 'Publicar depoimento'}
        </button>
      </form>
    </div>
  )
}
