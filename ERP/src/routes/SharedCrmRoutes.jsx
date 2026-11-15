import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
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

// ─── Receivables, Orders, Invoices & Audit (Legacy & Unified) ────────────────
const SalesOrders = lazy(() => import('../features/sales/pages/SalesOrdersPage'));
const SalesInvoices = lazy(() => import('../features/sales/pages/SalesInvoices'));
const InvoicePreviewPage = lazy(() => import('../features/sales/pages/InvoicePreviewPage'));
const SalesInvoiceDetails = lazy(() => import('../features/sales/pages/SalesInvoiceDetails'));
const CustomerManagement = lazy(() => import('../features/account/pages/CustomerManagement'));
const CustomerDetails = lazy(() => import('../features/account/pages/CustomerDetails'));
const SalesAnalytics = lazy(() => import('../features/sales/pages/SalesAnalytics'));
const AuditLogsPage = lazy(() => import('../features/audit/pages/AuditLogsPage'));

/**
 * Shared CRM & Sales routes — can be mounted under /crm/*, /sales-crm/*, or company prefix.
 * @param {{ prefix: string }} options  e.g. { prefix: "" } or { prefix: "sales-crm/" }
 */
export function SharedCrmRoutes({ prefix = "" }) {
  return (
    <>
      {/* 1. Dashboard */}
      <Route
        path={`${prefix}dashboard`}
        element={
          <ProtectedRoute module="CRM">
            <CrmDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 2. Leads */}
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

      {/* 3. Accounts */}
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

      {/* 4. Contacts */}
      <Route
        path={`${prefix}contacts`}
        element={
          <ProtectedRoute module="CRM">
            <ContactsPage />
          </ProtectedRoute>
        }
      />

      {/* 5. Opportunities */}
      <Route
        path={`${prefix}opportunities`}
        element={
          <ProtectedRoute module="CRM">
            <OpportunitiesPage />
          </ProtectedRoute>
        }
      />

      {/* 6. Pipelines */}
      <Route
        path={`${prefix}pipelines`}
        element={
          <ProtectedRoute module="CRM">
            <PipelinesPage />
          </ProtectedRoute>
        }
      />

      {/* 7. Quotations */}
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

      {/* 8. Tasks */}
      <Route
        path={`${prefix}tasks`}
        element={
          <ProtectedRoute module="CRM">
            <TasksPage />
          </ProtectedRoute>
        }
      />

      {/* 9. Activities */}
      <Route
        path={`${prefix}activities`}
        element={
          <ProtectedRoute module="CRM">
            <ActivitiesPage />
          </ProtectedRoute>
        }
      />

      {/* 10. Campaigns */}
      <Route
        path={`${prefix}campaigns`}
        element={
          <ProtectedRoute module="CRM">
            <CampaignsPage />
          </ProtectedRoute>
        }
      />

      {/* 11. Attribution */}
      <Route
        path={`${prefix}attribution`}
        element={
          <ProtectedRoute module="CRM">
            <AttributionPage />
          </ProtectedRoute>
        }
      />

      {/* 12. Customer Communication (both plural and singular aliases) */}
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

      {/* 13. Automation */}
      <Route
        path={`${prefix}automation`}
        element={
          <ProtectedRoute module="CRM">
            <AutomationPage />
          </ProtectedRoute>
        }
      />

      {/* 14. Integrations */}
      <Route
        path={`${prefix}integrations`}
        element={
          <ProtectedRoute module="CRM">
            <IntegrationsPage />
          </ProtectedRoute>
        }
      />

      {/* 15. Settings */}
      <Route
        path={`${prefix}settings`}
        element={
          <ProtectedRoute module="CRM">
            <CrmSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* 16. Sales Orders */}
      <Route
        path={`${prefix}orders`}
        element={
          <ProtectedRoute module="SALES_ORDERS">
            <SalesOrders />
          </ProtectedRoute>
        }
      />

      {/* 17. Invoices & Invoices Preview/Details */}
      <Route
        path={`${prefix}invoices`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <SalesInvoices />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}invoices/create-from-order/:salesOrderId`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <InvoicePreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}invoices/:id`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <SalesInvoiceDetails />
          </ProtectedRoute>
        }
      />

      {/* 18. Audit Logs */}
      <Route
        path={`${prefix}audit`}
        element={
          <ProtectedRoute module="AUDIT_LOGS">
            <AuditLogsPage moduleFilter="Sales" />
          </ProtectedRoute>
        }
      />

      {/* Receivables & Analytics backward-compatibility */}
      <Route
        path={`${prefix}customers`}
        element={
          <ProtectedRoute module="CUSTOMERS">
            <CustomerManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}customers/:id`}
        element={
          <ProtectedRoute module="CUSTOMERS">
            <CustomerDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}analytics`}
        element={
          <ProtectedRoute module="ANALYTICS">
            <SalesAnalytics />
          </ProtectedRoute>
        }
      />
    </>
  );
}

export default SharedCrmRoutes;
