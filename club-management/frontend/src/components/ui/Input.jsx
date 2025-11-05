import { cn } from './cn'

export default function Input({ className = '', ...props }) {
  const base = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 hover:border-gray-300'
  return <input className={cn(base, className)} {...props} />
}
