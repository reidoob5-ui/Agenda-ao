import { useEffect, useState } from 'react'
import AssinaturaAda from '../components/AssinaturaAda'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { CalendarCheck, ShieldCheck } from 'lucide-react'
import api from '../services/api'
import GoogleButton from '../components/GoogleButton'
import SeletorIdioma from '../components/SeletorIdioma'
import { useT } from '../i18n'
import Illustracao3D from '../components/Illustracao3D'

export default function RegistarPage() {
  const { t } = useT()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '', nomeNegocio: '' })
  const [passo, setPasso] = useState(1)
  const [erroForm, setErroForm] = useState('')
  const { registar, googleRegistar, carregando } = useAuthStore()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null) // { googleClientId, exigeGoogle }

  useEffect(() => {
    api.get('/auth/config').then(r => setConfig(r.data)).catch(() => setConfig({}))
  }, [])

  const exigeGoogle = !!config?.exigeGoogle

  const criarComGoogle = async (credential) => {
    setErroForm('')
    const r = await googleRegistar(credential, { nomeNegocio: form.nomeNegocio, telefone: form.telefone })
    if (r.sucesso) { toast.success(t('reg.ok')); navigate('/dashboard') }
    else {
      setErroForm(r.erro)
      toast.error(r.erro)
      if (r.codigo === 'JA_EXISTE') navigate('/login')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passo === 1) { setPasso(2); return }
    if (exigeGoogle) return // com Google, a conta cria-se pelo botão do Google
    setErroForm('')
    const r = await registar({ ...form, email: form.email.trim(), nome: form.nome.trim(), nomeNegocio: form.nomeNegocio.trim(), telefone: form.telefone.trim() })
    if (r.sucesso) { toast.success(t('reg.ok')); navigate('/dashboard') }
    else { setErroForm(r.erro); toast.error(r.erro) }
  }

  return (
    <div className="auth-shell min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div className="auth-illustration auth-illustration--register" aria-hidden="true"><Illustracao3D type="people" size="feature" /></div>
      <div className="absolute top-4 right-4"><SeletorIdioma /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <CalendarCheck size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl">Agenda Aqui</span>
          </Link>
          <h1 className="font-display text-2xl font-bold">{t('reg.titulo')}</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1,2].map(n => <div key={n} className={`h-1.5 w-12 rounded-full ${n<=passo?'bg-brand-500':'bg-slate-200'}`}/>)}
          </div>
          <p className="text-xs text-slate-400 mt-2">{t('reg.passo', { n: passo })}</p>
        </div>
        <div className="card auth-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {passo === 1 ? (<>
              <div><label className="label">{t('reg.nomeNegocio')}</label>
                <input className="input" placeholder={t('reg.nomeNegocioEx')} value={form.nomeNegocio}
                  onChange={e=>setForm({...form,nomeNegocio:e.target.value})} required/></div>
              <div><label className="label">{t('reg.telefone')}</label>
                <input className="input" placeholder={t('reg.telefoneEx')} value={form.telefone}
                  onChange={e=>setForm({...form,telefone:e.target.value})} required/></div>
            </>) : exigeGoogle ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} className="text-brand-600" />
                </div>
                <p className="text-sm text-slate-600">{t('reg.googleTexto')}</p>
                <GoogleButton clientId={config.googleClientId} texto="signup_with" onCredential={criarComGoogle} />
                {carregando && <p className="text-xs text-slate-400">{t('reg.googleCriando')}</p>}
              </div>
            ) : (<>
              <div><label className="label">{t('reg.nome')}</label>
                <input className="input" placeholder={t('reg.nomeEx')} value={form.nome}
                  onChange={e=>setForm({...form,nome:e.target.value})} required/></div>
              <div><label className="label">{t('auth.email')}</label>
                <input className="input" type="email" placeholder="teu@email.com" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} required/></div>
              <div><label className="label">{t('auth.senha')}</label>
                <input className="input" type="password" placeholder={t('reg.senhaMin')} value={form.senha}
                  onChange={e=>setForm({...form,senha:e.target.value})} required minLength={6}/></div>
            </>)}
            {erroForm && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {erroForm}
              </p>
            )}
            {!(passo === 2 && exigeGoogle) && (
              <button type="submit" className="btn-primary w-full py-3" disabled={carregando}>
                {passo===1 ? t('comum.continuar') : carregando ? t('reg.criando') : t('reg.criar')}
              </button>
            )}
            {passo===2 && (
              <p className="text-[11px] text-slate-400 text-center">{t('legal.aceito')} <Link to="/termos" target="_blank" className="underline">{t('legal.termos')}</Link> · <Link to="/privacidade" target="_blank" className="underline">{t('legal.privacidade')}</Link></p>
            )}
          </form>
        </div>
        {passo===2 && <button onClick={()=>setPasso(1)} className="block text-center text-sm text-slate-500 mt-3 hover:text-slate-700">← {t('comum.voltar')}</button>}
        <p className="text-center text-sm text-slate-500 mt-4">{t('reg.jaTens')} <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('comum.entrar')}</Link></p>
        <AssinaturaAda tamanho="sm" className="mt-8" />
      </div>
    </div>
  )
}
