import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectAuthContext, selectCurrentUser } from '../features/auth/authSlice';
import OwnerLayout from './OwnerLayout';
import AccountantLayout from './AccountantLayout';
import CompanyLayout from './CompanyLayout';

function AppShellContent() {
  const authContext = useAppSelector(selectAuthContext);
  const currentUser = useAppSelector(selectCurrentUser);
  const location = useLocation();

  const rawRole = currentUser?.role || 'employee';
  const userRole = String(Array.isArray(rawRole) ? (rawRole[0]?.name || rawRole[0]) : (rawRole?.name || rawRole)).toLowerCase();

  const isOwner =
    userRole === 'owner' ||
    authContext?.membership?.memberType === 'OWNER' ||
    authContext?.user?.role === 'owner' ||
    authContext?.user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER'));

  const isAccountant =
    userRole?.toUpperCase() === 'ACCOUNTANT' ||
    (Array.isArray(currentUser?.roles) && currentUser.roles.some((r) => {
      const name = typeof r === 'string' ? r : (r?.name || r?.code || '');
      return String(name).toUpperCase() === 'ACCOUNTANT' || String(name).toUpperCase() === 'ROLE_ACCOUNTANT';
    }));

  const isOwnerWorkspace =
    location.pathname.startsWith('/owner') ||
    location.pathname.startsWith('/organization') ||
  location.pathname.startsWith('/subscription') ||
    location.pathname.startsWith('/settings/organization');

  if (isOwner && isOwnerWorkspace) {
    return <OwnerLayout />;
  }

  if (isAccountant) {
    return <AccountantLayout />;
  }

  return <CompanyLayout />;
}

export default function AppShellLayout() {
  return <AppShellContent />;
}
