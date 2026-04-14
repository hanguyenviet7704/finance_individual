import { api } from './axios'

export const stockApi = {
  getMarkets: async () => {
    const res = await api.get('/stocks')
    return res.data
  },
  getMyPortfolio: async () => {
    const res = await api.get('/stocks/portfolios/me')
    return res.data
  },
  placeOrder: async (req: { tickerSymbol: string, orderType: string, quantity: number, priceType: string }) => {
    const res = await api.post('/stocks/orders', req)
    return res.data
  }
}
