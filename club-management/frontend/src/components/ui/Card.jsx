export default function Card({ className = '', children }) {
  return (
    <div className={`bg-white shadow rounded-xl border border-gray-200 ${className}`}>{children}</div>
  )
}
