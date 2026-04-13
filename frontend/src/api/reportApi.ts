import api from './axios'
import type { StatementEntry, MonthlySummary, PageResponse } from '@/types'

export const reportApi = {
  getStatement: (accountId: string, from: string, to: string, page = 0, size = 50) =>
    api.get<PageResponse<StatementEntry>>('/reports/statement', {
      params: { accountId, from, to, page, size },
    }).then(r => r.data),

  getMonthlySummary: (accountId: string, year: number, month: number) =>
    api.get<MonthlySummary>('/reports/summary/monthly', {
      params: { accountId, year, month },
    }).then(r => r.data),
}
