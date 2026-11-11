import React from 'react'
import AppFooter from '../components/common/AppFooter'

/**
 * Reusable enterprise DashboardLayout shell.
 * Accepts:
 * - sidebar: The left navigation component
 * - header: The top header / bar component
 * - banner: Optional subscription or alert banner
 * - children: Main page viewport content
 * - footer: Optional custom footer element (defaults to AppFooter)
 * - hideFooter: Whether to suppress footer rendering (e.g., canvas or full-height tools)
 * - isCollapsed: Whether sidebar is collapsed in desktop view
 * - className: Optional root container classes
 */
export default function DashboardLayout({
    children,
    sidebar,
    header,
    banner,
    footer,
    hideFooter = false,
    isCollapsed = false,
    className = ''
}) {
    return (
            <div className={`min-h-screen h-screen bg-transparent flex font-sans selection:bg-zinc-200 selection:text-zinc-900 dark:selection:bg-[#4C8DFF]/30 dark:selection:text-[#E6E8EE] overflow-hidden ${className}`}>
                {/* Sidebar */}
                {sidebar}

                {/* Main Content Area */}
                <div
                    className={`flex-1 flex flex-col h-screen min-w-0 transition-[padding] duration-large ease-move ${sidebar ? (isCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar-expanded') : ''
                        }`}
                >
                    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">
                        {header}
                        {banner}
                                <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto bg-[var(--color-bg-base)] dark:bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
                                    <div className="w-full flex-1 flex flex-col min-h-full min-w-0 max-w-[2560px] 5xl:max-w-[3200px] mx-auto">
                                        <div className="flex-1 flex flex-col min-h-0 min-w-0">
                                            {children}
                                        </div>
                                        {!hideFooter && (footer || <AppFooter />)}
                                    </div>
                                </main>
                            </div>
                    </div>
                </div>
                )
}
