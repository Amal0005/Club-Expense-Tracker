export default function Card({ className = '', children }) {
  return (
    <div className={`bg-white shadow-card rounded-xl border border-gray-100 ${className}`}>{children}</div>
  )
}
