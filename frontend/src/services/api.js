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
    if (err.response?.status === 401) {
      localStorage.removeItem('agendaao-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
