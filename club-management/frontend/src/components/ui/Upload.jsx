import { useId } from 'react'
import Button from './Button.jsx'
import { cn } from './cn'

export default function Upload({
  id,
  accept = 'image/*,application/pdf',
  value = null,
  onChange,
  placeholder = 'No file selected',
  buttonText = 'Choose File',
  disabled = false,
  className = '',
}) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e)=> onChange && onChange(e.target.files?.[0] || null)}
      />
      <Button as="label" htmlFor={inputId} variant="subtle" size="sm" disabled={disabled} className="px-3">
        {buttonText}
      </Button>
      <span className="text-xs text-gray-600 truncate" title={value?.name || ''}>
        {value?.name || placeholder}
      </span>
    </div>
  )
}
