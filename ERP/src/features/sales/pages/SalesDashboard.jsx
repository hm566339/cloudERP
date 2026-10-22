import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingCart, Users, Briefcase, Plus, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'
import { useRBAC } from '../../../utils/rbac'
import { useGetLeadsQuery, useCreateLeadMutation, useUpdateLeadStatusMutation } from '../../../api/sales-crm'

export default function SalesDashboard() {
 const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
 const dispatch = useAppDispatch()
 const { canCreate, canEdit, canApprove, canViewModule } = useRBAC()
 const [showAddLead, setShowAddLead] = useState(false)
 const [company, setCompany] = useState('')
 const [contact, setContact] = useState('')
 const [value, setValue] = useState('')

 const { data: apiLeads = [] } = useGetLeadsQuery(companyId)
 const [createLead] = useCreateLeadMutation()
 const [updateLeadStatus] = useUpdateLeadStatusMutation()

 const leads = apiLeads

 const handleCreateLead = async (e) => {
   e.preventDefault()
   try {
     await createLead({ companyId, company, contact, value: Number(value), stage: 'New' }).unwrap()
     dispatch(addAlert({ type: 'success', message: `CRM Lead for "${company}" created successfully` }))
     setShowAddLead(false)
     setCompany('')
     setContact('')
     setValue('')
   } catch (err) {
     dispatch(addAlert({ type: 'error', message: 'Failed to create lead' }))
   }
 }

 const advanceStage = async (lead) => {
   const stages = ['New', 'Qualified', 'Proposal', 'Won']
   const currentIndex = stages.indexOf(lead.stage)
   if (currentIndex < stages.length - 1) {
     const nextStage = stages[currentIndex + 1]
     try {
       await updateLeadStatus({ id: lead.id, stage: nextStage, companyId }).unwrap()
       dispatch(addAlert({ type: 'info', message: `Lead advanced to stage: ${nextStage}` }))
     } catch (err) {
       dispatch(addAlert({ type: 'error', message: 'Failed to advance lead' }))
     }
   }
 }

 // Group leads by stage
 const getLeadsByStage = (stage) => leads.filter((l) => l.stage === stage)

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]">
 Sales & CRM Dashboard
 </h1>
 <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">
 Track potential business leads, manage client accounts, process orders and review sales analytics
 </p>
 </div>

 {canCreate() && (
 <button
 onClick={() => setShowAddLead(true)}
 className="btn-primary"
 >
 <Plus size={16} />
 Create CRM Lead
 </button>
 )}
 </div>

 {/* Stats row */}
 {(canViewModule('sales_analytics') || canViewModule('sales') || canViewModule('crm')) && (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4">
 <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-widest block">
 Pipeline Volume
 </span>
 <p className="currency text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mt-1"> ₹{leads.reduce((acc, c) => acc + (c.value || 0), 0).toLocaleString()}
 </p>
 </div>
 <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4">
 <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-widest block">
 Total Won Leads
 </span>
 <p className="currency text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mt-1"> ₹{leads.filter((l) => l.stage === 'Won').reduce((acc, c) => acc + (c.value || 0), 0).toLocaleString()}
 </p>
 </div>
 <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4">
 <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-widest block">
 Active Accounts
 </span>
 <p className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mt-1">
 14 Accounts
 </p>
 </div>
 </div>
 )}

 {/* Kanban Board */}
 {(canViewModule('sales_leads') || canViewModule('sales') || canViewModule('crm')) && (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
 {['New', 'Qualified', 'Proposal', 'Won'].map((stage) => {
 const items = getLeadsByStage(stage)
 return (
 <div key={stage} className="card bg-zinc-50 dark:bg-[#161922] dark:border-[#2A2F3D] p-4 space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-[#2A2F3D]">
 <span className="text-xs font-bold text-zinc-600 dark:text-[#E6E8EE] uppercase tracking-wider">{stage}</span>
 <span className="text-[8px] font-bold bg-zinc-200 dark:bg-[#1D212C] text-zinc-500 dark:text-[#A0A6B5] px-2 py-0.5 rounded-full">
 {items.length}
 </span>
 </div>

 <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-0.5">
 {items.map((item) => (
 <div
 key={item.id}
 className="card dark:bg-[#1D212C] dark:border-[#2A2F3D] p-3 space-y-2 group"
 >
 <div>
 <p className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.company}</p>
 <p className="text-[8px] text-zinc-450 dark:text-[#A0A6B5] mt-0.5">Contact: {item.contact}</p>
 </div>

 <div className="flex justify-between items-center pt-2 border-t border-zinc-50 dark:border-[#2A2F3D] mt-2">
 <span className="currency text-xs font-bold text-zinc-800 dark:text-[#E6E8EE]"> ₹{item.value?.toLocaleString()}
 </span>

 {stage !== 'Won' && (canEdit() || canApprove()) && (
 <button
 onClick={() => advanceStage(item)}
 className="p-1 hover:bg-zinc-55 dark:hover:bg-[#222736] rounded text-primary transition-colors"
 title="Advance pipeline stage"
 >
 <ArrowRight size={14} />
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )
 })}
 </div>
 )}

 {/* Creation Modal */}
 {showAddLead && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
 <div className="card max-w-md w-full p-4 space-y-4 animate-slide-up bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D]">
 <div className="flex justify-between items-center">
 <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
 Create CRM Lead
 </h3>
 <button onClick={() => setShowAddLead(false)} className="text-zinc-400 dark:text-[#6B7184] hover:text-zinc-650 dark:hover:text-[#E6E8EE]">✕</button>
 </div>

 <form onSubmit={handleCreateLead} className="space-y-4">
 <div className="space-y-1">
 <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Lead Company Name</label>
 <input
 type="text"
 placeholder="e.g. Apex Software Corp"
 value={company}
 onChange={(e) => setCompany(e.target.value)}
 className="input-field"
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Lead Contact Name</label>
 <input
 type="text"
 placeholder="Liam Neeson"
 value={contact}
 onChange={(e) => setContact(e.target.value)}
 className="input-field"
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Estimated Pipeline Value (₹)</label>
 <input
 type="number"
 placeholder="15000"
 value={value}
 onChange={(e) => setValue(e.target.value)}
 className="input-field font-mono"
 required
 />
 </div>

 <button type="submit" className="w-full btn-primary justify-center">
 Save CRM Record
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}


