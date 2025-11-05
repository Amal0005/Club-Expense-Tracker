import Button from './ui/Button.jsx'

export default function DocumentPreviewModal({ open, url, title = 'Document', onClose }) {
  if (!open) return null
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url || '')
  const isPdf = /\.pdf$/i.test(url || '')
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-[95vw] max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800 truncate pr-2">{title}</div>
          <Button size="sm" variant="subtle" onClick={onClose}>Close</Button>
        </div>
        <div className="flex-1 bg-gray-50 overflow-auto">
          {isImage && (
            <img src={url} alt={title} className="block max-w-full h-auto mx-auto" />
          )}
          {isPdf && (
            <iframe title={title} src={url} className="w-full h-[75vh]" />
          )}
          {!isImage && !isPdf && (
            <div className="p-6 text-center text-sm text-gray-600">
              Preview not available. <a href={url} target="_blank" rel="noreferrer" className="underline text-brand-700">Open in new tab</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
