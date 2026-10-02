import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'

/**
 * Vite-optimized lazy loading with dynamic imports
 * Each lazy() import creates a separate chunk for code splitting
 * Suspense boundary handles loading state during chunk download
 */

// Pages - Non-customer routes
const Home = lazy(() => import('../features/dashboard/pages/Home'))
const CompanyDetails = lazy(() => import('../features/company-management/pages/CompanyDetails'))
const FinanceDashboard = lazy(() => import('../features/finance/pages/FinanceDashboard'))

// Pages - Customer routes (chunked separately) - Removed as they are dead code
// Fallback component for loading state
const LoadingFallback = () => <LoadingSpinner fullscreen />

export default function AppRouter() {
  const routerBasename = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL))
    ? (import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL).replace(/\/$/, '')
    : '/erp'
  return (
    <BrowserRouter basename={routerBasename || '/erp'}>
 <Suspense fallback={<LoadingFallback />}>
 <Routes>
 {/* Dashboard & Company routes */}
 <Route path="/" element={<Home />} />
 <Route path="/company/:id" element={<CompanyDetails />} />
 <Route path="/finance/:id" element={<FinanceDashboard />} />


 {/* Fallback route */}
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </Suspense>
 </BrowserRouter>
 )
}
