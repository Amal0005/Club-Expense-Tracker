import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext.jsx'
import DocumentPreviewModal from '../components/DocumentPreviewModal.jsx'
import { formatDMY } from '../utils/formatDate'

export default function UserDashboard() {
  const [latest, setLatest] = useState([])
  const [payments, setPayments] = useState([])
  const [club, setClub] = useState({ income: 0, expenses: 0, balance: 0 })
  const { user } = useAuth()
  const [preview, setPreview] = useState({ open:false, url:'', title:'' })
  const [goal, setGoal] = useState(() => {
    const raw = localStorage.getItem('nanma_goal_amount')
    const v = raw ? Number(raw) : 0
    return Number.isFinite(v) ? v : 0
  })

  const load = async () => {
    const [a, b, incomeRes, expenseRes] = await Promise.all([
      api.get('/expenses/latest'),
      api.get('/payments/me'),
      api.get('/payments/total?status=completed'),
      api.get('/expenses/total')
    ])
    setLatest(a.data)
    setPayments(b.data)
    const income = incomeRes.data?.total || 0
    const expenses = expenseRes.data?.total || 0
    setClub({ income, expenses, balance: income - expenses })
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    localStorage.setItem('nanma_goal_amount', String(goal || 0))
  }, [goal])

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthKey = `${currentYear}-${String(now.getMonth()+1).padStart(2,'0')}`
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const months = Array.from({ length: 12 }).map((_, i) => `${currentYear}-${String(i+1).padStart(2,'0')}`)
  const paidMap = new Map(payments.map(p => [p.month, p]))
  const compareMonthKey = (a, b) => a.localeCompare(b)
  // Determine effective join month (YYYY-MM)
  const rawCreated = user?.createdAt || user?.joinedAt || user?.created_at || null
  const createdAt = rawCreated ? new Date(rawCreated) : null
  const joinMonthKeyFromUser = createdAt ? `${createdAt.getFullYear()}-${String(createdAt.getMonth()+1).padStart(2,'0')}` : null
  const earliestHistoryMonth = (() => {
    if (!Array.isArray(payments) || payments.length === 0) return null
    let min = payments[0].month
    for (const r of payments) {
      if (typeof r.month === 'string' && r.month.localeCompare(min) < 0) min = r.month
    }
    return min
  })()
  const effectiveJoinMonthKey = joinMonthKeyFromUser || earliestHistoryMonth || currentMonthKey
  const isEligibleMonth = (mKey) => {
    const joinYear = Number(effectiveJoinMonthKey.slice(0,4))
    if (joinYear > currentYear) return false
    if (joinYear < currentYear) return true
    return mKey.localeCompare(effectiveJoinMonthKey) >= 0
  }
  const visibleMonths = months.filter(m => isEligibleMonth(m))
  const dueCount = visibleMonths.filter(m => compareMonthKey(m, currentMonthKey) < 0 && !(paidMap.has(m) && paidMap.get(m).status === 'completed')).length
  const totalDue = (user?.fixedAmount || 0) * dueCount

  // Progress should be based on months since user's join month (within this year)
  const nVisibleMonths = visibleMonths.length
  const paidMonthsVisible = visibleMonths.filter(m => paidMap.has(m) && paidMap.get(m)?.status === 'completed').length
  const yearProgressPct = nVisibleMonths > 0 ? Math.round((paidMonthsVisible / nVisibleMonths) * 100) : 0
  const totalPaidThisYear = payments
    .filter(p => (p.status === 'completed') && String(p.month || '').startsWith(String(currentYear)))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const computeStreak = () => {
    // count consecutive months (from current month backwards) that are completed
    let streak = 0
    for (let i = months.length - 1; i >= 0; i--) {
      const key = months[i]
      const isPastOrCurrent = compareMonthKey(key, currentMonthKey) <= 0
      if (!isPastOrCurrent) continue
      const ok = paidMap.has(key) && paidMap.get(key)?.status === 'completed'
      if (ok) streak++
      else break
    }
    return streak
  }
  const streak = computeStreak()

  return (
    <div className="grid gap-6">
      <DocumentPreviewModal open={preview.open} url={preview.url} title={preview.title} onClose={()=>setPreview({ open:false, url:'', title:'' })} />
      {/* Welcome section with streak and year progress */}
      <section className="bg-white shadow rounded p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h2>
            <p className="text-sm text-gray-600 mt-1">Here is a quick look at your monthly contributions.</p>
          </div>
          <div className={`px-2 py-1 text-xs rounded-full border ${streak>0?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {streak>0 ? `Streak: ${streak} month${streak>1?'s':''}` : 'No active streak'}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{paidMonthsVisible}/{nVisibleMonths} months paid</span>
            <span>{yearProgressPct}%</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${yearProgressPct}%` }} />
          </div>
        </div>
      </section>
      <section className="bg-white shadow rounded p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg">Dues Summary <span className="text-gray-500 text-sm">({currentYear})</span></h2>
            <p className="text-sm text-gray-600 mt-1">Keep your monthly payments up to date.</p>
          </div>
          <div className={`px-2 py-1 text-xs rounded-full ${dueCount>0?'bg-red-50 text-red-700 border border-red-200':'bg-green-50 text-green-700 border border-green-200'}`}>
            {dueCount>0? `${dueCount} due` : 'All paid'}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="border rounded-lg p-4">
            <div className="text-gray-500 text-xs">Total Due</div>
            <div className="text-2xl font-bold">₹{totalDue}</div>
            {user?.fixedAmount ? (
              <div className="text-xs text-gray-500 mt-1">₹{user.fixedAmount} × {dueCount} months</div>
            ) : null}
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-gray-500 text-xs">Unpaid Months</div>
            <div className="text-2xl font-bold">{dueCount}</div>
            <div className="text-xs text-gray-500 mt-1">Before current month</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-gray-500 text-xs">Status</div>
            <div className={`text-2xl font-bold ${dueCount>0?'text-red-600':'text-green-600'}`}>{dueCount>0?'Pending':'Clear'}</div>
            <div className="text-xs text-gray-500 mt-1">Auto-updates on payment</div>
          </div>
        </div>
      </section>

      {/* Savings Goal */}
      <section className="bg-white shadow rounded p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg">Savings Goal</h2>
            <p className="text-sm text-gray-600 mt-1">Track how your contributions this year move you toward a goal.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Goal (₹)</label>
            <input
              type="number"
              min="0"
              value={goal}
              onChange={(e)=> setGoal(Number(e.target.value) || 0)}
              className="w-28 px-2 py-1 text-sm border rounded"
            />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Paid this year</span>
            <span>₹{totalPaidThisYear} / ₹{goal || 0}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, goal>0 ? Math.round((totalPaidThisYear/goal)*100) : 0)}%` }} />
          </div>
        </div>
      </section>

      <section className="bg-white shadow rounded p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Club Balance</h2>
          <span className="text-xs text-gray-500">All members</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-gray-500 text-xs">Total Income</div>
            <div className="text-2xl font-bold text-green-700">₹{club.income}</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-gray-500 text-xs">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">₹{club.expenses}</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-gray-500 text-xs">Balance</div>
            <div className={`text-2xl font-bold ${club.balance>=0?'text-emerald-700':'text-red-700'}`}>₹{club.balance}</div>
          </div>
        </div>
      </section>

      <section className="bg-white shadow rounded p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Latest Expenses</h2>
          <span className="text-xs text-gray-500">Last 20 items</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latest.map(e => (
            <div key={e._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
              <div className="flex items-start justify-between gap-3">
                {(() => {
                  const t = (e.type||'').toLowerCase()
                  const badge = t.includes('rent') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                t.includes('electric') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                t.includes('water') ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                t.includes('food') || t.includes('meal') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                  return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${badge}`}>{e.type}</span>
                  )
                })()}
                <span className="text-xs text-gray-500 whitespace-nowrap">{formatDMY(e.date)}</span>
              </div>
              {e.note ? <div className="text-sm text-gray-700 mt-2 line-clamp-2">{e.note}</div> : <div className="h-1.5" />}
              <div className="mt-3 flex items-center justify-between">
                {(e.proofUrl || e.proofPath) && (() => {
                  const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '')
                  const path = e.proofUrl || e.proofPath
                  const href = `${apiBase}${path}`
                  return (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100"
                      onClick={()=> setPreview({ open:true, url: href, title: `Expense • ${new Date(e.date).toLocaleDateString()}` })}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></svg>
                      View Document
                    </button>
                  )
                })()}
                <div className="text-right ml-auto">
                  <div className="text-xl font-semibold text-rose-600">₹{e.amount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {latest.length === 0 && <div className="py-3 text-sm text-gray-500">No expenses yet</div>}
      </section>

      {/* Recent Payments */}
      <section className="bg-white shadow rounded p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Your Recent Payments</h2>
          <span className="text-xs text-gray-500">Completed</span>
        </div>
        <div className="divide-y">
          {payments
            .filter(p => p.status === 'completed')
            .sort((a,b)=> new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
            .slice(0,5)
            .map(p => (
              <div key={p._id || p.id || p.month} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{p.month || 'Payment'}</div>
                  <div className="text-xs text-gray-500">{formatDMY(p.date || p.createdAt || Date.now())}</div>
                </div>
                <div className="text-sm font-semibold text-emerald-700">₹{Number(p.amount)||0}</div>
              </div>
            ))}
          {payments.filter(p=>p.status==='completed').length===0 && (
            <div className="py-4 text-sm text-gray-500">No completed payments</div>
          )}
        </div>
      </section>
    </div>
  )
}
