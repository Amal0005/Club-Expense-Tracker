import { useState } from 'react'
import api from '../api/axios'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'

export default function PaymentUpload({ onDone }) {
  const [month, setMonth] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const toast = useToast()
  const { confirm } = useConfirm()

  const submit = async (e) => {
    e.preventDefault()
    setMsg(''); setLoading(true)
    try {
      if (!month) throw new Error('Please select the month')
      const ok = await confirm({ title: 'Mark payment', message: `Mark ${month} as paid?`, confirmText: 'Mark Paid' })
      if (!ok) { setLoading(false); return }
      const form = new FormData()
      form.append('month', month)
      if (file) form.append('proof', file)
      await api.post('/payments/submit', form)
      toast.success('Payment submitted')
      setMonth(''); setFile(null)
      onDone && onDone()
    } catch (e) {
      const m = e.response?.data?.message || e.message || 'Failed'
      setMsg(m)
      toast.error(m)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex gap-3 items-center">
        <input type="month" className="border rounded px-3 py-2" value={month} onChange={e=>setMonth(e.target.value)} required />
        <input type="file" accept="image/*,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button disabled={loading} className="bg-gray-900 text-white px-4 py-2 rounded disabled:opacity-50">{loading?'Saving...':'Mark Paid'}</button>
      </div>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  )
}

