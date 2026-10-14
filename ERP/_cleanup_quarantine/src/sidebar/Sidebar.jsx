import React, { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { sidebarConfig } from './sidebarConfig'
import { filterSidebarByModules } from './sidebarFilter'
import SidebarItem from './SidebarItem'

export default function Sidebar() {
  const auth = useAuth();

  const moduleList = useMemo(() => {
    const modules = auth.user?.modules || auth.entitledModules || [];
    return Array.isArray(modules) ? modules : [];
  }, [auth.user?.modules, auth.entitledModules]);

  const visibleSidebar = useMemo(() => {
    return filterSidebarByModules(sidebarConfig, moduleList, auth);
  }, [moduleList, auth]);

  return (
    <nav className="space-y-1">
      {visibleSidebar.map((item) => (
        <SidebarItem key={item.id} item={item} />
      ))}
    </nav>
  )
}
