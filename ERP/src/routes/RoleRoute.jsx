import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { selectSelectedCompany } from '../features/company-management/companySlice'
import { selectCurrentUser } from '../features/auth/authSlice'
import { useRBAC, ROLES } from '../utils/rbac'

export default function RoleRoute({ children, allowedRoles = [], requiredPermission = null }) {
  const currentUser = useAppSelector(selectCurrentUser)
  const selectedCompany = useAppSelector(selectSelectedCompany)
  const sessionStatus = useAppSelector(state => state.auth?.sessionStatus)
  const { companyId } = useParams()

  const { roleName, canViewModule, isOwner, isSuperAdmin } = useRBAC()

  // During initial bootstrap/session verification, display loader instead of premature redirect
  if (sessionStatus === 'idle' || sessionStatus === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/modules" replace />
  }

  const userRole = currentUser.role

  // Super Admin bypasses all checks
  if (userRole === 'super_admin' || roleName === ROLES.SUPER_ADMIN || isSuperAdmin) {
    return children
  }

  // If page restricts by specific role names
  if (allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase().replace(/[\s_]/g, ''))
    const normalizedCurrent = String(roleName || userRole || '').toLowerCase().replace(/[\s_]/g, '')
    const isOwnerMatch = (isOwner || userRole === 'owner') && (normalizedAllowed.includes('owner') || normalizedAllowed.includes('companyadmin'))
    const isAllowed = normalizedAllowed.includes(normalizedCurrent) || isOwnerMatch

    if (!isAllowed) {
      return <Navigate to="/403" replace />
    }
  }

  if (companyId && selectedCompany && selectedCompany.id.toString() !== companyId.toString()) {
    return <Navigate to="/modules" replace />
  }

  // Enforce specific module access via RBAC hook
  if (requiredPermission) {
    if (!canViewModule(requiredPermission)) {
      return <Navigate to="/403" replace />
    }
  }

  return children
}
