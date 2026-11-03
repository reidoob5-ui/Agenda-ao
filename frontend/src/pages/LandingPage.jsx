import { Link } from 'react-router-dom'
import { DepoimentosRotativos } from '../components/Depoimentos'
import AssinaturaAda from '../components/AssinaturaAda'
import { CalendarCheck, Bell, CreditCard, BarChart2, Smartphone, Star, ArrowRight, Check } from 'lucide-react'

const planos = [
  { nome: 'Básico', preco: 'Grátis', profissionais: '1 profissional', cor: 'border-slate-200', popular: false,
    features: ['1 profissional', '50 marcações/mês', 'Página de marcação com QR code', 'Botão de WhatsApp manual', 'Lista simples de clientes'] },
  { nome: 'Profissional', preco: '8.000', profissionais: 'Até 5 profissionais', cor: 'border-brand-500', popular: true,
    features: ['Tudo do Básico', 'Até 5 profissionais', 'Marcações ilimitadas', 'Lembretes por email', 'Ficha e histórico do cliente (CRM)', 'Relatórios financeiros mensais', 'O teu logotipo na página'] },
  { nome: 'Premium', preco: '19.000', profissionais: 'Ilimitado', cor: 'border-slate-200', popular: false,
    features: ['Tudo do Profissional', 'Profissionais ilimitados', 'WhatsApp automático', 'Pontos de fidelidade', 'Relatórios avançados', 'Lista de espera', 'Cor própria, sem marca AgendaAO', 'Suporte prioritário'] },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">AgendaAO</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#funcionalidades" className="hover:text-slate-900 transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-slate-900 transition-colors">Preços</a>
            <Link to="/depoimentos" className="hover:text-slate-900 transition-colors">Depoimentos</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Entrar</Link>
            <Link to="/criar" className="btn-primary">Começar grátis →</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
          Feito para Angola · Paga com Multicaixa Express
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Agendamentos online<br />
          <span className="text-brand-600">para o teu negócio</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Clientes marcam 24h/dia pelo telemóvel. Tu geres tudo num só painel.<br />
          Gestão completa de serviços, profissionais e receita.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/criar" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            Criar conta grátis <ArrowRight size={18} />
          </Link>
          <Link to="/b/demo" className="btn-ghost text-base px-8 py-3">
            Ver demonstração
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-4">Sem cartão de crédito · Começa hoje</p>
      </section>

      {/* Depoimentos reais, um de cada vez */}
      <DepoimentosRotativos />

      {/* Funcionalidades */}
      <section id="funcionalidades" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center mb-2">Tudo que precisas</h2>
          <p className="text-slate-500 text-center mb-12">Construído para prestadores de serviços e negócios angolanos</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: CalendarCheck, title: 'Agenda online', desc: 'Os teus clientes marcam pelo link. Tu vês tudo no painel.', cor: 'text-brand-600 bg-brand-50' },
              { icon: Bell, title: 'Lembretes automáticos', desc: 'Email (Profissional) e WhatsApp (Premium) 24h e 2h antes, para o cliente não faltar.', cor: 'text-green-600 bg-green-50' },
              { icon: CreditCard, title: 'QR code para clientes', desc: 'Cola o cartaz no balcão. O cliente aponta o telemóvel e marca em segundos.', cor: 'text-blue-600 bg-blue-50' },
              { icon: BarChart2, title: 'Relatórios em Kz', desc: 'Receita, serviços mais vendidos e profissional mais rentável.', cor: 'text-purple-600 bg-purple-50' },
              { icon: Smartphone, title: 'Funciona como app', desc: 'PWA — instala no telemóvel sem precisar da Play Store.', cor: 'text-amber-600 bg-amber-50' },
              { icon: Star, title: 'Fidelidade de clientes', desc: 'No Premium: pontos por visita e lista de clientes que deixaram de voltar.', cor: 'text-rose-600 bg-rose-50' },
            ].map(({ icon: Icon, title, desc, cor }) => (
              <div key={title} className="card p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${cor}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center mb-2">Preços simples em Kwanzas</h2>
          <p className="text-slate-500 text-center mb-12">Paga com Multicaixa Express ou transferência bancária</p>
          <div className="grid md:grid-cols-3 gap-6">
            {planos.map((p) => (
              <div key={p.nome} className={`card p-7 relative ${p.popular ? 'border-2 border-brand-500 shadow-soft' : ''}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Mais popular
                  </span>
                )}
                <p className="font-display font-bold text-slate-800 text-lg mb-1">{p.nome}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-3xl font-bold text-slate-900">{p.preco}</span>
                  {p.preco !== 'Grátis' && <span className="text-slate-400 text-sm">Kz/mês</span>}
                </div>
                <p className="text-xs text-slate-400 mb-6">{p.profissionais}</p>
                <Link to="/criar" className={`block text-center py-2.5 rounded-xl text-sm font-semibold mb-6 transition-all
                  ${p.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  Começar agora
                </Link>
                <ul className="space-y-2.5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Check size={14} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Pronto para modernizar o teu negócio?
          </h2>
          <p className="text-brand-100 mb-8">Cria a tua conta hoje e começa a receber agendamentos online.</p>
          <Link to="/criar" className="bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all inline-flex items-center gap-2">
            Criar conta grátis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white">
            <CalendarCheck size={16} />
            <span className="font-display font-bold">AgendaAO</span>
          </div>
          <AssinaturaAda fundo="escuro" comEmail />
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Ada Lovelace Technologies · Luanda, Angola</p>
        </div>
      </footer>
    </div>
  )
}
