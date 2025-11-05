import { cn } from './cn'

export default function Button({
  as: As = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3 py-2',
    lg: 'text-sm px-4 py-2.5',
  }
  const styles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-300',
    subtle: 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 focus:ring-gray-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300',
    ghost: 'text-gray-700 hover:bg-gray-100',
  }
  return (
    <As className={cn(base, sizes[size] || sizes.md, styles[variant] || styles.primary, className)} disabled={disabled} {...props}>
      {children}
    </As>
  )
}
