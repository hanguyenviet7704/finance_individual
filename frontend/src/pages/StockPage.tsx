import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { stockApi } from '@/api/stockApi'

export function StockPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'MARKET' | 'PORTFOLIO'>('MARKET')

  const { data: marketData, isLoading: isMarketLoading } = useQuery({
    queryKey: ['stocks', 'markets'],
    queryFn: stockApi.getMarkets,
    enabled: activeTab === 'MARKET',
    refetchInterval: 15000 // auto refresh every 15s
  })

  const { data: portfolioData, isLoading: isPortfolioLoading } = useQuery({
    queryKey: ['stocks', 'portfolio'],
    queryFn: stockApi.getMyPortfolio,
    enabled: activeTab === 'PORTFOLIO'
  })

  const orderMutation = useMutation({
    mutationFn: stockApi.placeOrder,
    onSuccess: () => {
      toast.success('Đặt lệnh thành công!')
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lệnh')
    }
  })

  const handleOrder = (tickerSymbol: string, orderType: string) => {
    const quantity = prompt(`Nhập khối lượng muốn ${orderType === 'BUY' ? 'mua' : 'bán'} cho mã ${tickerSymbol}:`)
    if (!quantity || isNaN(Number(quantity))) return

    orderMutation.mutate({
      tickerSymbol,
      orderType,
      quantity: Number(quantity),
      priceType: 'MP' // Market Price as default
    })
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Chứng khoán & Đầu tư</h1>
      
      <div className="flex gap-4 border-b border-gray-200">
        <button
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'MARKET' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('MARKET')}
        >
          Bảng giá
        </button>
        <button
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'PORTFOLIO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('PORTFOLIO')}
        >
          Danh mục (Portfolio)
        </button>
      </div>

      {activeTab === 'MARKET' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isMarketLoading ? (
            <div className="p-10 text-center text-gray-500">Đang tải bảng giá...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Mã</th>
                  <th className="px-6 py-4">Tên công ty</th>
                  <th className="px-6 py-4">Giá (VND)</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Giao dịch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marketData?.content?.map((stock: any) => (
                  <tr key={stock.tickerSymbol} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{stock.tickerSymbol}</td>
                    <td className="px-6 py-4 text-gray-600">{stock.companyName}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      {stock.currentPrice?.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stock.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {stock.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOrder(stock.tickerSymbol, 'BUY')}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
                          disabled={stock.status !== 'ACTIVE' || orderMutation.isPending}
                        >
                          MUA
                        </button>
                        <button
                          onClick={() => handleOrder(stock.tickerSymbol, 'SELL')}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                          disabled={stock.status !== 'ACTIVE' || orderMutation.isPending}
                        >
                          BÁN
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isPortfolioLoading ? (
            <div className="p-10 text-center text-gray-500">Đang tải danh mục...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Mã</th>
                  <th className="px-6 py-4">Khối lượng</th>
                  <th className="px-6 py-4">Giá vốn trung bình</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {portfolioData?.map((item: any) => (
                  <tr key={item.tickerSymbol} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{item.tickerSymbol}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-600">{item.averageBuyPrice?.toLocaleString('vi-VN')} VND</td>
                  </tr>
                ))}
                {(!portfolioData || portfolioData.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      Danh mục trống. Hãy mua cổ phiếu trên Bảng giá.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
