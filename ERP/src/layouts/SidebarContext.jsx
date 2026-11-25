import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const location = useLocation();

  // Desktop sidebar collapse state - persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('erp_sidebar_collapsed') === 'true' ||
        localStorage.getItem('owner_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('erp_sidebar_collapsed', String(next));
        localStorage.setItem('owner_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setCollapsed = useCallback((val) => {
    setIsCollapsed(val);
    try {
      localStorage.setItem('erp_sidebar_collapsed', String(val));
      localStorage.setItem('owner_sidebar_collapsed', String(val));
    } catch {
      // ignore
    }
  }, []);

  // Open submenus state - persisted in localStorage
  const [openMenus, setOpenMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_sidebar_open_menus');
      const parsed = saved ? JSON.parse(saved) : {};
      // Ensure sales-crm and crm always start closed by default on page load
      if (parsed['sales-crm']) parsed['sales-crm'] = false;
      if (parsed['crm']) parsed['crm'] = false;
      try {
        localStorage.setItem('erp_sidebar_open_menus', JSON.stringify(parsed));
      } catch {
        // ignore
      }
      return parsed;
    } catch {
      return {};
    }
  });

  const toggleMenu = useCallback((menuId) => {
    setOpenMenus((prev) => {
      const currentVal = prev[menuId] !== undefined ? prev[menuId] : false;
      const next = { ...prev, [menuId]: !currentVal };
      try {
        localStorage.setItem('erp_sidebar_open_menus', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setMenuOpen = useCallback((menuId, isOpen) => {
    setOpenMenus((prev) => {
      if (prev[menuId] === isOpen) return prev;
      const next = { ...prev, [menuId]: isOpen };
      try {
        localStorage.setItem('erp_sidebar_open_menus', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isMenuOpen = useCallback(
    (menuId, isParentActive) => {
      if (openMenus && openMenus[menuId] !== undefined) {
        return openMenus[menuId];
      }
      // Sales & CRM starts closed by default on initial page open
      if (menuId === 'sales-crm' || menuId === 'crm') {
        return false;
      }
      if (isParentActive) return true;
      return false;
    },
    [openMenus]
  );

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Automatically close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);

  // Global keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  const value = {
    isCollapsed,
    toggleCollapse,
    setCollapsed,
    openMenus,
    toggleMenu,
    setMenuOpen,
    isMenuOpen,
    mobileOpen,
    setMobileOpen,
    openMobile,
    closeMobile,
    toggleMobile,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return {
      isCollapsed: false,
      toggleCollapse: () => { },
      setCollapsed: () => { },
      openMenus: {},
      toggleMenu: () => { },
      setMenuOpen: () => { },
      isMenuOpen: (_id, isParentActive) => !!isParentActive,
      mobileOpen: false,
      setMobileOpen: () => { },
      openMobile: () => { },
      closeMobile: () => { },
      toggleMobile: () => { },
    };
  }
  return ctx;
}

export default SidebarContext;
