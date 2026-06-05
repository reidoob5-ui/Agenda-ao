import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

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
          const { data } = await api.post('/auth/login', { email, senha })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ token: data.token, usuario: data.usuario, negocio: data.negocio, carregando: false })
          return { sucesso: true }
        } catch (err) {
          set({ carregando: false })
          return { sucesso: false, erro: err.response?.data?.erro || 'Erro ao fazer login' }
        }
      },

      registar: async (dados) => {
        set({ carregando: true })
        try {
          const { data } = await api.post('/auth/registar', dados)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ token: data.token, usuario: data.usuario, negocio: data.negocio, carregando: false })
          return { sucesso: true }
        } catch (err) {
          set({ carregando: false })
          return { sucesso: false, erro: err.response?.data?.erro || 'Erro ao criar conta' }
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
