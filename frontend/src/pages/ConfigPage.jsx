import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Save, ImagePlus, Lock, Globe } from 'lucide-react'
import { MOEDAS } from '../utils/moeda'
import { listaDeFusos, fusoDoNavegador, FUSO_PADRAO } from '../utils/tempo'
import { IDIOMAS, useT } from '../i18n'
import { Link } from 'react-router-dom'
import { usePlano } from '../utils/planos'
import { reduzirImagem } from '../utils/imagem'

const DIAS = ['ct.dia0','ct.dia1','ct.dia2','ct.dia3','ct.dia4','ct.dia5','ct.dia6']

export default function ConfigPage() {
  const { atualizarNegocio } = useAuthStore()
  const { t } = useT()
  const { tem } = usePlano()
  const [logo, setLogo] = useState(undefined) // undefined = ainda a carregar (nao enviar)
  const [cor, setCor] = useState(undefined)
  const [form, setForm] = useState({ nome:'',telefone:'',endereco:'',cidade:'Luanda',ibanBancario:'',merchantExpress:'',fusoHorario:FUSO_PADRAO,moeda:'AOA',idioma:'pt',linkSessaoPadrao:'',chavePix:'' })
  const [horarios, setHorarios] = useState(
    Array.from({length:7},(_,i)=>({ diaSemana:i, horaInicio:'08:00', horaFim:'18:00', ativo: i>=1&&i<=5 }))
  )
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/negocios/meu').then(r => {
      const n = r.data
      setLogo(n.logo || null); setCor(n.corPrimaria || '')
      setForm({ nome:n.nome||'', telefone:n.telefone||'', endereco:n.endereco||'', cidade:n.cidade||'Luanda', ibanBancario:n.ibanBancario||'', merchantExpress:n.merchantExpress||'', fusoHorario:n.fusoHorario||FUSO_PADRAO, moeda:n.moeda||'AOA', idioma:n.idioma||'pt', linkSessaoPadrao:n.linkSessaoPadrao||'', chavePix:n.chavePix||'' })
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
      const dados = { ...form, horarios }
      if (logo !== undefined) dados.logo = logo
      if (tem('corPropria') && cor !== undefined) dados.corPrimaria = cor
      const r = await api.put('/negocios/meu', dados)
      atualizarNegocio(r.data)
      toast.success(t('ct.cfg.ok'))
    } catch { toast.error(t('ct.cfg.erro')) }
    finally { setGuardando(false) }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold mb-6">{t('ct.cfg.titulo')}</h1>
      <form onSubmit={guardar} className="space-y-5">
        {/* Dados do negócio */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">{t('ct.cfg.dadosNeg')}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">{t('ct.cfg.nomeNeg')}</label>
              <input className="input" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></div>
            <div><label className="label">{t('ct.cfg.telefone')}</label>
              <input className="input" value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/></div>
            <div><label className="label">{t('ct.cfg.endereco')}</label>
              <input className="input" placeholder={t('ct.cfg.enderecoEx')} value={form.endereco}
                onChange={e=>setForm({...form,endereco:e.target.value})}/></div>
            <div><label className="label">{t('ct.cfg.cidade')}</label>
              <input className="input" placeholder={t('ct.cfg.cidadeEx')} value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})}/>
            </div>
          </div>
        </div>

        {/* Internacional */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2"><Globe size={16} className="text-brand-600" /> {t('ct.cfg.internacional')}</h2>
          <p className="text-xs text-slate-400 mb-4">{t('ct.cfg.intSub')}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">{t('ct.cfg.fuso')}</label>
              <select className="input" value={form.fusoHorario} onChange={e=>setForm({...form,fusoHorario:e.target.value})}>
                {[...new Set([form.fusoHorario, ...listaDeFusos()])].map(f=><option key={f} value={f}>{f.replace(/_/g,' ')}</option>)}
              </select>
              {fusoDoNavegador() && fusoDoNavegador() !== form.fusoHorario && (
                <button type="button" className="text-xs text-brand-600 underline mt-1" onClick={()=>setForm({...form,fusoHorario:fusoDoNavegador()})}>{t('ct.cfg.usarFuso', { fuso: fusoDoNavegador() })}</button>
              )}
            </div>
            <div><label className="label">{t('ct.cfg.moeda')}</label>
              <select className="input" value={form.moeda} onChange={e=>setForm({...form,moeda:e.target.value})}>
                {MOEDAS.map(m=><option key={m.codigo} value={m.codigo}>{m.codigo} — {m.nome}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">{t('ct.cfg.moedaAjuda')}</p>
            </div>
            <div><label className="label">{t('ct.cfg.idioma')}</label>
              <select className="input" value={form.idioma} onChange={e=>setForm({...form,idioma:e.target.value})}>
                {IDIOMAS.map(i=><option key={i.codigo} value={i.codigo}>{i.nome}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">{t('ct.cfg.idiomaAjuda')}</p>
            </div>
            <div><label className="label">{t('ct.cfg.linkOnline')}</label>
              <input className="input" type="url" placeholder="https://meet.google.com/..." value={form.linkSessaoPadrao} onChange={e=>setForm({...form,linkSessaoPadrao:e.target.value})}/>
              <p className="text-xs text-slate-400 mt-1">{t('ct.cfg.linkAjuda')}</p>
            </div>
            {form.moeda === 'BRL' && (
              <div className="md:col-span-2"><label className="label">{t('ct.cfg.pix')}</label>
                <input className="input" placeholder={t('ct.cfg.pixEx')} value={form.chavePix} onChange={e=>setForm({...form,chavePix:e.target.value})}/>
                <p className="text-xs text-slate-400 mt-1">{t('ct.cfg.pixAjuda')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Aparência da página de marcação */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-1">{t('ct.cfg.aparencia')}</h2>
          <p className="text-xs text-slate-400 mb-4">{t('ct.cfg.aparenciaSub')}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">{t('ct.cfg.logotipo')}</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-300">
                  {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={20} />}
                </div>
                <label className="btn-ghost cursor-pointer">
                  {logo ? t('ct.cfg.mudar') : t('ct.cfg.escolherImg')}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return
                    try { setLogo(await reduzirImagem(f, 256)) } catch { toast.error(t('ct.cfg.erroImg')) }
                  }} />
                </label>
                {logo && <button type="button" className="text-xs text-slate-400 hover:text-red-500" onClick={() => setLogo(null)}>{t('ct.cfg.remover')}</button>}
              </div>
              {!tem('logoPagina') && (
                <p className="text-xs text-amber-700 mt-2 flex items-center gap-1"><Lock size={11}/> {t('ct.cfg.logoLock')} <Link to="/faturacao" className="underline">{t('ct.cfg.planoProf')}</Link>.</p>
              )}
            </div>
            <div>
              <label className="label">{t('ct.cfg.corPagina')}</label>
              {tem('corPropria') ? (
                <div className="flex items-center gap-3">
                  <input type="color" value={cor || '#df7d85'} onChange={e => setCor(e.target.value)} className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
                  <span className="text-sm text-slate-500 font-mono">{cor || t('ct.cfg.corAgenda')}</span>
                  {cor && <button type="button" className="text-xs text-slate-400 hover:text-red-500" onClick={() => setCor('')}>{t('ct.cfg.repor')}</button>}
                </div>
              ) : (
                <p className="text-xs text-amber-700 flex items-center gap-1"><Lock size={11}/> {t('ct.cfg.corLock')} <Link to="/faturacao" className="underline">{t('ct.cfg.planoPremium')}</Link>.</p>
              )}
            </div>
          </div>
        </div>

        {/* Pagamentos */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-1">{t('ct.cfg.pagamentos')}</h2>
          <p className="text-xs text-slate-400 mb-4">{t('ct.cfg.pagSub')}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('ct.cfg.iban')}</label>
              <input className="input font-mono text-sm" placeholder="AO06.0000.0000.0000.0000.0000.0"
                value={form.ibanBancario} onChange={e=>setForm({...form,ibanBancario:e.target.value})}/>
              <p className="text-xs text-slate-400 mt-1">{t('ct.cfg.ibanAjuda')}</p>
            </div>
            <div>
              <label className="label">{t('ct.cfg.express')}</label>
              <input className="input" placeholder={t('ct.cfg.expressEx')}
                value={form.merchantExpress} onChange={e=>setForm({...form,merchantExpress:e.target.value})}/>
              <p className="text-xs text-slate-400 mt-1">{t('ct.cfg.expressAjuda')}</p>
            </div>
          </div>
        </div>

        {/* Horários */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">{t('ct.cfg.horarios')}</h2>
          <div className="space-y-2">
            {horarios.map((h, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-8 text-sm font-medium text-slate-500">{t(DIAS[i])}</span>
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
                  <span className="text-sm text-slate-400 italic">{t('ct.cfg.fechado')}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center gap-2 px-6" disabled={guardando}>
          <Save size={16}/> {guardando ? t('ct.cfg.guardando') : t('ct.cfg.guardar')}
        </button>
      </form>
    </div>
  )
}
