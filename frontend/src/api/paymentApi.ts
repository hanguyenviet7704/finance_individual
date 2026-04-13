import api from './axios'
import type { Transaction, TransferRequest, PageResponse } from '@/types'

export const paymentApi = {
  transfer: (data: TransferRequest) =>
    api.post<Transaction>('/payments/transfer', data).then(r => r.data),

  getTransaction: (id: string) =>
    api.get<Transaction>(`/payments/${id}`).then(r => r.data),

  getHistory: (accountId: string, page = 0, size = 20) =>
    api.get<PageResponse<Transaction>>('/payments/history', {
      params: { accountId, page, size },
    }).then(r => r.data),

  confirmOtp: (id: string, otp: string) =>
    api.post<Transaction>(`/payments/${id}/confirm`, { otp }).then(r => r.data),

  cancelTransaction: (id: string) =>
    api.post<Transaction>(`/payments/${id}/cancel`).then(r => r.data),
}
