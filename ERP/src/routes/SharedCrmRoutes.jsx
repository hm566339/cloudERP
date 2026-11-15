import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// ─── Sales & CRM Feature Pages ───────────────────────────────────────────────
const CrmDashboardPage = lazy(() => import('../features/sales-crm/pages/CrmDashboardPage'));
const LeadsPage = lazy(() => import('../features/sales-crm/pages/LeadsPage'));
const LeadDetailsPage = lazy(() => import('../features/sales-crm/pages/LeadDetailsPage'));
const AccountsPage = lazy(() => import('../features/sales-crm/pages/AccountsPage'));
const AccountDetailsPage = lazy(() => import('../features/sales-crm/pages/AccountDetailsPage'));
const ContactsPage = lazy(() => import('../features/sales-crm/pages/ContactsPage'));
const OpportunitiesPage = lazy(() => import('../features/sales-crm/pages/OpportunitiesPage'));
const PipelinesPage = lazy(() => import('../features/sales-crm/pages/PipelinesPage'));
const QuotationsPage = lazy(() => import('../features/sales-crm/pages/QuotationsPage'));
const QuotationDetailsPage = lazy(() => import('../features/sales-crm/pages/QuotationDetailsPage'));
const TasksPage = lazy(() => import('../features/sales-crm/pages/TasksPage'));
const ActivitiesPage = lazy(() => import('../features/sales-crm/pages/ActivitiesPage'));
const CampaignsPage = lazy(() => import('../features/sales-crm/pages/CampaignsPage'));
const AttributionPage = lazy(() => import('../features/sales-crm/pages/AttributionPage'));
const CommunicationsPage = lazy(() => import('../features/sales-crm/pages/CommunicationsPage'));
const AutomationPage = lazy(() => import('../features/sales-crm/pages/AutomationPage'));
const IntegrationsPage = lazy(() => import('../features/sales-crm/pages/IntegrationsPage'));
const CrmSettingsPage = lazy(() => import('../features/sales-crm/pages/CrmSettingsPage'));

/**
 * Shared CRM & Sales routes — can be mounted under /crm/*, /sales-crm/*, or company prefix.
 * @param {{ prefix: string }} options  e.g. { prefix: "" } or { prefix: "sales-crm/" }
 */
export function SharedCrmRoutes({ prefix = "" }) {
  return (
    <>
      <Route
        path={`${prefix}dashboard`}
        element={
          <ProtectedRoute module="CRM">
            <CrmDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}leads`}
        element={
          <ProtectedRoute module="CRM">
            <LeadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}leads/:id`}
        element={
          <ProtectedRoute module="CRM">
            <LeadDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}accounts`}
        element={
          <ProtectedRoute module="CRM">
            <AccountsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}accounts/:id`}
        element={
          <ProtectedRoute module="CRM">
            <AccountDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}contacts`}
        element={
          <ProtectedRoute module="CRM">
            <ContactsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}opportunities`}
        element={
          <ProtectedRoute module="CRM">
            <OpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}pipelines`}
        element={
          <ProtectedRoute module="CRM">
            <PipelinesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}quotations`}
        element={
          <ProtectedRoute module="CRM">
            <QuotationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}quotations/:id`}
        element={
          <ProtectedRoute module="CRM">
            <QuotationDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}tasks`}
        element={
          <ProtectedRoute module="CRM">
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}activities`}
        element={
          <ProtectedRoute module="CRM">
            <ActivitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}campaigns`}
        element={
          <ProtectedRoute module="CRM">
            <CampaignsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}attribution`}
        element={
          <ProtectedRoute module="CRM">
            <AttributionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}communications`}
        element={
          <ProtectedRoute module="CRM">
            <CommunicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}communication`}
        element={
          <ProtectedRoute module="CRM">
            <CommunicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}automation`}
        element={
          <ProtectedRoute module="CRM">
            <AutomationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}integrations`}
        element={
          <ProtectedRoute module="CRM">
            <IntegrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}settings`}
        element={
          <ProtectedRoute module="CRM">
            <CrmSettingsPage />
          </ProtectedRoute>
        }
      />
    </>
  );
}

export default SharedCrmRoutes;

