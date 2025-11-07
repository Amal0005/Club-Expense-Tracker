import Button from './ui/Button.jsx'

export default function DocumentPreviewModal({ open, url, title = 'Document', onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-[92vw] max-w-lg sm:max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800 truncate pr-2">{title}</div>
          <Button size="sm" variant="subtle" onClick={onClose}>Close</Button>
        </div>
        <div className="flex-1 bg-gray-50 overflow-auto">
          <iframe
            title={title}
            src={url}
            className="w-full h-[70vh]"
          />

        </div>
      </div>
    </div>
  )
}
