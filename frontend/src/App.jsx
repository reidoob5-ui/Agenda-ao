import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LandingPage    from './pages/LandingPage'

// Carrega cada pagina so quando e preciso. Se o ficheiro novo nao for encontrado (site atualizado entretanto), recarrega uma vez.
function pagina(importar) {
  return lazy(() =>
    importar().then(
      (m) => { try { sessionStorage.removeItem('aa-recarregou') } catch {} return m },
      (erro) => {
        let ja = false
        try { ja = !!sessionStorage.getItem('aa-recarregou'); sessionStorage.setItem('aa-recarregou', '1') } catch {}
        if (!ja) { window.location.reload(); return new Promise(() => {}) }
        throw erro
      }
    )
  )
}

const Layout = pagina(() => import('./components/layout/Layout'))
const RotaProtegida = pagina(() => import('./components/layout/RotaProtegida'))
const LoginPage = pagina(() => import('./pages/LoginPage'))
const RegistarPage = pagina(() => import('./pages/RegistarPage'))
const Dashboard = pagina(() => import('./pages/Dashboard'))
const AgendaPage = pagina(() => import('./pages/AgendaPage'))
const ClientesPage = pagina(() => import('./pages/ClientesPage'))
const ServicosPage = pagina(() => import('./pages/ServicosPage'))
const RelatoriosPage = pagina(() => import('./pages/RelatoriosPage'))
const ConfigPage = pagina(() => import('./pages/ConfigPage'))
const FaturacaoPage = pagina(() => import('./pages/FaturacaoPage'))
const BookingPage = pagina(() => import('./pages/BookingPage'))
const AdminPage = pagina(() => import('./pages/AdminPage'))
const ProfissionaisPage = pagina(() => import('./pages/ProfissionaisPage'))
const DepoimentosPage = pagina(() => import('./pages/DepoimentosPage'))
const AvaliarPage = pagina(() => import('./pages/AvaliarPage'))
const CartazPage = pagina(() => import('./pages/CartazPage'))
const ListaEsperaPage = pagina(() => import('./pages/ListaEsperaPage'))
const PagarPage = pagina(() => import('./pages/PagarPage'))
const LegalPage = pagina(() => import('./pages/LegalPage'))
const DemoPage = pagina(() => import('./pages/DemoPage'))
import PremiumMotion from './components/PremiumMotion'

// Enquanto uma pagina carrega (so se descarrega o que se usa) mostra o logotipo em vez de ecra branco
function Carregando() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fff7f4' }} role="status" aria-label="A carregar">
      <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid #f3d3d3', borderTopColor: '#cf5b6c', animation: 'boot-gira .8s linear infinite' }} />
    </div>
  )
}

export default function App() {
  const inicializar = useAuthStore(s => s.inicializar)
  useEffect(() => { inicializar() }, [])

  return (
    <>
      <PremiumMotion />
      <Suspense fallback={<Carregando />}>
      <Routes>
      {/* Publicas */}
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/criar"   element={<RegistarPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/b/demo" element={<Navigate to="/demo" replace />} />
      <Route path="/b/:slug" element={<BookingPage />} />
      <Route path="/depoimentos" element={<DepoimentosPage />} />
      <Route path="/termos" element={<LegalPage tipo="termos" />} />
      <Route path="/privacidade" element={<LegalPage tipo="privacidade" />} />

      {/* Painel Admin do Dono do Sistema — rota secreta, nao partilhar */}
      <Route path="/gestao-x7k3m9" element={<AdminPage />} />

      {/* Protegidas (requerem login) */}
      <Route element={<RotaProtegida />}>
        {/* Cartaz fora do Layout para imprimir sem o menu lateral */}
        <Route path="/cartaz" element={<CartazPage />} />
        <Route path="/pagar" element={<PagarPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/agenda"      element={<AgendaPage />} />
          <Route path="/clientes"    element={<ClientesPage />} />
          <Route path="/servicos"    element={<ServicosPage />} />
          <Route path="/profissionais" element={<ProfissionaisPage />} />
          <Route path="/relatorios"  element={<RelatoriosPage />} />
          <Route path="/config"      element={<ConfigPage />} />
          <Route path="/faturacao"   element={<FaturacaoPage />} />
          <Route path="/avaliar"     element={<AvaliarPage />} />
          <Route path="/lista-espera" element={<ListaEsperaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  )
}
