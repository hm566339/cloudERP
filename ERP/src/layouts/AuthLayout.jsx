import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Shield, X, AlertCircle, CheckCircle, Info, AlertTriangle, Blocks, Zap, Sparkles } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { removeAlert } from '../features/notifications/notificationSlice'

// Single Toast Alert Item
export function ToastAlert({ alert, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [alert.id, onClose])

  let icon = <Info className="text-primary-500" size={18} />
  let bgColor = 'bg-white border-zinc-200'
  let textColor = 'text-zinc-800'

  if (alert.type === 'success') {
    icon = <CheckCircle className="text-emerald-500" size={18} />
    bgColor = 'bg-white border-emerald-200/60'
    textColor = 'text-zinc-800'
  } else if (alert.type === 'error') {
    icon = <AlertCircle className="text-rose-500" size={18} />
    bgColor = 'bg-white border-rose-200/60'
    textColor = 'text-zinc-800'
  } else if (alert.type === 'warning') {
    icon = <AlertTriangle className="text-amber-500" size={18} />
    bgColor = 'bg-white border-amber-200/60'
    textColor = 'text-zinc-800'
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl shadow-slate-200/50 animate-slide-up ${bgColor} ${textColor} transition-all duration-300 backdrop-blur-xl bg-white/80`}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-grow text-[10.4px] font-medium leading-relaxed">{alert.message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 ml-auto text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// Toast/Alert list container
export function ToastNotification() {
  const alerts = useAppSelector((state) => state.notification.alerts)
  const dispatch = useAppDispatch()

  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <ToastAlert
            alert={alert}
            onClose={() => dispatch(removeAlert(alert.id))}
          />
        </div>
      ))}
    </div>
  )
}

export default function AuthLayout() {
  return (
    <div className="h-screen w-screen flex font-sans overflow-hidden selection:bg-primary/30 selection:text-white bg-slate-50">

      {/* ── Left Side: Information Panel (Hidden on Mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-zinc-950 text-white flex-col justify-between p-6 lg:p-10 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary-600/20 blur-[96px] mix-blend-screen animate-blob"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[96px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950"></div>
        </div>

        {/* Top Logo */}
        <div className="relative z-10 mb-2 lg:mb-4">
          <img src="/ChatGPT Image Sep 11, 2026, 03_03_31 AM.png" alt="Mark Logo" className="w-48 lg:w-[280px] h-auto object-contain object-left" />
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-lg mb-auto mt-auto py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs lg:text-sm font-semibold mb-4 shadow-sm">
            <Sparkles size={14} className="text-white" />
            <span>Enterprise Resource Planning</span>
          </div>
          <h1 className="text-2xl lg:text-4xl xl:text-5xl font-display font-bold leading-tight tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
            The intelligent platform for modern businesses.
          </h1>
          <p className="text-sm lg:text-base text-zinc-400 leading-relaxed mb-6">
            Streamline your operations, manage finances, and empower your workforce with our scalable multi-tenant architecture designed for growth.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Shield size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm lg:text-base mb-0.5">Enterprise-Grade Security</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Your data is protected with industry-leading encryption and role-based access controls across all tenants.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Zap size={16} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm lg:text-base mb-0.5">Lightning Fast Performance</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Built on a modern technology stack to ensure seamless operations and immediate insights even at scale.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-xs text-zinc-500 font-medium pt-2">
          © {new Date().getFullYear()} Mark2. All rights reserved.
        </div>
      </div>

      {/* ── Right Side: Auth Forms ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden w-full lg:w-[55%] xl:w-1/2">
        {/* Mobile Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 lg:hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary-400/20 blur-[96px] mix-blend-multiply animate-blob"></div>
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/90"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 w-full min-h-full">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 animate-fade-in-up">
            <img src="/ChatGPT Image Sep 11, 2026, 03_03_31 AM.png" alt="Mark Logo" className="w-48 h-auto object-contain object-center" />
          </div>

          <div className="w-full flex justify-center px-2 sm:px-0 mx-auto">
            <Outlet />
          </div>

          <p className="lg:hidden mt-12 text-xs font-medium text-zinc-500 text-center px-4 animate-fade-in-up">
            © {new Date().getFullYear()} Mark2. All rights reserved.<br />
            Protected by Enterprise-Grade Security
          </p>
        </div>
      </div>

      <ToastNotification />
    </div>
  )
}
