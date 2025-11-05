import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import DocumentPreviewModal from '../components/DocumentPreviewModal.jsx'

export default function Payments() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('') // '', 'pending', 'completed'
  const toast = useToast()
  const { confirm } = useConfirm()
  const [mode, setMode] = useState('all') // 'all' | 'unpaid'
  const [month, setMonth] = useState('')  // YYYY-MM
  const [preview, setPreview] = useState({ open: false, url: '', title: '' })

  const load = async () => {
    if (mode === 'unpaid') {
      if (!month) return setItems([])
      try {
        const { data } = await api.get(`/payments/unpaid?month=${month}`)
        // render as rows with user fields; adapt shape
        const rows = (data.users || []).map(u => ({ _id: u._id, user: u, month, amount: u.fixedAmount, status: 'unpaid' }))
        setItems(rows)
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load unpaid list')
      }
    } else {
      const qs = status ? `?status=${status}` : ''
      const { data } = await api.get(`/payments${qs}`)
      setItems(data)
    }
  }
  useEffect(() => { load() }, [status, mode, month])

  const mark = async (id, nextStatus) => {
    const ok = await confirm({ title: 'Update status', message: `Mark payment as "${nextStatus}"?`, confirmText: 'Update' })
    if (!ok) return
    try {
      await api.patch(`/payments/${id}/mark`, { status: nextStatus })
      await load()
      toast.success('Payment status updated')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Payments</h2>
          <div className="flex items-center gap-2">
            <select className="border rounded px-3 py-2" value={mode} onChange={e=>setMode(e.target.value)}>
              <option value="all">All payments</option>
              <option value="unpaid">Unpaid users</option>
            </select>
            {mode === 'all' ? (
              <select className="border rounded px-3 py-2" value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            ) : (
              <Input type="month" className="w-[200px]" value={month} onChange={e=>setMonth(e.target.value)} />
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <DocumentPreviewModal open={preview.open} url={preview.url} title={preview.title} onClose={()=>setPreview({ open:false, url:'', title:'' })} />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">User</th>
              <th>Month</th>
              <th>Amount</th>
              {mode === 'all' && (<><th>Status</th><th className="text-right">Proof</th><th className="text-right">Action</th></>)}
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p._id} className="border-t">
                <td className="py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.user?.avatarUrl ? (
                      (() => {
                        const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '')
                        const src = `${apiBase}${p.user.avatarUrl}`
                        return <img src={src} alt={p.user?.name||''} className="w-8 h-8 rounded-full object-cover" />
                      })()
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.user?.name || '-'}</div>
                      <div className="text-xs text-gray-500 truncate">@{p.user?.username || 'unknown'}{p.user?.email ? ` • ${p.user.email}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td>{p.month}</td>
                <td>₹{p.amount}</td>
                {mode === 'all' ? (
                  <>
                    <td className="align-middle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${p.status==='completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {p.status==='completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap align-middle">
                      {p.proofPath ? (
                        (() => {
                          const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '')
                          const href = `${apiBase}${p.proofPath}`
                          return (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100"
                              onClick={()=> setPreview({ open:true, url: href, title: `${p.user?.name || 'User'} • ${p.month}` })}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></svg>
                              View Document
                            </button>
                          )
                        })()
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap align-middle">
                      {p.status === 'pending' ? (
                        <Button variant="subtle" onClick={()=>mark(p._id, 'completed')}>Mark completed</Button>
                      ) : (
                        <Button variant="subtle" disabled>Completed</Button>
                      )}
                    </td>
                  </>
                ) : null}
              </tr>
            ))}
            {items.length===0 && (
              <tr><td className="py-3 text-gray-500" colSpan={mode==='all'?6:3}>{mode==='all'?'No payments':'No unpaid users for selected month'}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
