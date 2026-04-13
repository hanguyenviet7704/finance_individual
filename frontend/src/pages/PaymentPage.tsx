import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ArrowUpRight, ArrowDownLeft, Search, Filter,
  CheckCircle2, XCircle, Clock, Send
} from 'lucide-react'
import { paymentApi } from '@/api/paymentApi'
import { accountApi } from '@/api/accountApi'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatVND, formatDateTime, txStatusColor, shortId } from '@/utils/format'
import type { Transaction, TransactionStatus } from '@/types'

const transferSchema = z.object({
  toAccountId:  z.string().min(5, 'Tài khoản không hợp lệ'),
  amount:       z.coerce.number().min(1000, 'Tối thiểu 1.000 VND'),
  description:  z.string().optional(),
  category:     z.string().optional(),
})
type TransferForm = z.infer<typeof transferSchema>

const CATEGORIES = ['Ăn uống', 'Di chuyển', 'Hóa đơn', 'Mua sắm', 'Giải trí', 'Lương', 'Khác']

function StatusIcon({ status }: { status: TransactionStatus }) {
  const map = {
    COMPLETED:  <CheckCircle2 className="w-4 h-4 text-green-500" />,
    PENDING:    <Clock className="w-4 h-4 text-yellow-500" />,
    PROCESSING: <Clock className="w-4 h-4 text-blue-500" />,
    FAILED:     <XCircle className="w-4 h-4 text-red-500" />,
    CANCELLED:  <XCircle className="w-4 h-4 text-gray-400" />,
    REVERSED:   <XCircle className="w-4 h-4 text-orange-400" />,
  }
  return map[status] ?? null
}

export function PaymentPage() {
  const qc = useQueryClient()
  const [transferModal, setTransferModal]   = useState(false)
  const [otpModal, setOtpModal]             = useState(false)
  const [otpInput, setOtpInput]             = useState('')
  const [pendingTxId, setPendingTxId]       = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')

  const { data: account } = useQuery({
    queryKey: ['my-account'],
    queryFn: accountApi.getMyAccount,
  })

  const { data: history, isLoading } = useQuery({
    queryKey: ['tx-history', account?.id, page],
    queryFn: () => paymentApi.getHistory(account!.id, page, 10),
    enabled: !!account?.id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
  })

  const transferMutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      let finalToAccountId = data.toAccountId;
      // Nếu không phải UUID (vd: FIN123...), thử resolve tài khoản
      if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(data.toAccountId)) {
        try {
          const acc = await accountApi.getAccountByNumber(data.toAccountId);
          finalToAccountId = acc.id;
        } catch (err: any) {
          throw new Error('Số tài khoản không tồn tại!');
        }
      }
      return paymentApi.transfer({
        fromAccountId: account!.id,
        ...data,
        toAccountId: finalToAccountId,
      });
    },
    onSuccess: (tx) => {
      qc.invalidateQueries({ queryKey: ['tx-history'] })
      qc.invalidateQueries({ queryKey: ['my-account'] })
      reset()
      setTransferModal(false)
      if (tx.otpRequired) {
        setPendingTxId(tx.id)
        setOtpModal(true)
        toast('Giao dịch lớn — nhập OTP được gửi qua SMS.', { icon: '📱' })
      } else {
        toast.success('Giao dịch đã được khởi tạo!')
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const otpMutation = useMutation({
    mutationFn: () => paymentApi.confirmOtp(pendingTxId!, otpInput),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tx-history'] })
      setOtpModal(false)
      setOtpInput('')
      toast.success('OTP xác nhận thành công!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtered = history?.content.filter(tx => {
    const matchSearch = !search || tx.referenceNo.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCategory === 'ALL' || tx.category === filterCategory
    return matchSearch && matchCat
  }) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch & Chuyển tiền</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi, phân loại chi tiêu và giao dịch</p>
        </div>
        <Button onClick={() => setTransferModal(true)}>
          <Send className="w-4 h-4" /> Tạo giao dịch
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng GD', value: history?.totalElements ?? 0, suffix: 'giao dịch' },
          { label: 'Hoàn thành', value: history?.content.filter(t => t.status === 'COMPLETED').length ?? 0, suffix: 'thành công' },
          { label: 'Đang xử lý', value: history?.content.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length ?? 0, suffix: 'chờ xử lý' },
        ].map(({ label, value, suffix }) => (
          <Card key={label} className="text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
            <p className="text-xs text-gray-400">{suffix}</p>
          </Card>
        ))}
      </div>

      {/* History table */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tìm theo mã giao dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Tất cả danh mục</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button variant="outline" size="sm">
            <Filter className="w-3.5 h-3.5" /> Lọc
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-50">
                  <th className="px-4 py-3 text-left">Mã GD</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Mô tả</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      Không có giao dịch nào
                    </td>
                  </tr>
                ) : filtered.map((tx) => {
                  const isDebit = tx.fromAccountId === account?.id
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600">{shortId(tx.id)}</span>
                        <p className="text-xs text-gray-400">{tx.referenceNo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isDebit
                            ? <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                            : <ArrowDownLeft className="w-3.5 h-3.5 text-green-500" />
                          }
                          <span className="text-xs text-gray-600">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">
                        {tx.description || '—'}
                        {tx.category && (
                          <span className="block mt-1 text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded w-max">
                            {tx.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold text-sm ${isDebit ? 'text-red-500' : 'text-green-600'}`}>
                          {isDebit ? '-' : '+'}{formatVND(tx.amount)}
                        </span>
                        {tx.fee > 0 && <p className="text-xs text-gray-400">Phí: {formatVND(tx.fee)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={tx.status} />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${txStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {history && history.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Trang {page + 1} / {history.totalPages} — {history.totalElements} giao dịch
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={history.first} onClick={() => setPage(p => p - 1)}>
                    Trước
                  </Button>
                  <Button size="sm" variant="outline" disabled={history.last} onClick={() => setPage(p => p + 1)}>
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Transfer modal */}
      <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Chuyển tiền">
        <form onSubmit={handleSubmit((d) => transferMutation.mutate(d))} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">Số dư khả dụng: <span className="font-semibold">{formatVND(account?.availableBalance ?? 0)}</span></p>
          </div>
          <Input
            label="ID hoặc Số tài khoản nhận"
            placeholder="VD: FIN... hoặc UUID"
            error={errors.toAccountId?.message}
            {...register('toAccountId')}
          />
          <Input
            label="Số tiền (VND)"
            type="number"
            placeholder="1000000"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Nội dung chuyển tiền"
            placeholder="Chuyển tiền cho..."
            {...register('description')}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Phân loại chi tiêu</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('category')}
            >
              <option value="">Không phân loại</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setTransferModal(false)}>
              Hủy
            </Button>
            <Button className="flex-1" type="submit" loading={transferMutation.isPending}>
              Xác nhận chuyển
            </Button>
          </div>
        </form>
      </Modal>

      {/* OTP modal */}
      <Modal open={otpModal} onClose={() => setOtpModal(false)} title="Xác nhận OTP" size="sm">
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Nhập mã OTP 6 số được gửi đến số điện thoại của bạn (hết hạn sau 5 phút)
          </p>
          <input
            type="text"
            maxLength={6}
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl font-mono tracking-[0.5em] border-2 border-gray-300 rounded-xl py-3 focus:outline-none focus:border-primary-500"
            placeholder="------"
          />
          <Button
            className="w-full"
            loading={otpMutation.isPending}
            disabled={otpInput.length !== 6}
            onClick={() => otpMutation.mutate()}
          >
            Xác nhận
          </Button>
        </div>
      </Modal>
    </div>
  )
}
