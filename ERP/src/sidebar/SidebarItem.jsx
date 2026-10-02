import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function SidebarItem({ item, depth = 0 }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { companyId } = useParams()
  const [isExpanded, setIsExpanded] = useState(depth < 1)
  const Icon = item.icon

  const resolvedPath = useMemo(() => {
    if (!item.path) return null
    if (item.path.startsWith('/company/')) return item.path
    if (companyId) return `/company/${companyId}${item.path}`
    return item.path
  }, [companyId, item.path])

  const children = item.children || []
  const hasChildren = children.length > 0
  const isActive = useMemo(() => {
    if (!resolvedPath) return false
    if (location.pathname === resolvedPath) return true
    if (location.pathname.startsWith(`${resolvedPath}/`)) return true
    return children.some((child) => {
      const childPath = child.path?.startsWith('/company/') ? child.path : (companyId ? `/company/${companyId}${child.path}` : child.path)
      return childPath && (location.pathname === childPath || location.pathname.startsWith(`${childPath}/`))
    })
  }, [children, companyId, location.pathname, resolvedPath])

  const handleToggle = (event) => {
    event.preventDefault()
    if (hasChildren) {
      setIsExpanded((value) => !value)
      return
    }

    if (resolvedPath) {
      navigate(resolvedPath, { replace: false })
    }
  }

  const content = (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
        isActive
          ? 'bg-zinc-900 text-white shadow-sm'
          : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
      style={{ marginLeft: depth * 12 }}
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon size={16} />}
        <span>{item.title}</span>
      </span>
      {hasChildren && <ChevronRight size={14} className={`opacity-70 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
    </div>
  )

  if (!hasChildren) {
    return (
      <Link to={resolvedPath || '#'} className="block" onClick={(event) => { if (!resolvedPath) event.preventDefault() }}>
        {content}
      </Link>
    )
  }

  return (
    <div>
      <button type="button" onClick={handleToggle} className="block w-full text-left">
        {content}
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <SidebarItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
