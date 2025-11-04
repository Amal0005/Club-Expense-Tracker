export default function ChipLink({ href, children, className = '', ...props }) {
  return (
    <a
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100 ${className}`}
      href={href}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </svg>
      {children || 'View'}
    </a>
  )
}
