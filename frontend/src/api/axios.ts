import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — tự động thêm Authorization header
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Thêm idempotency key cho POST payment
    if (config.method === 'post' && config.url?.includes('/payments/transfer')) {
      config.headers['Idempotency-Key'] = crypto.randomUUID()
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — xử lý 401 auto logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isLoginEndpoint = originalRequest.url?.includes('/auth/login')
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginEndpoint) {
      originalRequest._retry = true
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Có lỗi xảy ra. Vui lòng thử lại.'

    return Promise.reject(new Error(message))
  }
)

export default api
