import React from 'react'

export default function DashboardLayout({ children, sidebar, header }) {
    return (
        <div className="min-h-screen bg-white flex">
            {/* Sidebar */}
            {sidebar}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {header}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
