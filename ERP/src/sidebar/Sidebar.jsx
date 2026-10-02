import React, { useMemo } from 'react'
import { selectCurrentUser } from '../features/auth/authSlice';
import { useAppSelector } from '../app/hooks'
import { sidebarConfig } from './sidebarConfig'
import { filterSidebarByModules } from './sidebarFilter'
import SidebarItem from './SidebarItem'

export default function Sidebar() {
  const user = useAppSelector(selectCurrentUser);

  const moduleList = useMemo(() => {
    const modules = user?.modules || [];
    return Array.isArray(modules) ? modules : [];
  }, [user?.modules]);


  const visibleSidebar = useMemo(() => {
    return filterSidebarByModules(sidebarConfig, moduleList);
  }, [moduleList]);

  return (
    <nav className="space-y-1">
      {visibleSidebar.map((item) => (
        <SidebarItem key={item.id} item={item} />
      ))}
    </nav>
  )
}
