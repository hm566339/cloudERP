import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit, FileText, CheckCircle2 } from 'lucide-react';
import { useGetEmployeesQuery } from '../../../api/hr';
import EmployeeExpenseBalance from '../components/EmployeeExpenseBalance';

export default function EmployeeProfile() {
  const { data: empData, isLoading } = useGetEmployeesQuery({ page: 1, limit: 1 });
  
  const empList = empData?.items || [];
  const employee = empList.length > 0 ? empList[0] : null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-2 flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="w-full"><ListSkeleton items={3} /></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6 animate-fade-in p-2 flex flex-col items-center justify-center min-h-[320px] bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
        <User size={48} className="text-zinc-300 mb-4" />
        <h2 className="text-lg font-bold text-zinc-700">No Employee Found</h2>
        <p className="text-sm text-zinc-500">No active employees exist in the database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Employee Profile</h1>
        <button className="btn-secondary"><Edit size={16} /> Edit Profile</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: ID Card & Contact */}
        <div className="space-y-6">
          <div className="card p-4 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-500 to-indigo-500"></div>
            <div className="w-24 h-24 rounded-full border-4 border-white bg-zinc-100 flex items-center justify-center text-3xl font-bold text-primary shadow-md relative z-10 mt-6">
              {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mt-4">{employee.firstName} {employee.lastName}</h2>
            <p className="text-sm text-zinc-500 font-medium">{employee.designation || employee.role || 'Employee'}</p>
            <span className="badge badge-success border-emerald-200 mt-3 font-bold">
              <CheckCircle2 size={12} className="mr-1" /> {employee.status || 'Active'}
            </span>
          </div>

          <div className="card p-4 space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">Contact Info</h3>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-zinc-400" />
              <span className="text-zinc-700">{employee.email || employee.workEmail || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-zinc-400" />
              <span className="text-zinc-700">{employee.phone || employee.contactNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-zinc-400" />
              <span className="text-zinc-700">{employee.location || employee.address?.city || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Work Details & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-zinc-800 mb-4">Work Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Department</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <Briefcase size={16} className="text-primary" />
                  {employee.department?.name || employee.department || 'Unassigned'}
                </div>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Direct Manager</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <User size={16} className="text-indigo-500" />
                  {employee.manager?.name || employee.reportingTo?.name || 'N/A'}
                </div>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Date Joined</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <Calendar size={16} className="text-amber-500" />
                  {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Employee ID</p>
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-zinc-800">
                  <FileText size={16} className="text-emerald-500" />
                  {employee.employeeId || employee.code || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <EmployeeExpenseBalance employeeId={employee?.id || employee?.employeeId || employee?._id || 'EMP-001'} />

          <div className="card p-4 min-h-[200px]">
            <h3 className="text-sm font-bold text-zinc-800 mb-4">Recent Documents & Assets</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg bg-zinc-50">
                 <p className="text-xs text-zinc-400 italic">No documents attached yet.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
