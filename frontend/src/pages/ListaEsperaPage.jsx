import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hourglass, Phone, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../services/api'
import { linkWhatsApp } from '../utils/whatsapp'
import { usePlano } from '../utils/planos'
import Bloqueado from '../components/Bloqueado'
import { useAuthStore } from '../store/authStore'

export default function ListaEsperaPage() {
  const { tem } = usePlano()
  const negocio = useAuthStore(s => s.negocio)
  const [itens, setItens] = useState(null)

  const carregar = () => api.get('/lista-espera').then(r => setItens(r.data)).catch(() => setItens([]))
  useEffect(() => { if (tem('listaEspera')) carregar() }, [])

  const marcar = async (id, status) => {
    try {
      await api.patch(`/lista-espera/${id}`, { status })
      setItens(l => l.filter(i => i.id !== id))
      toast.success(status === 'REMOVIDO' ? 'Removido da lista' : 'Marcado como contactado')
    } catch { toast.error('Erro ao atualizar') }
  }

  if (!tem('listaEspera')) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="font-display text-2xl font-bold mb-6">Lista de espera</h1>
        <Bloqueado planoNecessario="PREMIUM" titulo="Lista de espera"
          texto="Quando um horário está cheio, o cliente entra na lista e tu avisas quando abrir uma vaga. Disponível no plano Premium." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold mb-1">Lista de espera</h1>
      <p className="text-sm text-slate-500 mb-6">Clientes que queriam um horário cheio. Se alguém cancelar, avisa-os por WhatsApp.</p>
      {itens === null ? <p className="text-sm text-slate-400">A carregar...</p> : itens.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <Hourglass size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Ninguém na lista de espera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map(i => {
            const link = linkWhatsApp(i.telefone, `Olá ${i.nome.split(' ')[0]}! Abriu uma vaga em ${negocio?.nome}. Ainda queres marcar?`)
            return (
              <div key={i.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{i.nome}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> {i.telefone}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {[i.servico, i.profissional, i.dataDesejada && format(new Date(i.dataDesejada), 'dd/MM/yyyy HH:mm')].filter(Boolean).join(' · ') || 'Qualquer horário'}
                  </p>
                  {i.nota && <p className="text-xs text-slate-500 italic mt-1">“{i.nota}”</p>}
                </div>
                {link && <a href={link} target="_blank" rel="noreferrer" onClick={() => marcar(i.id, 'CONTACTADO')}
                  className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Avisar</a>}
                <button onClick={() => marcar(i.id, 'CONTACTADO')} title="Já contactado" className="p-2 text-slate-400 hover:text-green-600"><Check size={16} /></button>
                <button onClick={() => marcar(i.id, 'REMOVIDO')} title="Remover" className="p-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
