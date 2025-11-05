import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    payments: 0,
    expenses: 0,
    income: 0,
    expenseTotal: 0,
    balance: 0,
  })
  const [latest, setLatest] = useState([])

  useEffect(() => {
    const load = async () => {
      const [u, p, e, incomeRes, expenseRes] = await Promise.all([
        api.get('/users'),
        api.get('/payments'),
        api.get('/expenses/latest'),
        api.get('/payments/total?status=completed'),
        api.get('/expenses/total'),
      ])
      const income = incomeRes.data?.total || 0
      const expenseTotal = expenseRes.data?.total || 0
      const balance = income - expenseTotal
      setStats({
        users: u.data.length,
        payments: p.data.length,
        expenses: e.data.length,
        income,
        expenseTotal,
        balance,
      })
      setLatest(Array.isArray(e.data) ? e.data : [])
    }
    load()
  }, [])

  const pctExpenses = (() => {
    const denom = stats.income > 0 ? stats.income : 1
    const v = Math.min(100, Math.max(0, Math.round((stats.expenseTotal / denom) * 100)))
    return v
  })()

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg grid place-items-center ${color} bg-opacity-10 text-current`}>
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  )

  const currency = (n) => `₹${n}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Overview</h1>
            <p className="text-sm text-gray-600 mt-1">Track users, payments, and club expenses at a glance.</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>Last updated</div>
            <div className="font-medium text-gray-800">{new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <StatCard
          title="Users"
          value={stats.users}
          color="text-indigo-600 bg-indigo-50"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <path d="M12 14c-5 0-8 2.5-8 5v1h16v-1c0-2.5-3-5-8-5z" />
            </svg>
          }
        />
        <StatCard
          title="Payments"
          value={stats.payments}
          color="text-emerald-600 bg-emerald-50"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v3H3V6z" />
              <path d="M3 10h20v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8zm4 5h4v2H7v-2z" />
            </svg>
          }
        />
        <StatCard
          title="Recent Expenses"
          value={stats.expenses}
          color="text-rose-600 bg-rose-50"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 7H5V5h14v2zM5 9h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9zm4 3h2v6H9v-6zm4 0h2v6h-2v-6z" />
            </svg>
          }
        />
        <StatCard
          title="Total Income"
          value={<span className="text-emerald-700">{currency(stats.income)}</span>}
          color="text-emerald-600 bg-emerald-50"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 3l4 4h-3v7h-2V7H8l4-4z" />
              <path d="M5 19h14v2H5z" />
            </svg>
          }
        />
        <StatCard
          title="Total Expenses"
          value={<span className="text-red-700">{currency(stats.expenseTotal)}</span>}
          color="text-rose-600 bg-rose-50"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 21l-4-4h3V10h2v7h3l-4 4z" />
              <path d="M5 3h14v2H5z" />
            </svg>
          }
        />
      </div>

      {/* Balance and Insights */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Balance</div>
              <div className={`text-3xl font-semibold ${stats.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {currency(stats.balance)}
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Income: <span className="font-medium text-gray-900">{currency(stats.income)}</span></div>
              <div>Expenses: <span className="font-medium text-gray-900">{currency(stats.expenseTotal)}</span></div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-rose-500"
                style={{ width: `${pctExpenses}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>{pctExpenses}% of income spent</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Recent Expenses</div>
            <Link to="/admin/expenses" className="text-sm text-brand-700 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {latest.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">No recent expenses</div>
            )}
            {latest.slice(0, 5).map((it) => (
              <div key={it.id || it._id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{it.title || it.name || 'Expense'}</div>
                  <div className="text-xs text-gray-500">{new Date(it.date || it.createdAt || Date.now()).toLocaleDateString()}</div>
                </div>
                <div className="text-sm font-semibold text-red-700">{currency(it.amount || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
