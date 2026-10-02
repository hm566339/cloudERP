
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState } from 'react'
import { Store, Plus, CheckCircle, XCircle, Users } from 'lucide-react'
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'
import { useRBAC } from '../../../utils/rbac'

const initialVendors = [
 { id: 'v1', name: 'Global Components Ltd', contact: 'M. Adams', category: 'Raw Materials', active: true },
 { id: 'v2', name: 'Microchip Fab Services', contact: 'K. Patel', category: 'Semiconductors', active: true },
 { id: 'v3', name: 'Mark Logistics Inc', contact: 'J. Harper', category: 'Shipping & Delivery', active: false },
]

const initialRequests = [
 { id: 'PR-900', creator: 'Liam Engineer', item: 'Replacement Server Rack CPU', qty: 2, total: 3200, status: 'pending' },
 { id: 'PR-901', creator: 'Sarah Office Manager', item: 'Ergonomic Desk Chairs', qty: 10, total: 1800, status: 'approved' },
 { id: 'PR-902', creator: 'John Lab Tech', item: 'Precision Osciloscope Probe', qty: 1, total: 1200, status: 'pending' },
]

export default function PurchaseDashboard() {
 const dispatch = useAppDispatch()
 const { canCreate, canViewModule, canApprove } = useRBAC()
 const [vendors, setVendors] = useState(initialVendors)
 const [requests, setRequests] = useState(initialRequests)

 const [showAddVendor, setShowAddVendor] = useState(false)
 const [name, setName] = useState('')
 const [contact, setContact] = useState('')
 const [category, setCategory] = useState('Raw Materials')

 const handleCreateVendor = (e) => {
 e.preventDefault()
 if (!name || !contact) return

 const newVendor = {
 id: (vendors.length + 1).toString(),
 name,
 contact,
 category,
 active: true,
 }

 setVendors([...vendors, newVendor])
 setShowAddVendor(false)
 setName('')
 setContact('')
 dispatch(addAlert({ type: 'success', message: `Vendor"${name}" registered successfully` }))
 }

 const handleRequestApproval = (id, approved) => {
 setRequests((prev) =>
 prev.map((req) => (req.id === id ? { ...req, status: approved ? 'approved' : 'rejected' } : req))
 )
 dispatch(
 addAlert({
 type: approved ? 'success' : 'error',
 message: `Purchase Requisition ${id} has been ${approved ? 'approved for billing' : 'rejected'}.`,
 })
 )
 }

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900">
 Purchase & Procurement
 </h1>
 <p className="text-xs text-zinc-500 font-medium">
 Manage supply vendors, handle purchase request workflows, track quotations and process supplier bills
 </p>
 </div>

 {canCreate() && (
 <button
 onClick={() => setShowAddVendor(true)}
 className="btn-primary"
 >
 <Plus size={16} />
 Register Supplier
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
 {/* Vendor directory */}
 {(canViewModule('pur_vendors') || canViewModule('purchases') || canViewModule('vendors')) && (
 <div className="card p-4 lg:col-span-2 space-y-4">
 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
 Registered Vendor Directory
 </h3>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-200 pb-3">
                <th className="w-12 text-center">S.No.</th>
 <th className="pb-3 pr-4">Vendor Name</th>
 <th className="pb-3 px-4">Contact</th>
 <th className="pb-3 px-4">Supply Category</th>
 <th className="pb-3 px-4 text-center">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100 text-zinc-700 staggered-list">
 {vendors.map((v, index) => (
 <tr key={v.id} className="hover:bg-zinc-50/50">
                    <td className="text-center font-medium text-zinc-500">{index + 1}</td>
 <td className="py-4 font-semibold text-zinc-900 flex items-center gap-2">
 <Store size={14} className="text-zinc-400" />
 {v.name}
 </td>
 <td className="py-4 px-4 text-zinc-500 font-medium">
 {v.contact}
 </td>
 <td className="py-4 px-4 text-xs font-mono">
 {v.category}
 </td>
 <td className="py-4 px-4 text-center">
 <span className={`badge font-bold text-[8px] ${v.active ? 'badge-success ' : 'bg-zinc-100 text-zinc-500'}`}>
 {v.active ? 'Active Supplier' : 'Suspended'}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Purchase Request Approval Panel */}
 {(canViewModule('pur_approve') || canViewModule('purchases') || canViewModule('pur_requests')) && (
 <div className="card p-4 space-y-4 lg:col-span-1">
 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
 Requisition Approvals Workflow
 </h3>

 <div className="space-y-3">
 {requests.map((req) => {
 const isPending = req.status === 'pending'
 return (
 <div
 key={req.id}
 className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3"
 >
 <div className="flex justify-between items-start">
 <div>
 <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
 <p className="text-xs font-bold text-zinc-800 mt-0.5">{req.item}</p>
 <p className="text-[8px] text-zinc-500">Created by: {req.creator}</p>
 </div>
 <span className={`badge text-[7.2px] font-bold capitalize ${
 req.status === 'approved' ? 'badge-success ' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning '
 }`}>
 {req.status}
 </span>
 </div>

 <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
 <span className="text-xs font-bold text-zinc-700">
 Value: ${req.total.toLocaleString()}
 </span>

 {isPending && (
 <div className="flex gap-2">
 <button
 onClick={() => handleRequestApproval(req.id, true)}
 className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
 title="Approve purchase request"
 >
 <CheckCircle size={16} />
 </button>
 <button
 onClick={() => handleRequestApproval(req.id, false)}
 className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
 title="Reject purchase request"
 >
 <XCircle size={16} />
 </button>
 </div>
 )}
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}
 </div>

 {/* Register Vendor Modal */}
 {showAddVendor && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
 <div className="card max-w-md w-full p-4 space-y-4 animate-slide-up">
 <div className="flex justify-between items-center">
 <h3 className="text-lg font-bold text-zinc-900">
 Register Supplier Vendor
 </h3>
 <button onClick={() => setShowAddVendor(false)} className="text-zinc-400 hover:text-zinc-650">✕</button>
 </div>

 <form onSubmit={handleCreateVendor} className="space-y-4">
 <div className="space-y-1">
 <label className="text-xs font-bold text-zinc-500 block">Vendor Company Name</label>
 <input
 type="text"
 placeholder="e.g. Apex Logistical supplies"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="input-field"
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-bold text-zinc-500 block">Contact Representative</label>
 <input
 type="text"
 placeholder="Meredith Grey"
 value={contact}
 onChange={(e) => setContact(e.target.value)}
 className="input-field"
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-bold text-zinc-500 block">Supply category</label>
 <CustomSelect
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="input-field"
 >
 <option value="Raw Materials">Raw Materials</option>
 <option value="Semiconductors">Semiconductors</option>
 <option value="Shipping & Delivery">Shipping & Delivery</option>
 <option value="IT Equipment">IT Equipment</option>
 </CustomSelect>
 </div>

 <button type="submit" className="w-full btn-primary justify-center">
 Register Supplier
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
