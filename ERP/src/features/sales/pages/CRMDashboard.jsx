import React from 'react'
import { Users, TrendingUp, Target, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const pipelineData = [
 { name: 'Jan', new: 40, won: 24 },
 { name: 'Feb', new: 30, won: 13 },
 { name: 'Mar', new: 20, won: 48 },
 { name: 'Apr', new: 27, won: 39 },
 { name: 'May', new: 18, won: 48 },
]

const revenueData = [
 { name: 'Jan', revenue: 4000 },
 { name: 'Feb', revenue: 3000 },
 { name: 'Mar', revenue: 2000 },
 { name: 'Apr', revenue: 2780 },
 { name: 'May', revenue: 1890 },
]

export default function CRMDashboard() {
 return (
 <div className="animate-fade-in space-y-6">
 <div className="page-header mb-0">
 <div>
 <h1 className="page-title">CRM Dashboard</h1>
 <p className="page-subtitle">Customer relationship management overview</p>
 </div>
 </div>

 {/* KPIs */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <div className="kpi-card flex items-center justify-between p-4">
 <div>
 <p className="kpi-label">Total Customers</p>
 <p className="kpi-value text-2xl mt-1">1,248</p>
 </div>
 <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
 <Users size={24} />
 </div>
 </div>
 <div className="kpi-card flex items-center justify-between p-4">
 <div>
 <p className="kpi-label">Active Leads</p>
 <p className="kpi-value text-2xl mt-1 text-amber-600">45</p>
 </div>
 <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
 <Target size={24} />
 </div>
 </div>
 <div className="kpi-card flex items-center justify-between p-4">
 <div>
 <p className="kpi-label">Win Rate</p>
 <p className="kpi-value text-2xl mt-1 text-emerald-600">32.4%</p>
 </div>
 <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
 <TrendingUp size={24} />
 </div>
 </div>
 <div className="kpi-card flex items-center justify-between p-4">
 <div>
 <p className="kpi-label">Pipeline Value</p>
 <p className="kpi-value text-2xl mt-1 text-blue-600">₹4.2M</p>
 </div>
 <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
 <BarChart3 size={24} />
 </div>
 </div>
 </div>

 {/* Charts */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="card p-4">
 <h3 className="font-bold text-zinc-900 mb-6">Lead Pipeline (YTD)</h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%" debounce={50}>
 <BarChart data={pipelineData}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
 <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
 <Bar dataKey="new" name="New Leads" fill="url(#colorNew)" radius={[4, 4, 0, 0]} />
 <Bar dataKey="won" name="Won Leads" fill="url(#colorWon)" radius={[4, 4, 0, 0]} />
 <defs>
 <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.8}/>
 <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.2}/>
 </linearGradient>
 <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
 <stop offset="95%" stopColor="#2563EB" stopOpacity={0.2}/>
 </linearGradient>
 </defs>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="card p-4">
 <h3 className="font-bold text-zinc-900 mb-6">Expected Revenue Trend</h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%" debounce={50}>
 <AreaChart data={revenueData}>
 <defs>
 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
 <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
 <Area type="monotone" dataKey="revenue" name="Revenue (k)" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{r: 6, strokeWidth: 0}} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 </div>
 )
}
