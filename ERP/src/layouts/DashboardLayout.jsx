import React from 'react'

/**
 * Reusable enterprise DashboardLayout shell.
 * Accepts:
 * - sidebar: The left navigation component
 * - header: The top header / bar component
 * - banner: Optional subscription or alert banner
 * - children: Main page viewport content
 * - isCollapsed: Whether sidebar is collapsed in desktop view
 * - className: Optional root container classes
 */
export default function DashboardLayout({
    children,
    sidebar,
    header,
    banner,
    isCollapsed = false,
    className = ''
}) {
    return (
        <div className={`h-screen bg-transparent flex font-sans selection:bg-zinc-200 selection:text-zinc-900 dark:selection:bg-[#4C8DFF]/30 dark:selection:text-[#E6E8EE] overflow-hidden ${className}`}>
            {/* Sidebar */}
            {sidebar}

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col h-screen min-w-0 transition-[padding] duration-large ease-move ${
                    sidebar ? (isCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar-expanded') : ''
                }`}
            >
                <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">
                    {header}
                    {banner}
                    <main className="flex-1 min-h-0 overflow-y-auto bg-zinc-50/30 dark:bg-[#0F1117]">
                        <div className="w-full flex-1 flex flex-col min-h-0 min-w-0 max-w-[2560px] 5xl:max-w-[3200px] mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
