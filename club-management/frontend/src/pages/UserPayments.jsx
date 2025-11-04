import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import { useAuth } from '../context/AuthContext.jsx'

export default function UserPayments() {
  const [history, setHistory] = useState([])
  const [msg, setMsg] = useState('')
  const [uploadingMonth, setUploadingMonth] = useState('')
  const [bulkFile, setBulkFile] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [fileByMonth, setFileByMonth] = useState({}) // key: YYYY-MM -> File|null
  const toast = useToast()
  const { confirm } = useConfirm()
  const { user } = useAuth()

  const load = async () => {
    setMsg('')
    try {
      const { data } = await api.get('/payments/me')
      setHistory(data)
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to load payments')
    }
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthKey = `${currentYear}-${String(now.getMonth()+1).padStart(2,'0')}`

  const months = useMemo(() => {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return Array.from({ length: 12 }).map((_, i) => {
      const key = `${currentYear}-${String(i+1).padStart(2,'0')}`
      return { key, label: `${names[i]} ${currentYear}` }
    })
  }, [currentYear])

  const paidMap = useMemo(() => {
    const m = new Map()
    for (const p of history) m.set(p.month, p)
    return m
  }, [history])

  const compareMonthKey = (a, b) => a.localeCompare(b)

  const dueMonths = useMemo(() => {
    return months.filter(m => compareMonthKey(m.key, currentMonthKey) < 0 && !(paidMap.has(m.key) && paidMap.get(m.key).status === 'completed'))
  }, [months, paidMap, currentMonthKey])
  const totalDue = (user?.fixedAmount || 0) * dueMonths.length

  const settleAll = async () => {
    if (!dueMonths.length) return
    if (!bulkFile) { setMsg('Please choose a document to upload.'); return }
    const ok = await confirm({
      title: 'Settle All Dues',
      message: `Mark ${dueMonths.length} month(s) as paid and attach the same document to each?`,
      confirmText: 'Settle All'
    })
    if (!ok) return
    setBulkLoading(true); setMsg('')
    try {
      for (const m of dueMonths) {
        const form = new FormData()
        form.append('month', m.key)
        form.append('proof', bulkFile)
        await api.post('/payments/submit', form)
      }
      toast.success('All dues settled')
      setBulkFile(null)
      await load()
    } catch (e) {
      const m = e.response?.data?.message || e.message || 'Failed to settle dues'
      setMsg(m)
      toast.error(m)
    } finally { setBulkLoading(false) }
  }

  const submitPayment = async (monthKey) => {
    try {
      setUploadingMonth(monthKey); setMsg('')
      const f = fileByMonth[monthKey]
      if (!f) {
        setUploadingMonth('')
        setMsg('Please attach a document for this month before marking paid.')
        return
      }
      const ok = await confirm({ title: 'Mark payment', message: `Mark ${monthKey} as paid?`, confirmText: 'Mark Paid' })
      if (!ok) { setUploadingMonth(''); return }
      const form = new FormData()
      form.append('month', monthKey)
      form.append('proof', f)
      await api.post('/payments/submit', form)
      toast.success('Payment submitted')
      load()
    } catch (e) {
      const m = e.response?.data?.message || e.message || 'Failed'
      setMsg(m)
      toast.error(m)
    } finally { setUploadingMonth('') }
  }

  return (
    <div className="grid gap-6">
      <section className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">My Payments ({currentYear})</h2>
        <div className="mb-3 text-sm">
          <span className="text-gray-600">Total Due: </span>
          <span className="font-semibold">₹{totalDue}</span>
          {user?.fixedAmount ? <span className="text-gray-500"> (₹{user.fixedAmount} × {dueMonths.length} months)</span> : null}
        </div>
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="text-sm text-gray-700">Settle all past due months:</div>
          <input type="file" accept="image/*,application/pdf" onChange={e=>setBulkFile(e.target.files?.[0]||null)} />
          <button
            onClick={settleAll}
            disabled={!dueMonths.length || !bulkFile || bulkLoading}
            className="bg-gray-900 text-white px-3 py-2 rounded disabled:opacity-50 text-sm"
          >{bulkLoading ? 'Settling...' : `Settle All Dues (${dueMonths.length})`}</button>
        </div>
        {msg && <p className="text-sm text-red-600 mb-2">{msg}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {months.map(m => {
            const paid = paidMap.has(m.key) && paidMap.get(m.key).status === 'completed'
            const isPast = compareMonthKey(m.key, currentMonthKey) < 0
            const statusIcon = paid ? '✓' : (isPast ? '✗' : '•')
            const statusColor = paid ? 'text-green-600' : (isPast ? 'text-red-600' : 'text-gray-400')
            const proof = paid ? paidMap.get(m.key).proofPath : null
            return (
              <div key={m.key} className="border rounded p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{m.label}</div>
                  <div className={`${statusColor} font-bold`}>{statusIcon}</div>
                </div>
                {paid ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">Paid</span>
                    {proof && (() => {
                      const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '')
                      const href = `${apiBase}${proof}`
                      return (
                        <a
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100"
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                          </svg>
                          View Document
                        </a>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e)=>{
                        const f = e.target.files?.[0]||null
                        setFileByMonth(prev => ({ ...prev, [m.key]: f }))
                      }}
                    />
                    {fileByMonth[m.key] && (
                      <div className="text-xs text-gray-600 truncate">{fileByMonth[m.key]?.name}</div>
                    )}
                    <button
                      disabled={!fileByMonth[m.key] || !!uploadingMonth}
                      onClick={()=>submitPayment(m.key)}
                      className="bg-gray-900 text-white px-3 py-2 rounded disabled:opacity-50 text-sm"
                    >{uploadingMonth===m.key ? 'Saving...' : 'Mark Paid'}</button>
                    {!fileByMonth[m.key] && <p className="text-xs text-gray-500">Document required</p>}
                    {!isPast && <p className="text-xs text-gray-500">Upcoming month</p>}
                    {isPast && <p className="text-xs text-red-600">Past due</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
