import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Plus, X, Phone, Mail, FileText, ToggleLeft, ToggleRight, User } from 'lucide-react'

export default function ProfissionaisPage() {
  const [profissionais, setProfissionais] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null) // profissional sendo editado ou null para criar
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', bio: '', foto: '' })

  const carregar = async () => {
    try {
      const r = await api.get('/profissionais')
      setProfissionais(r.data)
    } catch (err) {
      toast.error('Erro ao carregar profissionais')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrirNovo = () => {
    setEditando(null)
    setForm({ nome: '', telefone: '', email: '', bio: '', foto: '' })
    setModal(true)
  }

  const abrirEditar = (p) => {
    setEditando(p)
    setForm({
      nome: p.nome || '',
      telefone: p.telefone || '',
      email: p.email || '',
      bio: p.bio || '',
      foto: p.foto || ''
    })
    setModal(true)
  }

  const submeter = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await api.put(`/profissionais/${editando.id}`, form)
        toast.success('Profissional actualizado!')
      } else {
        await api.post('/profissionais', form)
        toast.success('Profissional cadastrado!')
      }
      setModal(false)
      carregar()
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao guardar dados')
    }
  }

  const toggleAtivo = async (p) => {
    try {
      await api.put(`/profissionais/${p.id}`, { ativo: !p.ativo })
      toast.success(p.ativo ? 'Profissional desactivado' : 'Profissional activado')
      carregar()
    } catch (err) {
      toast.error('Erro ao mudar estado')
    }
  }

  if (carregando) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Profissionais</h1>
          <p className="text-slate-500 text-sm">Gere a equipa e especialistas do teu negócio</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo profissional
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profissionais.map(p => (
          <div key={p.id} className={`card p-5 flex flex-col justify-between transition-all border ${!p.ativo ? 'opacity-60 bg-slate-50' : 'hover:border-brand-200 hover:shadow-soft'}`}>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden">
                  {p.foto ? (
                    <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                  ) : (
                    p.nome?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 text-lg truncate leading-snug">{p.nome}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                    {p.ativo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                {p.telefone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" /> {p.telefone}
                  </p>
                )}
                {p.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> {p.email}
                  </p>
                )}
                {p.bio && (
                  <p className="flex items-start gap-2 text-xs italic mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-500">
                    <FileText size={12} className="text-slate-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{p.bio}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <button onClick={() => toggleAtivo(p)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                {p.ativo ? (
                  <>
                    <ToggleRight size={20} className="text-green-500" /> Desactivar
                  </>
                ) : (
                  <>
                    <ToggleLeft size={20} className="text-slate-300" /> Activar
                  </>
                )}
              </button>
              <button onClick={() => abrirEditar(p)} className="btn-ghost py-1 px-3 text-xs font-bold border border-slate-200 rounded-lg">
                Editar
              </button>
            </div>
          </div>
        ))}

        {profissionais.length === 0 && (
          <div className="col-span-full card py-16 text-center">
            <User size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nenhum profissional cadastrado</p>
            <p className="text-slate-300 text-sm mt-1">Cria profissionais para que os clientes os possam escolher ao agendar</p>
            <button onClick={abrirNovo} className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus size={14} /> Adicionar primeiro
            </button>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-slate-900">
                {editando ? 'Editar Profissional' : 'Novo Profissional'}
              </h2>
              <button onClick={() => setModal(false)}>
                <X size={18} className="text-slate-400 hover:text-slate-700 transition-colors" />
              </button>
            </div>

            <form onSubmit={submeter} className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input className="input" placeholder="Ex: João Silva" value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Telemóvel</label>
                  <input className="input" placeholder="+244 923..." value={form.telefone}
                    onChange={e => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="joao@exemplo.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">URL da Foto (opcional)</label>
                <input className="input" placeholder="https://exemplo.com/foto.jpg" value={form.foto}
                  onChange={e => setForm({ ...form, foto: e.target.value })} />
              </div>

              <div>
                <label className="label">Biografia / Especialidade (opcional)</label>
                <textarea className="input min-h-[80px] py-2" placeholder="Ex: Cabeleireiro especialista em cortes masculinos e barba."
                  value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1 py-2.5">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1 py-2.5">
                  {editando ? 'Guardar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
