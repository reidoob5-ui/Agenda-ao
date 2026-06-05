import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function ConfigPage() {
  const { atualizarNegocio } = useAuthStore()
  const [form, setForm] = useState({ nome:'',telefone:'',endereco:'',cidade:'Luanda',ibanBancario:'',merchantExpress:'' })
  const [horarios, setHorarios] = useState(
    Array.from({length:7},(_,i)=>({ diaSemana:i, horaInicio:'08:00', horaFim:'18:00', ativo: i>=1&&i<=5 }))
  )
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/negocios/meu').then(r => {
      const n = r.data
      setForm({ nome:n.nome||'', telefone:n.telefone||'', endereco:n.endereco||'', cidade:n.cidade||'Luanda', ibanBancario:n.ibanBancario||'', merchantExpress:n.merchantExpress||'' })
      if (n.horarios?.length) {
        const h = [...horarios]
        n.horarios.forEach(nh => { h[nh.diaSemana] = nh })
        setHorarios(h)
      }
    })
  }, [])

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true)
    try {
      const r = await api.put('/negocios/meu', { ...form, horarios })
      atualizarNegocio(r.data)
      toast.success('Configurações guardadas!')
    } catch { toast.error('Erro ao guardar') }
    finally { setGuardando(false) }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold mb-6">Configurações</h1>
      <form onSubmit={guardar} className="space-y-5">
        {/* Dados do negócio */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Dados do negócio</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Nome do negócio</label>
              <input className="input" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></div>
            <div><label className="label">Telefone</label>
              <input className="input" value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/></div>
            <div><label className="label">Endereço</label>
              <input className="input" placeholder="Ex: Rua da Samba, 123" value={form.endereco}
                onChange={e=>setForm({...form,endereco:e.target.value})}/></div>
            <div><label className="label">Cidade</label>
              <select className="input" value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})}>
                {['Luanda','Benguela','Huambo','Lubango','Cabinda','Malanje','Namibe'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pagamentos */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Pagamentos</h2>
          <p className="text-xs text-slate-400 mb-4">Para receber dos teus clientes nos agendamentos</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">IBAN Bancário</label>
              <input className="input font-mono text-sm" placeholder="AO06.0000.0000.0000.0000.0000.0"
                value={form.ibanBancario} onChange={e=>setForm({...form,ibanBancario:e.target.value})}/>
              <p className="text-xs text-slate-400 mt-1">BFA, BAI, BIC, BDA — qualquer banco angolano</p>
            </div>
            <div>
              <label className="label">Número Multicaixa Express</label>
              <input className="input" placeholder="Merchant ID do EMIS"
                value={form.merchantExpress} onChange={e=>setForm({...form,merchantExpress:e.target.value})}/>
              <p className="text-xs text-slate-400 mt-1">Obtém em emis.co.ao ou no teu banco</p>
            </div>
          </div>
        </div>

        {/* Horários */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Horários de funcionamento</h2>
          <div className="space-y-2">
            {horarios.map((h, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-8 text-sm font-medium text-slate-500">{DIAS[i]}</span>
                <button type="button"
                  onClick={()=>{ const hs=[...horarios]; hs[i]={...hs[i],ativo:!hs[i].ativo}; setHorarios(hs) }}
                  className={`relative w-9 h-5 rounded-full transition-all ${h.ativo?'bg-brand-500':'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${h.ativo?'left-4':'left-0.5'}`}/>
                </button>
                {h.ativo ? (
                  <div className="flex items-center gap-2">
                    <input type="time" className="input py-1.5 text-sm w-28" value={h.horaInicio}
                      onChange={e=>{ const hs=[...horarios]; hs[i]={...hs[i],horaInicio:e.target.value}; setHorarios(hs) }}/>
                    <span className="text-slate-400 text-sm">–</span>
                    <input type="time" className="input py-1.5 text-sm w-28" value={h.horaFim}
                      onChange={e=>{ const hs=[...horarios]; hs[i]={...hs[i],horaFim:e.target.value}; setHorarios(hs) }}/>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center gap-2 px-6" disabled={guardando}>
          <Save size={16}/> {guardando ? 'A guardar...' : 'Guardar configurações'}
        </button>
      </form>
    </div>
  )
}
