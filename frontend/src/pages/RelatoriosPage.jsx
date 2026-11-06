import { useEffect, useState } from 'react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'
import { dfLocale } from '../utils/dfLocale'
import { useT, traduzir } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { linkWhatsApp } from '../utils/whatsapp'
import { usePlano } from '../utils/planos'
import Bloqueado from '../components/Bloqueado'
import { fmtDinheiro } from '../utils/moeda'

function fmtKz(v){return fmtDinheiro(v)}

// Premium: ultimos 90 dias — por profissional, horas de pico, clientes que nao voltam
function RelatorioAvancado() {
  const { t, idioma } = useT()
  const negocio = useAuthStore(s => s.negocio)
  const idiomaNegocio = String(negocio?.idioma || idioma).slice(0, 2).toLowerCase()
  const [d, setD] = useState(null)
  useEffect(() => { api.get('/relatorios/avancado').then(r => setD(r.data)).catch(() => setD(false)) }, [])
  if (d === null) return <div className="card p-6 mt-4 text-sm text-slate-400">{t('gs.rel.avCarregando')}</div>
  if (d === false) return <div className="card p-6 mt-4 text-sm text-red-500">{t('gs.rel.avErro')}</div>
  const profs = Object.entries(d.porProfissional).sort((a, b) => b[1].receita - a[1].receita)
  const maxH = Math.max(1, ...d.horasPico.map(h => h.total))
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display font-bold text-lg">{t('gs.rel.avTitulo')}</h2>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">PREMIUM</span>
        <span className="text-xs text-slate-400">{t('gs.rel.ultimosDias', { dias: d.dias })}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          [t('gs.rel.ticketMedio'), fmtKz(d.ticketMedio)],
          [t('gs.rel.visitasConcluidas'), d.concluidos],
          [t('gs.rel.cancelamentos'), `${d.taxaCancelamento}%`],
          [t('gs.rel.faltas'), `${d.taxaFaltas}%`],
        ].map(([l, v]) => (
          <div key={l} className="card p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{l}</p>
            <p className="font-display font-bold text-xl text-slate-900 mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">{t('gs.rel.receitaProf')}</h3>
          {profs.length === 0 ? <p className="text-sm text-slate-400">{t('gs.rel.semDados')}</p> : profs.map(([nome, v]) => (
            <div key={nome} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-slate-700">{nome} <span className="text-xs text-slate-400">({v.count})</span></span>
              <span className="font-semibold text-slate-800">{fmtKz(v.receita)}</span>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">{t('gs.rel.horasProcura')}</h3>
          {d.horasPico.length === 0 ? <p className="text-sm text-slate-400">{t('gs.rel.semDados')}</p> : d.horasPico.map(h => (
            <div key={h.hora} className="flex items-center gap-3 py-1">
              <span className="w-12 text-sm text-slate-600">{String(h.hora).padStart(2, '0')}:00</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(h.total / maxH) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-400 w-6 text-right">{h.total}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-1 text-sm">{t('gs.rel.naoVoltam')}</h3>
        <p className="text-xs text-slate-400 mb-3">{t('gs.rel.naoVoltamDesc')}</p>
        {d.clientesInativos.length === 0 ? <p className="text-sm text-slate-400">{t('gs.rel.nenhumInativo')}</p> : d.clientesInativos.map(c => {
          const link = linkWhatsApp(c.telefone, traduzir(idiomaNegocio, 'gs.rel.msgInativo', { nome: c.nome.split(' ')[0] }))
          return (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{c.nome}</p>
                <p className="text-xs text-slate-400">{t('gs.rel.visitasUltima', { visitas: c.visitas, data: format(new Date(c.ultimaVisita), 'dd/MM/yyyy') })}</p>
              </div>
              {link && <a href={link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">{t('gs.rel.whatsapp')}</a>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RelatoriosPage() {
  const { t, idioma } = useT()
  const { tem } = usePlano()
  const agora = new Date()
  const [ano, setAno] = useState(agora.getFullYear())
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [dados, setDados] = useState(null)
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    if (!tem('relatoriosFinanceiros')) return
    Promise.all([
      api.get(`/relatorios/mensal?ano=${ano}&mes=${mes}`),
      api.get('/relatorios/dashboard')
    ]).then(([m, d]) => { setDados(m.data); setDashboard(d.data) })
  }, [ano, mes])

  const semanas = dados ? Object.entries(dados.porSemana).map(([s,v]) => ({ semana: t('gs.rel.sem', { n: s }), receita: v })) : []
  const servicos = dados ? Object.entries(dados.porServico).sort((a,b)=>b[1].receita-a[1].receita).slice(0,5) : []

  if (!tem('relatoriosFinanceiros')) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="font-display text-2xl font-bold mb-6">{t('gs.rel.titulo')}</h1>
        <Bloqueado planoNecessario="PROFISSIONAL"
          titulo={t('gs.rel.bloqTitulo')}
          texto={t('gs.rel.bloqTexto')} />
      </div>
    )
  }

  const meses = Array.from({length:12},(_,i)=>({num:i+1,nome:format(new Date(2025,i,1),'MMMM',{locale:dfLocale(idioma)})}))

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">{t('gs.rel.titulo')}</h1>
        <div className="flex items-center gap-3">
          <select className="input w-36" value={mes} onChange={e=>setMes(parseInt(e.target.value))}>
            {meses.map(m=><option key={m.num} value={m.num} className="capitalize">{m.nome}</option>)}
          </select>
          <select className="input w-24" value={ano} onChange={e=>setAno(parseInt(e.target.value))}>
            {[2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs do mês */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:t('gs.rel.kpiReceita'), valor: fmtKz(dados?.receita), destaque:true },
          { label:t('gs.rel.kpiConcluidos'), valor: dados?.total || 0 },
          { label:t('gs.rel.kpiNovos'), valor: dashboard?.novosClientes || 0 },
        ].map(({label,valor,destaque})=>(
          <div key={label} className={`card p-5 ${destaque?'border-brand-200':''}`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`font-display font-bold ${destaque?'text-brand-600 text-3xl':'text-slate-900 text-2xl'}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Gráfico receita por semana */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-slate-800 mb-4">{t('gs.rel.receitaSemana')}</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={semanas} barSize={32}>
            <XAxis dataKey="semana" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>v>=1000?`${v/1000}k`:v} tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip formatter={v=>fmtKz(v)} labelStyle={{fontSize:12}} contentStyle={{borderRadius:12,border:'1px solid #f1f5f9',fontSize:13}}/>
            <Bar dataKey="receita" radius={[6,6,0,0]}>
              {semanas.map((_,i)=><Cell key={i} fill={i===semanas.length-1?'#ea580c':'#fed7aa'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Serviços mais vendidos */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">{t('gs.rel.topServicos')}</h2>
        {servicos.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">{t('gs.rel.semDadosPeriodo')}</p>
        ) : (
          <div className="space-y-3">
            {servicos.map(([nome,{count,receita}],i)=>(
              <div key={nome} className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-300 w-4">{i+1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{nome}</span>
                    <span className="text-sm font-semibold text-slate-800">{fmtKz(receita)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{width:`${Math.min((receita/(servicos[0][1].receita||1))*100,100)}%`}}/>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t('gs.rel.vendas', { n: count })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tem('relatoriosAvancados')
        ? <RelatorioAvancado />
        : <div className="mt-6"><Bloqueado compacto planoNecessario="PREMIUM"
            titulo={t('gs.rel.avBloqTitulo')}
            texto={t('gs.rel.avBloqTexto')} /></div>}
    </div>
  )
}
