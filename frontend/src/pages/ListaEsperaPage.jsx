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
import { useT, traduzir } from '../i18n'

export default function ListaEsperaPage() {
  const { t, idioma } = useT()
  const { tem } = usePlano()
  const negocio = useAuthStore(s => s.negocio)
  const idiomaNegocio = String(negocio?.idioma || idioma).slice(0, 2).toLowerCase()
  const [itens, setItens] = useState(null)

  const carregar = () => api.get('/lista-espera').then(r => setItens(r.data)).catch(() => setItens([]))
  useEffect(() => { if (tem('listaEspera')) carregar() }, [])

  const marcar = async (id, status) => {
    try {
      await api.patch(`/lista-espera/${id}`, { status })
      setItens(l => l.filter(i => i.id !== id))
      toast.success(status === 'REMOVIDO' ? t('gs.le.removido') : t('gs.le.contactado'))
    } catch { toast.error(t('gs.le.erro')) }
  }

  if (!tem('listaEspera')) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="font-display text-2xl font-bold mb-6">{t('gs.le.titulo')}</h1>
        <Bloqueado planoNecessario="PREMIUM" titulo={t('gs.le.titulo')}
          texto={t('gs.le.bloqTexto')} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold mb-1">{t('gs.le.titulo')}</h1>
      <p className="text-sm text-slate-500 mb-6">{t('gs.le.desc')}</p>
      {itens === null ? <p className="text-sm text-slate-400">{t('gs.le.carregando')}</p> : itens.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <Hourglass size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">{t('gs.le.vazia')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map(i => {
            const link = linkWhatsApp(i.telefone, traduzir(idiomaNegocio, 'gs.le.msgVaga', { nome: i.nome.split(' ')[0], negocio: negocio?.nome }))
            return (
              <div key={i.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{i.nome}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> {i.telefone}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {[i.servico, i.profissional, i.dataDesejada && format(new Date(i.dataDesejada), 'dd/MM/yyyy HH:mm')].filter(Boolean).join(' · ') || t('gs.le.qualquerHorario')}
                  </p>
                  {i.nota && <p className="text-xs text-slate-500 italic mt-1">“{i.nota}”</p>}
                </div>
                {link && <a href={link} target="_blank" rel="noreferrer" onClick={() => marcar(i.id, 'CONTACTADO')}
                  className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{t('gs.le.avisar')}</a>}
                <button onClick={() => marcar(i.id, 'CONTACTADO')} title={t('gs.le.jaContactado')} className="p-2 text-slate-400 hover:text-green-600"><Check size={16} /></button>
                <button onClick={() => marcar(i.id, 'REMOVIDO')} title={t('gs.le.remover')} className="p-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
