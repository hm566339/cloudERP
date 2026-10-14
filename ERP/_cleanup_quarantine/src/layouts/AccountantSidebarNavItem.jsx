import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function AccountantSidebarNavItem({
  item, location, level = 0,
  openMenu, onToggleMenu,
}) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0
  const isParentActive =
    location.pathname.startsWith(item.path) ||
    (hasChildren && item.children.some(c => location.pathname.startsWith(c.path))) ||
    (item.id === 'finance' && location.pathname.includes('/finance'))

  const Icon = item.icon

  if (!hasChildren) {
    const isActive = location.pathname === item.path
    return (
      <Link
        to={item.path || '#'}
        className={`sidebar-item ${isActive ? (level > 0 ? 'sidebar-child-active' : 'sidebar-item-active') : (level > 0 ? 'sidebar-child-inactive' : 'sidebar-item-inactive')}`}
      >
        {Icon && <Icon size={level > 0 ? 15 : 18} className="shrink-0" />}
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  const isControlled = level === 1
  const isOpen = isControlled ? (openMenu === item.id) : true

  const handleToggle = () => {
    if (isControlled && onToggleMenu) {
      onToggleMenu(item.id)
    }
  }

  return (
    <div className={level === 0 ? 'mb-1' : 'mt-0.5'}>
      <button
        onClick={handleToggle}
        className={`sidebar-item w-full ${isParentActive ? (level === 0 ? 'text-primary-600 font-bold' : 'text-primary-600') : (level > 0 ? 'sidebar-child-inactive' : 'sidebar-item-inactive')}`}
      >
        {Icon && <Icon size={level > 0 ? 15 : 18} className="shrink-0" />}
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronRight
          size={14}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`space-y-0.5 ${level === 0 ? 'ml-[8.8px] pl-4 border-l-2 border-zinc-100/80 pb-2 mt-1' : 'ml-4 pl-3 border-l border-zinc-100 pb-1 mt-1'}`}>
          {item.children.map((child) => (
            <AccountantSidebarNavItem
              key={child.id}
              item={child}
              location={location}
              level={level + 1}
              openMenu={openMenu}
              onToggleMenu={onToggleMenu}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
