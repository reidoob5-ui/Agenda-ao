import { useEffect, useState } from 'react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Download } from 'lucide-react'

function fmtKz(v){return new Intl.NumberFormat('pt-AO',{style:'currency',currency:'AOA',minimumFractionDigits:0}).format(v||0)}

export default function RelatoriosPage() {
  const agora = new Date()
  const [ano, setAno] = useState(agora.getFullYear())
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [dados, setDados] = useState(null)
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/relatorios/mensal?ano=${ano}&mes=${mes}`),
      api.get('/relatorios/dashboard')
    ]).then(([m, d]) => { setDados(m.data); setDashboard(d.data) })
  }, [ano, mes])

  const semanas = dados ? Object.entries(dados.porSemana).map(([s,v]) => ({ semana: `Sem ${s}`, receita: v })) : []
  const servicos = dados ? Object.entries(dados.porServico).sort((a,b)=>b[1].receita-a[1].receita).slice(0,5) : []

  const meses = Array.from({length:12},(_,i)=>({num:i+1,nome:format(new Date(2025,i,1),'MMMM',{locale:pt})}))

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Relatórios</h1>
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
          { label:'Receita do mês', valor: fmtKz(dados?.receita), destaque:true },
          { label:'Agendamentos concluídos', valor: dados?.total || 0 },
          { label:'Clientes novos', valor: dashboard?.novosClientes || 0 },
        ].map(({label,valor,destaque})=>(
          <div key={label} className={`card p-5 ${destaque?'border-brand-200':''}`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`font-display font-bold ${destaque?'text-brand-600 text-3xl':'text-slate-900 text-2xl'}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Gráfico receita por semana */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-slate-800 mb-4">Receita por semana (Kz)</h2>
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
        <h2 className="font-semibold text-slate-800 mb-4">Serviços mais vendidos</h2>
        {servicos.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Sem dados para este período</p>
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
                  <p className="text-xs text-slate-400 mt-0.5">{count} vendas</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
