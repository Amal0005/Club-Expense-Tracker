import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

export default function Expenses() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ type: '', amount: 0, date: new Date().toISOString().slice(0,10), note: '' })
  const [proofFile, setProofFile] = useState(null)
  const [msg, setMsg] = useState('')
  const toast = useToast()
  const { confirm } = useConfirm()

  const load = async () => {
    try {
      const { data } = await api.get('/expenses/latest')
      setItems(data)
    } catch (e) { setMsg(e.response?.data?.message || 'Failed to load') }
  }
  useEffect(() => { load() }, [])

  const addExpense = async (e) => {
    e.preventDefault(); setMsg('')
    try {
      const payload = { ...form, amount: Number(form.amount), date: new Date(form.date).toISOString() }
      const ok = await confirm({
        title: 'Add expense',
        message: `Add ${payload.type} expense of ₹${payload.amount} on ${form.date}?`,
        confirmText: 'Add'
      })
      if (!ok) return
      const fd = new FormData()
      fd.append('type', payload.type)
      fd.append('amount', String(payload.amount))
      fd.append('date', payload.date)
      if (payload.note) fd.append('note', payload.note)
      if (proofFile) fd.append('proof', proofFile)
      await api.post('/expenses', fd)
      setForm({ type: '', amount: 0, date: new Date().toISOString().slice(0,10), note: '' })
      setProofFile(null)
      load()
      toast.success('Expense added')
    } catch (e) { setMsg(e.response?.data?.message || 'Create failed') }
  }

  const updateExpense = async (id, patch) => {
    await api.patch(`/expenses/${id}`, patch)
    load()
  }

  const deleteExpense = async (id) => {
    const ok = await confirm({ title: 'Delete expense', message: 'This action cannot be undone.', confirmText: 'Delete', intent: 'danger' })
    if (!ok) return
    try {
      await api.delete(`/expenses/${id}`)
      load()
      toast.success('Expense deleted')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Add Expense</h2>
        {msg && <p className="text-sm text-red-600 mb-2">{msg}</p>}
        <form onSubmit={addExpense} className="grid md:grid-cols-6 gap-3 items-end">
          <Input className="h-10" placeholder="Type (electricity, water, ...)" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} />
          <Input className="h-10" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
          <Input className="h-10" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <Input className="h-10" placeholder="Note (optional)" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} />
          <div className="flex items-center gap-2 min-w-0">
            <input id="proof" type="file" accept="image/*,application/pdf" className="hidden" onChange={e=>setProofFile(e.target.files?.[0]||null)} />
            <Button as="label" htmlFor="proof" variant="subtle" className="h-10 px-3">Upload</Button>
            <span className="text-xs text-gray-600 truncate" title={proofFile?.name || ''}>{proofFile?.name || 'No file selected'}</span>
          </div>
          <Button className="h-10">Add</Button>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Recent Expenses</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Note</th>
              <th>Proof</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x._id} className="border-t">
                <td className="py-2">{x.type}</td>
                <td>₹{x.amount}</td>
                <td>{new Date(x.date).toLocaleDateString()}</td>
                <td>{x.note||'-'}</td>
                <td>
                  {x.proofUrl ? (
                    (() => {
                      const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '')
                      const href = `${apiBase}${x.proofUrl}`
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
                          View
                        </a>
                      )
                    })()
                  ) : '-'}
                </td>
                <td className="text-right whitespace-nowrap align-middle"><Button variant="danger" className="h-8 px-3" onClick={()=>deleteExpense(x._id)}>Delete</Button></td>
              </tr>
            ))}
            {items.length===0 && <tr><td className="py-3 text-gray-500" colSpan={6}>No expenses</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
