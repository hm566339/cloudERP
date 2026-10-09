import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

function SidebarNavItem({ item, location, level = 0, onLinkClick }) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0
  const isParentActive = (item.path && location.pathname.startsWith(item.path)) || (hasChildren && item.children.some(c => {
    if (!c.path) return false
    if (location.pathname === c.path || location.pathname.startsWith(c.path)) return true
    if (c.path?.includes('/transactions/expenses') && location.pathname.includes('/transactions/expenses')) return true
    if (c.path === '/workflows' && location.pathname.includes('/workflows')) return true
    if (c.path === '/workflows/approvals' && location.pathname.includes('/workflows/approvals')) return true
    return false
  }))

  const [open, setOpen] = useState(isParentActive)
  const Icon = item.icon

  useEffect(() => {
    if (isParentActive) {
      setOpen(true)
    }
  }, [isParentActive])

  if (!hasChildren) {
    const isExpenseMenu = item.id === 'expense' || item.id === 'txn-exp' || (typeof item.path === 'string' && item.path.includes('/transactions/expenses'))
    const isWorkflowMenu = item.id === 'workflow-approvals' || item.id === 'workflow-approval-requests' || (typeof item.path === 'string' && item.path.includes('/workflows'))
    const isActive = location.pathname === item.path ||
      (item.path !== '/super-admin/dashboard' && item.path !== '/' &&
        location.pathname.startsWith(item.path + '/') && item.path.split('/').length > 3)
      || (isExpenseMenu && location.pathname.includes('/transactions/expenses'))
      || (isWorkflowMenu && (location.pathname === item.path || location.pathname.endsWith(item.path)))

    return (
      <Link
        to={item.path}
        onClick={onLinkClick}
        className={`sidebar-item ${level > 0 ? 'sidebar-child-item' : ''} ${isActive ? (level > 0 ? 'sidebar-child-active' : 'sidebar-item-active') : (level > 0 ? 'sidebar-child-inactive' : 'sidebar-item-inactive')}`}
        style={level > 0 ? {} : undefined}
      >
        {Icon && <Icon size={level > 0 ? 16 : 18} className="shrink-0" />}
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  return (
    <div className={level === 0 ? "mb-1" : "mt-0.5"}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`sidebar-item ${level > 0 ? 'sidebar-child-item' : ''} ${isParentActive ? (level === 0 ? 'text-zinc-900 font-bold bg-white border border-zinc-300 shadow-sm' : 'text-zinc-900 font-medium') : (level > 0 ? 'sidebar-child-inactive' : 'sidebar-item-inactive')}`}
      >
        {Icon && <Icon size={level > 0 ? 16 : 18} className={`shrink-0 transition-colors ${isParentActive ? 'text-zinc-900' : 'text-zinc-400'}`} />}
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {open && (
        <div className={`mt-0.5 space-y-0.5 ${level === 0 ? 'ml-3 pl-3 border-l border-zinc-200/80 pb-0.5' : 'ml-3 pl-2.5 border-l border-zinc-100 pb-0.5'}`}>
          {item.children.map((child) => (
            <SidebarNavItem
              key={child.id}
              item={child}
              location={location}
              level={level + 1}
              onLinkClick={onLinkClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(SidebarNavItem);
