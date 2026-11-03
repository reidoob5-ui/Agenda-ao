import axios from 'axios'

// Em desenvolvimento: usa o proxy do Vite (/api -> localhost:4001)
// Em producao: usa a URL do backend no Render.com
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Sessão expirada: volta ao login. Mas NÃO em falhas do próprio login/registo,
    // senão a página recarrega e o erro nunca chega a ser mostrado.
    const url = err.config?.url || ''
    const ehAutenticacao = /\/auth\/(login|registar|google)/.test(url)
    if (err.response?.status === 401 && !ehAutenticacao) {
      localStorage.removeItem('agendaao-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
