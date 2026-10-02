import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { selectSelectedCompany } from '../features/company-management/companySlice'
import { selectCurrentUser } from '../features/auth/authSlice'
import { useRBAC, ROLES } from '../utils/rbac'

export default function RoleRoute({ children, allowedRoles = [], requiredPermission = null }) {
  const currentUser = useAppSelector(selectCurrentUser)
  const selectedCompany = useAppSelector(selectSelectedCompany)
  const { companyId } = useParams()

  const { roleName, canViewModule } = useRBAC()

  if (!currentUser) {
    return <Navigate to="/modules" replace />
  }

  const userRole = currentUser.role

  // Super Admin bypasses all checks
  if (userRole === 'super_admin' || roleName === ROLES.SUPER_ADMIN) {
    return children
  }

  // If page restricts by specific role names
  if (allowedRoles.length > 0 && !allowedRoles.includes(roleName)) {
    if (selectedCompany) {
      return <Navigate to={`/company/${selectedCompany.id}/dashboard`} replace />
    }
    return <Navigate to="/company-select" replace />
  }

  if (companyId && selectedCompany && selectedCompany.id.toString() !== companyId.toString()) {
    return <Navigate to={`/modules`} replace />
  }

  // Enforce specific module access via RBAC hook
  if (requiredPermission) {
    if (!canViewModule(requiredPermission)) {
      return (
        <Navigate
          to={selectedCompany ? `/company/${selectedCompany.id}/dashboard` : '/company-select'}
          replace
        />
      )
    }
  }

  return children
}
