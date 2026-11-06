import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Avatar } from '../components/Depoimentos'
import { reduzirImagem } from '../utils/imagem'
import { useT } from '../i18n'

const TEXTO_MIN = 10
const TEXTO_MAX = 400

export default function AvaliarPage() {
  const { negocio, atualizarNegocio } = useAuthStore()
  const { t } = useT()
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
    }).catch(() => toast.error(t('ct.av.erroCarregar')))
  }, [])

  const escolherLogo = async (e) => {
    const ficheiro = e.target.files?.[0]
    if (!ficheiro) return
    if (!ficheiro.type.startsWith('image/')) return toast.error(t('ct.av.escolheImg'))
    try {
      setLogo(await reduzirImagem(ficheiro))
      setLogoNovo(true)
    } catch { toast.error(t('ct.av.erroImg')) }
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!estrelas) return toast.error(t('ct.av.escolheEstrelas'))
    if (texto.trim().length < TEXTO_MIN) return toast.error(t('ct.av.minChars', { n: TEXTO_MIN }))
    setEnviando(true)
    try {
      // O logótipo do negócio é o que aparece no depoimento
      if (logoNovo && logo) {
        await api.put('/negocios/meu', { logo })
        atualizarNegocio({ ...negocio, logo })
        setLogoNovo(false)
      }
      await api.put('/depoimentos/meu', { estrelas, texto })
      toast.success(t('ct.av.obrigado'))
      const r = await api.get('/depoimentos/meu')
      setEstado(r.data)
    } catch (err) {
      toast.error(err.response?.data?.erro || t('ct.av.erroGuardar'))
    } finally { setEnviando(false) }
  }

  if (!estado) return <div className="p-6 text-slate-400">{t('ct.av.aCarregar')}</div>

  if (!estado.elegivel) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="font-display text-2xl font-bold mb-3">{t('ct.av.deixar')}</h1>
        <div className="card p-6">
          <p className="text-slate-700 font-medium mb-1">{t('ct.av.aindaNao')}</p>
          <p className="text-sm text-slate-500">
            {t(estado.diasEmFalta !== 1 ? 'ct.av.faltaN' : 'ct.av.faltaUm', { n: estado.diasEmFalta })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="font-display text-2xl font-bold mb-1">
        {estado.depoimento ? t('ct.av.teuDep') : t('ct.av.deixar')}
      </h1>
      <p className="text-sm text-slate-500 mb-5">
        {t('ct.av.intro')}{' '}
        <Link to="/depoimentos" className="text-brand-600 font-semibold hover:underline">{t('ct.av.introLink')}</Link>.
      </p>

      <form onSubmit={enviar} className="card p-6 space-y-5">
        <div>
          <label className="label">{t('ct.av.quantas')}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button type="button" key={n} onClick={() => setEstrelas(n)} aria-label={t('ct.av.nEstrelas', { n })} className="p-0.5">
                <Star size={34} className={n <= estrelas ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t('ct.av.teuDep')}</label>
          <textarea
            className="input min-h-[120px]"
            maxLength={TEXTO_MAX}
            placeholder={t('ct.av.placeholder')}
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{texto.length}/{TEXTO_MAX}</p>
        </div>

        <div>
          <label className="label">{t('ct.av.logoLabel')}</label>
          <div className="flex items-center gap-4">
            <Avatar nome={negocio?.nome} logo={logo} tamanho={56} />
            <div>
              <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost text-sm inline-flex items-center gap-2">
                <ImagePlus size={15} /> {logo ? t('ct.av.mudarImg') : t('ct.av.escolherImg')}
              </button>
              <p className="text-xs text-slate-400 mt-1">{t('ct.av.logoAjuda')}</p>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={escolherLogo} />
          </div>
        </div>

        <button type="submit" disabled={enviando} className="btn-primary w-full py-3">
          {enviando ? t('ct.av.guardando') : estado.depoimento ? t('ct.av.atualizar') : t('ct.av.publicar')}
        </button>
      </form>
    </div>
  )
}
