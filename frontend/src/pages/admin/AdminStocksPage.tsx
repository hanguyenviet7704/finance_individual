import { useQuery } from '@tanstack/react-query'
import { stockApi } from '@/api/stockApi'

export function AdminStocksPage() {
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['stocks', 'admin', 'markets'],
    queryFn: stockApi.getMarkets
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Chứng khoán</h1>
        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Thêm Mã Cổ Phiếu Định Danh Mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Mã Cổ Phiếu</th>
                <th className="px-6 py-4">Tên Công Ty</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marketData?.content?.map((stock: any) => (
                <tr key={stock.tickerSymbol} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{stock.tickerSymbol}</td>
                  <td className="px-6 py-4 text-gray-600">{stock.companyName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      stock.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {stock.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      {stock.status === 'ACTIVE' ? '🔒 Tạm Khoá' : '🔓 Mở Lại'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
