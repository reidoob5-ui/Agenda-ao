import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { CalendarCheck, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'
import GoogleButton from '../components/GoogleButton'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', senha: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const { login, googleLogin, carregando } = useAuthStore()
  const navigate = useNavigate()
  const [googleClientId, setGoogleClientId] = useState(null)

  useEffect(() => {
    api.get('/auth/config').then(r => setGoogleClientId(r.data.googleClientId)).catch(() => {})
  }, [])

  const entrarComGoogle = async (credential) => {
    const r = await googleLogin(credential)
    if (r.sucesso) { toast.success('Bem-vindo de volta!'); navigate('/dashboard') }
    else {
      toast.error(r.erro)
      if (r.codigo === 'NAO_REGISTADO') navigate('/criar')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const r = await login(form.email, form.senha)
    if (r.sucesso) { toast.success('Bem-vindo de volta!'); navigate('/dashboard') }
    else toast.error(r.erro)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <CalendarCheck size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl">AgendaAO</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900">Entrar na conta</h1>
          <p className="text-sm text-slate-500 mt-1">Acede ao teu painel de gestão</p>
        </div>
        <div className="card p-6">
          {googleClientId && (
            <>
              <GoogleButton clientId={googleClientId} texto="signin_with" onCredential={entrarComGoogle} />
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">ou com email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="teu@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Palavra-passe</label>
              <div className="relative">
                <input className="input pr-10" type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} required />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={carregando}>
              {carregando ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">
          Ainda não tens conta?{' '}
          <Link to="/criar" className="text-brand-600 font-semibold hover:underline">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  )
}
