import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
      }} />
    </BrowserRouter>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  // Quando uma versão nova do site assume o controlo, recarrega uma vez para a mostrar
  let jaRecarregou = false
  const tinhaControlador = !!navigator.serviceWorker.controller // false na primeira visita
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (jaRecarregou || !tinhaControlador) return
    jaRecarregou = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('🚀 Service Worker registado com sucesso:', reg.scope))
      .catch(err => console.error('❌ Erro ao registar Service Worker:', err));
  });
}
