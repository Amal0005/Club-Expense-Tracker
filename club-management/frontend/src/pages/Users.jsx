import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

export default function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', fixedAmount: 0, role: 'user' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [msg, setMsg] = useState('')
  const toast = useToast()
  const { confirm } = useConfirm()

  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null) // user object
  const [payments, setPayments] = useState([])
  const [newPassword, setNewPassword] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch (e) { setMsg(e.response?.data?.message || 'Failed to load') }
  }
  useEffect(() => { load() }, [])

  const createUser = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const ok = await confirm({
        title: 'Create user',
        message: `Add ${form.role} "${form.name}" with username "${form.username}"?`,
        confirmText: 'Create'
      })
      if (!ok) return
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('username', form.username)
      if (form.email) fd.append('email', form.email)
      fd.append('password', form.password)
      fd.append('fixedAmount', String(form.fixedAmount))
      fd.append('role', form.role)
      if (avatarFile) fd.append('avatar', avatarFile)
      await api.post('/users', fd)
      setForm({ name: '', username: '', email: '', password: '', fixedAmount: 0, role: 'user' })
      setAvatarFile(null)
      load()
      toast.success('User created')
    } catch (e) { setMsg(e.response?.data?.message || 'Create failed') }
  }

  const updateUser = async (id, patch) => {
    const field = Object.keys(patch)[0]
    const value = patch[field]
    const label = field === 'fixedAmount' ? 'Fixed amount' : field.charAt(0).toUpperCase() + field.slice(1)
    const ok = await confirm({ title: 'Confirm update', message: `Change ${label} to "${value}"?`, confirmText: 'Update' })
    if (!ok) return
    try {
      await api.patch(`/users/${id}`, patch)
      load()
      toast.success('User updated')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    }
  }
  const deleteUser = async (id) => {
    const ok = await confirm({ title: 'Delete user', message: 'This action cannot be undone.', confirmText: 'Delete', intent: 'danger' })
    if (!ok) return
    try {
      await api.delete(`/users/${id}`)
      load()
      toast.success('User deleted')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  const openDetails = async (u) => {
    setSelected(u)
    setShowModal(true)
    try {
      const { data } = await api.get(`/payments/user/${u._id}`)
      setPayments(data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load user payments')
    }
  }

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSavingPw(true)
    try {
      await api.patch(`/users/${selected._id}/password`, { password: newPassword })
      toast.success('Password updated')
      setNewPassword('')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally { setSavingPw(false) }
  }

  return (
    <div className="grid gap-6">
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Create User</h2>
        {msg && <p className="text-sm text-red-600 mb-2">{msg}</p>}
        <form onSubmit={createUser} className="grid md:grid-cols-7 gap-3 items-end">
          <Input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <Input placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
          <Input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
          <Input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
          <Input placeholder="Fixed Amount" type="number" value={form.fixedAmount} onChange={e=>setForm({...form,fixedAmount:Number(e.target.value)})} />
          <Input type="file" accept="image/*" onChange={e=>setAvatarFile(e.target.files?.[0]||null)} />
          <div className="flex gap-2">
            <select className="border rounded px-3 py-2 text-sm" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <Button>Add</Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">All Users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Avatar</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Fixed Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-t">
                <td className="py-2">
                  {u.avatarUrl ? (
                    (() => {
                      const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '')
                      const src = `${apiBase}${u.avatarUrl}`
                      return <img src={src} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    })()
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                  )}
                </td>
                <td className="py-2">{u.name}</td>
                <td>
                  <Input className="w-36" defaultValue={u.username||''} onBlur={e=>updateUser(u._id,{ username: e.target.value })} />
                </td>
                <td>{u.email}</td>
                <td>
                  <select className="border rounded px-2 py-1" value={u.role} onChange={e=>updateUser(u._id,{ role: e.target.value })}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <Input className="w-24" type="number" defaultValue={u.fixedAmount||0} onBlur={e=>updateUser(u._id,{ fixedAmount: Number(e.target.value) })} />
                </td>
                <td className="text-right whitespace-nowrap align-middle">
                  <div className="inline-flex items-center gap-2">
                    <Button variant="subtle" className="h-8 px-3" onClick={()=>openDetails(u)}>Details</Button>
                    <Button variant="danger" className="h-8 px-3" onClick={()=>deleteUser(u._id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length===0 && (
              <tr><td className="py-3 text-gray-500" colSpan={7}>No users</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selected.name}</h3>
                <p className="text-xs text-gray-500">Username: {selected.username}</p>
              </div>
              <Button variant="ghost" onClick={()=>setShowModal(false)}>Close</Button>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-gray-500 text-xs">Dues Summary (Current Year)</div>
                {(() => {
                  const now = new Date()
                  const year = now.getFullYear()
                  const currentMonthKey = `${year}-${String(now.getMonth()+1).padStart(2,'0')}`
                  const months = Array.from({ length: 12 }).map((_, i) => `${year}-${String(i+1).padStart(2,'0')}`)
                  const paidMap = new Map(payments.map(p => [p.month, p]))
                  const due = months.filter(m => m.localeCompare(currentMonthKey) < 0 && !(paidMap.has(m) && paidMap.get(m).status === 'completed')).length
                  const totalDue = (selected.fixedAmount || 0) * due
                  return (
                    <div className="mt-2">
                      <div className="text-2xl font-bold">₹{totalDue}</div>
                      <div className="text-xs text-gray-500 mt-1">₹{selected.fixedAmount||0} × {due} months</div>
                      <div className="mt-3 max-h-40 overflow-auto">
                        <ul className="text-xs leading-6">
                          {months.map(m => (
                            <li key={m} className="flex items-center justify-between">
                              <span>{m}</span>
                              <span className={`text-xs ${paidMap.has(m) && paidMap.get(m).status==='completed' ? 'text-green-700' : (m.localeCompare(currentMonthKey)<0 ? 'text-red-700' : 'text-gray-400')}`}>
                                {paidMap.has(m) && paidMap.get(m).status==='completed' ? 'Paid' : (m.localeCompare(currentMonthKey)<0 ? 'Due' : 'Upcoming')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-gray-500 text-xs">Change Password</div>
                <div className="mt-2 flex gap-2">
                  <Input type="password" placeholder="New password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
                  <Button disabled={savingPw} onClick={updatePassword}>{savingPw? 'Saving...' : 'Update'}</Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Note: For security, current passwords are not viewable. Set a new one for the user.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
