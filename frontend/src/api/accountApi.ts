import api from './axios'
import type { Account, CreateAccountRequest } from '@/types'

export const accountApi = {
  getMyAccount: () =>
    api.get<Account>('/accounts/me').then(r => r.data),

  getAccount: (id: string) =>
    api.get<Account>(`/accounts/${id}`).then(r => r.data),

  getAccountByNumber: (accountNumber: string) =>
    api.get<Account>(`/accounts/by-number/${accountNumber}`).then(r => r.data),

  getBalance: (id: string) =>
    api.get<{ balance: number }>(`/accounts/${id}/balance`).then(r => r.data),

  createAccount: (data: CreateAccountRequest) =>
    api.post<Account>('/accounts', data).then(r => r.data),

  updateLimits: (id: string, dailyLimit: number) =>
    api.put<Account>(`/accounts/${id}/limits`, { dailyLimit }).then(r => r.data),

  freezeAccount: (id: string, reason: string) =>
    api.post<Account>(`/accounts/${id}/freeze`, null, { params: { reason } }).then(r => r.data),

  unfreezeAccount: (id: string) =>
    api.post<Account>(`/accounts/${id}/unfreeze`).then(r => r.data),
}
