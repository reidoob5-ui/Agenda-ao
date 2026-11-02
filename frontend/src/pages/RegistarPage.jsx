import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { CalendarCheck, ShieldCheck } from 'lucide-react'
import api from '../services/api'
import GoogleButton from '../components/GoogleButton'

export default function RegistarPage() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '', nomeNegocio: '' })
  const [passo, setPasso] = useState(1)
  const { registar, googleRegistar, carregando } = useAuthStore()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null) // { googleClientId, exigeGoogle }

  useEffect(() => {
    api.get('/auth/config').then(r => setConfig(r.data)).catch(() => setConfig({}))
  }, [])

  const exigeGoogle = !!config?.exigeGoogle

  const criarComGoogle = async (credential) => {
    const r = await googleRegistar(credential, { nomeNegocio: form.nomeNegocio, telefone: form.telefone })
    if (r.sucesso) { toast.success('Conta criada! Bem-vindo 🎉'); navigate('/dashboard') }
    else {
      toast.error(r.erro)
      if (r.codigo === 'JA_EXISTE') navigate('/login')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passo === 1) { setPasso(2); return }
    if (exigeGoogle) return // com Google, a conta cria-se pelo botão do Google
    const r = await registar(form)
    if (r.sucesso) { toast.success('Conta criada! Bem-vindo 🎉'); navigate('/dashboard') }
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
          <h1 className="font-display text-2xl font-bold">Criar conta</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1,2].map(n => <div key={n} className={`h-1.5 w-12 rounded-full ${n<=passo?'bg-brand-500':'bg-slate-200'}`}/>)}
          </div>
          <p className="text-xs text-slate-400 mt-2">Passo {passo} de 2</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {passo === 1 ? (<>
              <div><label className="label">Nome do negócio</label>
                <input className="input" placeholder="Ex: Salão Beleza Luanda" value={form.nomeNegocio}
                  onChange={e=>setForm({...form,nomeNegocio:e.target.value})} required/></div>
              <div><label className="label">Telefone</label>
                <input className="input" placeholder="+244 923 456 789" value={form.telefone}
                  onChange={e=>setForm({...form,telefone:e.target.value})} required/></div>
            </>) : exigeGoogle ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} className="text-brand-600" />
                </div>
                <p className="text-sm text-slate-600">
                  Para a tua segurança, a conta é criada e confirmada com o teu <strong>Google</strong>.
                  Não precisas de criar palavra-passe.
                </p>
                <GoogleButton clientId={config.googleClientId} texto="signup_with" onCredential={criarComGoogle} />
                {carregando && <p className="text-xs text-slate-400">A criar a tua conta...</p>}
              </div>
            ) : (<>
              <div><label className="label">O teu nome</label>
                <input className="input" placeholder="Nome completo" value={form.nome}
                  onChange={e=>setForm({...form,nome:e.target.value})} required/></div>
              <div><label className="label">Email</label>
                <input className="input" type="email" placeholder="teu@email.com" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} required/></div>
              <div><label className="label">Palavra-passe</label>
                <input className="input" type="password" placeholder="Mínimo 6 caracteres" value={form.senha}
                  onChange={e=>setForm({...form,senha:e.target.value})} required minLength={6}/></div>
            </>)}
            {!(passo === 2 && exigeGoogle) && (
              <button type="submit" className="btn-primary w-full py-3" disabled={carregando}>
                {passo===1 ? 'Continuar →' : carregando ? 'A criar...' : 'Criar conta'}
              </button>
            )}
          </form>
        </div>
        {passo===2 && <button onClick={()=>setPasso(1)} className="block text-center text-sm text-slate-500 mt-3 hover:text-slate-700">← Voltar</button>}
        <p className="text-center text-sm text-slate-500 mt-4">Já tens conta? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Entrar</Link></p>
      </div>
    </div>
  )
}
