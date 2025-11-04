import { cn } from './cn'

export default function Button({
  as: As = 'button',
  variant = 'primary',
  className = '',
  disabled,
  children,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const styles = {
    primary: 'bg-gray-900 text-white hover:bg-black focus:ring-gray-400',
    subtle: 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200 focus:ring-gray-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300',
    ghost: 'text-gray-700 hover:bg-gray-100',
  }
  return (
    <As className={cn(base, styles[variant] || styles.primary, className)} disabled={disabled} {...props}>
      {children}
    </As>
  )
}
