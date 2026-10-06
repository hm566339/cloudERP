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
        <div className={`min-h-screen bg-zinc-50/60 flex font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white ${className}`}>
            {/* Sidebar */}
            {sidebar}

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-in-out ${
                    sidebar ? (isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]') : ''
                }`}
            >
                {header}
                {banner}
                <main className="flex-1 min-w-0 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
