import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

// O servidor gratuito do Render "adormece" e pode levar ate ~1 minuto a acordar
const ESPERA_AUTH = { timeout: 60000 }

// Transforma qualquer falha numa mensagem que o utilizador consegue perceber
function mensagemErro(err, padrao) {
  if (err.code === 'ECONNABORTED') return 'O servidor demorou a responder. Espera uns segundos e tenta outra vez.'
  if (!err.response) return 'Sem ligação ao servidor. Verifica a internet e tenta outra vez.'
  const d = err.response.data
  const detalhe = d?.erro || d?.erros?.[0]?.msg || d?.mensagem
  return detalhe ? detalhe : `${padrao} (código ${err.response.status})`
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      negocio: null,
      carregando: false,

      login: async (email, senha) => {
        set({ carregando: true })
        try {
          const { data } = await api.post('/auth/login', { email, senha }, ESPERA_AUTH)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ token: data.token, usuario: data.usuario, negocio: data.negocio, carregando: false })
          return { sucesso: true }
        } catch (err) {
          set({ carregando: false })
          return { sucesso: false, erro: mensagemErro(err, 'Erro ao fazer login') }
        }
      },

      registar: async (dados) => {
        set({ carregando: true })
        try {
          const { data } = await api.post('/auth/registar', dados, ESPERA_AUTH)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ token: data.token, usuario: data.usuario, negocio: data.negocio, carregando: false })
          return { sucesso: true }
        } catch (err) {
          set({ carregando: false })
          return { sucesso: false, erro: mensagemErro(err, 'Erro ao criar conta') }
        }
      },

      googleLogin: async (credential) => {
        set({ carregando: true })
        try {
          const { data } = await api.post('/auth/google-login', { credential }, ESPERA_AUTH)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ token: data.token, usuario: data.usuario, negocio: data.negocio, carregando: false })
          return { sucesso: true }
        } catch (err) {
          set({ carregando: false })
          return { sucesso: false, codigo: err.response?.data?.codigo, erro: mensagemErro(err, 'Erro ao entrar com Google') }
        }
      },

      googleRegistar: async (credential, dados) => {
        set({ carregando: true })
        try {
          const { data } = await api.post('/auth/google-registar', { credential, ...dados }, ESPERA_AUTH)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ token: data.token, usuario: data.usuario, negocio: data.negocio, carregando: false })
          return { sucesso: true }
        } catch (err) {
          set({ carregando: false })
          return { sucesso: false, codigo: err.response?.data?.codigo, erro: mensagemErro(err, 'Erro ao criar conta com Google') }
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ token: null, usuario: null, negocio: null })
      },

      atualizarNegocio: (negocio) => set({ negocio }),

      inicializar: () => {
        const { token } = get()
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    }),
    { name: 'agendaao-auth', partialize: (s) => ({ token: s.token, usuario: s.usuario, negocio: s.negocio }) }
  )
)
