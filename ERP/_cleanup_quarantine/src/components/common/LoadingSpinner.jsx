import React from 'react'

export default function LoadingSpinner({ fullscreen = false, size = 'md' }) {
 const sizes = {
 sm: 'w-4 h-4 border-2',
 md: 'w-8 h-8 border-2',
 lg: 'w-12 h-12 border-3',
 }

 const spinner = (
 <div
 className={`${sizes[size]} rounded-full border-primary border-t-primary-600 animate-spin`}
 />
 )

 if (fullscreen) {
 return (
 <div className="fixed inset-0 bg-zinc-50 flex items-center justify-center z-50">
 <div className="flex flex-col items-center gap-4">
 <div className="w-12 h-12 rounded-full border-2 border-primary border-t-primary-600 animate-spin" />
 <p className="text-sm font-medium text-zinc-500">Loading...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="flex items-center justify-center p-8">
 {spinner}
 </div>
 )
}
