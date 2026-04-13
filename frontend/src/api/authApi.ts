import api from './axios'
import type { AuthTokens, LoginRequest, RegisterRequest, RegisterResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthTokens>('/auth/login', data).then(r => r.data),

  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', data).then(r => r.data),

  logout: () =>
    api.post('/auth/logout').catch(() => {}),
}
