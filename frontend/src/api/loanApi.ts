import api from './axios'
import type { Loan, ApplyLoanRequest, PageResponse } from '@/types'

export const loanApi = {
  applyLoan: (accountId: string, data: ApplyLoanRequest) =>
    api.post<Loan>('/loans/apply', data, { params: { accountId } }).then(r => r.data),

  getLoan: (id: string) =>
    api.get<Loan>(`/loans/${id}`).then(r => r.data),

  getMyLoans: (page = 0, size = 10) =>
    api.get<PageResponse<Loan>>('/loans', { params: { page, size } }).then(r => r.data),

  getCreditScore: (userId: string) =>
    api.get<{ userId: string; creditScore: number }>(`/loans/score/${userId}`).then(r => r.data),
}
