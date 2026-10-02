import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState } from 'react'
import { Users, UserPlus, Clock, Calendar, Heart, Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'
import { useGetEmployeesQuery, useCreateEmployeeMutation } from '../../../api/hr'
import { useRBAC } from '../../../utils/rbac'

export default function HRDashboard() {
  const companyId = useParams().companyId
    || JSON.parse(localStorage.getItem('selected_company'))?.id
    || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const dispatch = useAppDispatch()
  const { canViewModule, canCreate } = useRBAC()

  const [showAdd, setShowAdd] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('directory') // 'directory' | 'roster' | 'payroll'

  // Form state for the Register Employee modal
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [dept, setDept] = useState('Engineering')

  const { data: apiStaff = [], isLoading } = useGetEmployeesQuery(companyId)
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation()

  const staff = apiStaff.map(s => ({ ...s, dept: s.department, shift: s.shift || '09:00 - 17:00' }))
  const clockedIn = false
  const clockTime = ''

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name || !email || !role) {
      dispatch(addAlert({ type: 'warning', message: 'Name, email, and designation are required.' }))
      return
    }
    try {
      await createEmployee({ companyId, name, email, role, department: dept }).unwrap()
      dispatch(addAlert({ type: 'success', message: `Employee "${name}" registered successfully.` }))
      // Reset form
      setName('')
      setEmail('')
      setRole('')
      setDept('Engineering')
      setShowAdd(false)
    } catch (error) {
      console.error('Failed to register employee:', error)
      dispatch(addAlert({ type: 'error', message: error?.data?.message || 'Failed to register employee.' }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            HR &amp; Employees
          </h1>
          <p className="text-xs text-zinc-500 font-medium">
            Manage staff listings, attendance punch sheets, rosters and performance reviews
          </p>
        </div>

        {canCreate() && (
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <UserPlus size={16} />
            Register Employee
          </button>
        )}
      </div>

      {/* Attendance punch card */}
      {(canViewModule('hr_attendance') || canViewModule('hr')) && (
        <div className="card p-4 bg-gradient-to-r from-primary-50 to-indigo-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900">Attendance Punch Station</h3>
            <p className="text-xs text-zinc-500">
              {clockedIn ? `Clocked in since ${clockTime}` : 'You are currently off-duty'}
            </p>
          </div>

          <button
            disabled={true}
            className={`btn-primary shadow-md active:scale-95 ${
              clockedIn
                ? 'bg-danger hover:bg-danger/90 border-danger'
                : 'bg-success hover:bg-success/90 border-success'
            }`}
          >
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="border-b border-zinc-200">
        <nav className="flex gap-6 -mb-px">
          {['directory', 'roster', 'payroll']
                    .filter(tab => {
              if (tab === 'directory') return canViewModule('hr_profile') || canViewModule('hr');
              if (tab === 'roster') return canViewModule('hr_shifts') || canViewModule('hr');
              if (tab === 'payroll') return canViewModule('hr_payroll') || canViewModule('hr');
              return false;
            })
            .map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeSubTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {tab}
              </button>
            ))}
        </nav>
      </div>

      {/* Directory Content */}
      {activeSubTab === 'directory' && (
        <div className="card overflow-hidden relative">
          {isLoading && <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 text-[8px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <th className="w-12 text-center">S.No.</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Designation</th>
                  <th className="py-4 px-6">Roster Shift</th>
                  <th className="py-4 px-6">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700 staggered-list">
                {staff.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-zinc-50/50">
                    <td className="text-center font-medium text-zinc-500">{index + 1}</td>
                    <td className="py-4 px-6 font-semibold text-zinc-900">
                      {emp.name}
                      <span className="block text-[8px] text-zinc-400 font-normal">{emp.email}</span>
                    </td>
                    <td className="py-4 px-6 font-medium text-zinc-500">{emp.dept}</td>
                    <td className="py-4 px-6 font-mono text-xs">{emp.role}</td>
                    <td className="py-4 px-6 text-xs text-zinc-500">{emp.shift}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`badge ${
                          emp.status === 'present'
                            ? 'badge-success'
                            : 'badge-danger'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && staff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-400 text-sm">
                      No employees found. Register one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roster & Payroll placeholder states */}
      {activeSubTab !== 'directory' && (
        <div className="card p-4 text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            {activeSubTab === 'roster' ? <Calendar size={24} /> : <Heart size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 capitalize">{activeSubTab} Dashboard</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Roster allocations, shift planning, payouts processing and salary slips are managed here.
            </p>
          </div>
        </div>
      )}

      {/* Register Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-4 space-y-4 animate-slide-up">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900">
                Register New Employee
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Staff Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Liam Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 block">Workspace Email *</label>
                <input
                  type="email"
                  placeholder="liam@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Designation *</label>
                  <input
                    type="text"
                    placeholder="HR Assistant"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 block">Department</label>
                  <CustomSelect
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="input-field appearance-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Human Resources">HR</option>
                    <option value="Sales">Sales</option>
                  </CustomSelect>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full btn-primary justify-center disabled:opacity-70"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Add to Registry'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
