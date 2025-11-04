import { cn } from './cn'

export default function Input({ className = '', ...props }) {
  const base = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white'
  return <input className={cn(base, className)} {...props} />
}
