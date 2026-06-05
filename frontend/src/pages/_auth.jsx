import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { CalendarCheck, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const [form, setForm] = useState({ email: '', senha: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const { login, carregando } = useAuthStore()
  const navigate = useNavigate()

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

export function RegistarPage() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '', nomeNegocio: '' })
  const [passo, setPasso] = useState(1)
  const { registar, carregando } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passo === 1) { setPasso(2); return }
    const r = await registar(form)
    if (r.sucesso) { toast.success('Conta criada! Bem-vindo ao AgendaAO 🎉'); navigate('/dashboard') }
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
          <h1 className="font-display text-2xl font-bold text-slate-900">Criar conta</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2].map(n => (
              <div key={n} className={`h-1.5 w-12 rounded-full transition-all
                ${n <= passo ? 'bg-brand-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Passo {passo} de 2</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {passo === 1 ? (
              <>
                <div>
                  <label className="label">Nome do negócio</label>
                  <input className="input" placeholder="Ex: Salão Beleza Luanda"
                    value={form.nomeNegocio} onChange={e => setForm({ ...form, nomeNegocio: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input" placeholder="+244 923 456 789"
                    value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">O teu nome</label>
                  <input className="input" placeholder="Nome completo"
                    value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="teu@email.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Palavra-passe</label>
                  <input className="input" type="password" placeholder="Mínimo 6 caracteres"
                    value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} required minLength={6} />
                </div>
              </>
            )}
            <button type="submit" className="btn-primary w-full py-3" disabled={carregando}>
              {passo === 1 ? 'Continuar →' : carregando ? 'A criar conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        {passo === 2 && (
          <button onClick={() => setPasso(1)} className="block text-center text-sm text-slate-500 mt-3 hover:text-slate-700">
            ← Voltar
          </button>
        )}
        <p className="text-center text-sm text-slate-500 mt-4">
          Já tens conta?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

function LoginPage() { return <_LoginPage /> }
function _LoginPage() { return LoginPage() }
