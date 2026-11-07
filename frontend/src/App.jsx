import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import PremiumMotion from './components/PremiumMotion'

import Layout        from './components/layout/Layout'
import RotaProtegida from './components/layout/RotaProtegida'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegistarPage   from './pages/RegistarPage'
import Dashboard      from './pages/Dashboard'
import AgendaPage     from './pages/AgendaPage'
import ClientesPage   from './pages/ClientesPage'
import ServicosPage   from './pages/ServicosPage'
import RelatoriosPage from './pages/RelatoriosPage'
import ConfigPage     from './pages/ConfigPage'
import FaturacaoPage  from './pages/FaturacaoPage'
import BookingPage    from './pages/BookingPage'
import AdminPage      from './pages/AdminPage'
import ProfissionaisPage from './pages/ProfissionaisPage'
import DepoimentosPage from './pages/DepoimentosPage'
import AvaliarPage from './pages/AvaliarPage'
import CartazPage from './pages/CartazPage'
import ListaEsperaPage from './pages/ListaEsperaPage'
import PagarPage from './pages/PagarPage'
import LegalPage from './pages/LegalPage'

export default function App() {
  const inicializar = useAuthStore(s => s.inicializar)
  useEffect(() => { inicializar() }, [])

  return (
    <>
      <PremiumMotion />
      <Routes>
      {/* Publicas */}
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/criar"   element={<RegistarPage />} />
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
    </>
  )
}
