# MARK2 ERP — COMPREHENSIVE PROJECT AUDIT & LANDING PAGE REDESIGN BLUEPRINT

**Generated:** October 31, 2026  
**Auditor:** Senior SaaS Product Designer, Full-Stack Architect & ERP Product Analyst  
**Project:** Mark2 ERP Enterprise Cloud Platform  
**Target Environment:** Production (`www.mark2.in`) & Local Development Stack  

---

## EXECUTIVE SUMMARY

Mark2 ERP is a production-grade, multi-tenant enterprise resource planning (ERP) platform designed specifically for holding corporations, conglomerates, and expanding multi-company enterprises in India and global markets.

The application combines a high-performance **React 18 + Vite** frontend with a **Spring Boot 3 + PostgreSQL** microservices backend, connected through a unified Spring Cloud Gateway / reverse proxy. The system is engineered around strict multi-tenant boundaries, double-entry financial accounting, Indian statutory tax compliance (GST/HSN/SAC), multi-warehouse inventory tracking, procurement and sales cycles, and a configurable workflow engine.

This document presents a comprehensive 20-dimension audit of the actual codebase, followed by a gap analysis of the existing public landing page and the architectural blueprint for its transformation into a premium SaaS conversion engine.

---

## PART 1: COMPLETE PROJECT SCANNING (20 DIMENSIONS)

### 1. Frontend Framework & Architecture
- **Technology:** React 18.2.0, Vite 8.1.4, Redux Toolkit 2.12.0, React Router v6.22.0, Redux Persist 6.0.0.
- **Styling Engine:** Tailwind CSS 3.4.19 with custom corporate design tokens:
  - Forest Green (Primary Action): `#2E3D28` / `#3C4E34`
  - Sage Nature (Secondary Accent): `#A9B887` / `#DCE2CF`
  - Warm Stone / Cream (Canvas Surface): `#E8E9DF` / `#EDEEE4`
  - Light Card Surface: `#F7F7F0` / `#FFFFFF`
  - Dark Mode Surfaces: `#0F1117`, `#161922`, `#1D212C`, `#2A2F3D`
- **Component Pattern:** Feature-sliced folder architecture (`src/features/*`), shared layout wrappers (`src/layouts/*`), shared domain routers (`SharedAccountsRoutes`, `SharedInventoryRoutes`, `SharedCompanyRoutes`), and single-flight token refresh mutex (`src/api/common/singleFlightRefresh.js`).
- **Icons & Data Visualization:** `lucide-react` (v0.344.0), `recharts` (v3.8.1).
- **Status:** **Fully Implemented**.

### 2. Backend Framework & API Architecture
- **Technology:** Spring Boot 3.x, Java 17, Maven multi-module architecture.
- **Service Mesh:**
  - `gateway_service` (Port 8080): Spring Cloud Gateway reverse proxy routing `/api/sso/**`, `/api/account/**`, `/api/inventory/**`, `/api/workflow/**`, `/api/manufacturing/**`.
  - `ERP_System` (`auth-service`: Port 8090): Authentication, OAuth2/SSO, Tenant isolation, Multi-Company, Memberships, Subscriptions, Razorpay payments, Organization Settings, Dynamic 2FA & Session Timeout.
  - `account-main` (`account-service`: Port 8080 internal): General Ledger, Chart of Accounts, Journal Vouchers, Sales/Purchase Invoices, Quotations, Bank Reconciliation, GSTR-1, GSTR-2B, GSTR-3B.
  - `inventory` (`inventory-service`: Port 8082 internal): Warehouses, Bin Locations, Stock Movements, Stock Transfers, Batches, Serials, Cost Layers (FIFO).
  - `workflow-service` (`workflow-service`: Port 8083 internal): Dynamic approval matrices, multi-stage task transitions, transaction audits.
  - `manufacturing` (`manufacturing-service`: Port 8085 internal): Bill of Materials (BOM), Production Orders, Material Consumption.
  - `communication-service`: Email and event notifications.
- **Response Format:** Standardized `ResponseWrapper<T>` (`{ success: true, message: "...", data: { ... } }`).
- **Status:** **Fully Implemented**.

### 3. Database & ORM
- **Database:** PostgreSQL 16 Alpine with connection pooling via HikariCP.
- **ORM:** Hibernate 6.x / Spring Data JPA with UUID primary keys and foreign key constraints (`ON DELETE CASCADE` / `RESTRICT`).
- **Migration & Bootstrap:** Flyway migration files (`V1` to `V10`) paired with self-healing schema bootstrap (`DatabaseSchemaBootstrap.java`).
- **Message Broker:** RabbitMQ 3.13 for decoupled event pipelines.
- **Status:** **Fully Implemented**.

### 4. Existing Routes & Pages
- **Public Routes:**
  - `/` (Root Index Handler: renders `LandingPage` for unauthenticated visitors, redirects authenticated users to dashboard).
  - `/landing` (Direct landing route).
  - `/try-free` (Self-provisioning 30-day trial registration: `TrialSignupPage.jsx`).
  - `/o/:organizationCode/login` (Dedicated organization tenant login portal).
  - `/c/:companyCode/login` (Dedicated subsidiary company portal).
  - `/admin-login` (Platform Super Admin login).
  - `/forgot-password`, `/reset-password`, `/verify-email`.
- **Protected Application Spaces:**
  - `/company-select` (Organization multi-company switcher).
  - `/company/:companyId/dashboard` (Consolidated executive multi-module dashboard).
  - `/accounts/*` (General ledger, vouchers, receivables, payables, reports).
  - `/sales/*` (Quotations, sales orders, delivery challans, tax invoices).
  - `/purchase/*` (Requisitions, RFQs, POs, supplier quotes, GRN, payment vouchers).
  - `/inventory/*` (Warehouses, stock levels, adjustments, batches, tracking).
  - `/gst-reports/*` (GSTR-1, GSTR-2B, GSTR-3B, state masters).
  - `/workflows/*` (Rules, approval inboxes, transitions, history).
  - `/settings/*` (General settings, organization settings, appearance studio, roles & permissions).
- **Status:** **Fully Implemented**.

### 5. All ERP Modules & Actual Functionality
- **Finance & Accounts (`ACCOUNT`):** **Fully Implemented**. Double-entry general ledger, customizable chart of accounts, journal entries, balance sheet, profit & loss, trial balance.
- **Sales & Revenue Operations (`SALES`):** **Fully Implemented**. Quotation workflow, quote-to-order conversion, tax invoicing, delivery challan dispatch.
- **Procurement & Vendor Management (`PURCHASE`):** **Fully Implemented**. Requisitions (PR), RFQs, purchase orders (PO), 3-way matching, goods receipts (GRN), payment vouchers.
- **Multi-Warehouse Inventory (`INVENTORY`):** **Fully Implemented**. Multi-warehouse locations, bin locations, batch/serial tracking, stock transfers, FIFO valuation.
- **Statutory GST & Taxes (`ACCOUNT` / `GST`):** **Fully Implemented**. CGST/SGST/IGST calculation based on place of supply, HSN/SAC codes, GSTR-1, GSTR-2B, GSTR-3B summaries.
- **Workflows & Governance (`WORKFLOW`):** **Fully Implemented**. Configurable approval rules, stage progression, document flow transitions.
- **Manufacturing (`MANUFACTURING`):** **Partially Implemented**. BOM models, work orders, production routing APIs exist and are routed; frontend UI in progress.
- **HR & Payroll (`HR`):** **Partially Implemented**. Employee lists, basic attendance/leave models; payroll calculation engine is planned.

### 6. Authentication & Authorization
- Dual JWT access token + HttpOnly refresh token architecture.
- Session concurrency tracking with single-flight refresh queue.
- Dynamic session timeout enforced at database level per organization (5 to 720 minutes).
- Dynamic Two-Factor Authentication (2FA) enforcement supported.
- Dedicated portal slugs: `/o/:organizationCode/login`.
- **Status:** **Fully Implemented**.

### 7. Organization & Multi-Company Management
- Top-level `Organization` tenant entity with unique immutable code and UUID.
- Multi-company structure: One organization owns multiple `Company` subsidiaries (e.g. Apex HQ, Apex Logistics, Apex Manufacturing).
- Each subsidiary maintains its own independent GSTIN, Chart of Accounts, fiscal year, and warehouses.
- Dynamic subscription plan limits checked upon company creation (e.g., 4 companies on trial, 10 on business plan).
- Soft company archival / deactivation.
- **Status:** **Fully Implemented**.

### 8. Subscription & Trial Management
- Database-backed subscription engine (`SubscriptionPlan`, `CompanySubscription`, `SubscriptionPlanModule`).
- Real plans in database:
  1. `30_DAY_FREE_TRIAL`: ₹0, 30 days duration, max 4 companies, 10 users/company, modules: ACCOUNT, CRM, INVENTORY, WORKFLOW.
  2. `BASIC`: ₹999/month, max 1 company, 5 users, module: ACCOUNT.
  3. `PRO`: ₹2,999/month, max 5 companies, 25 users, modules: ACCOUNT, INVENTORY, WORKFLOW, SALES, PURCHASE, CRM.
  4. `BUSINESS_PLAN` / `ENTERPRISE`: ₹19,999/year, max 10 companies, 50 users, all modules including manufacturing & dedicated support.
- Razorpay payment gateway order generation and webhook signature verification implemented.
- **Status:** **Fully Implemented**.

### 9. Role-Based Permissions (RBAC & FBAC)
- Feature-Based Access Control (FBAC) catalog with ~20 features (e.g., `DASHBOARD`, `PROFILE`, `PAYMENTS`, `REPORTS`, `HSN_SAC`, `USER_MANAGEMENT`, `ORGANIZATION`, `WORKFLOW_*`).
- Actions: `READ`, `CREATE`, `WRITE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `EXPORT`.
- System roles: `OWNER`, `ADMIN`, `ACCOUNTANT`, `SALES_MANAGER`, `PURCHASE_MANAGER`, `WAREHOUSE_MANAGER`, `USER`.
- **Status:** **Fully Implemented**.

### 10. GST & Statutory Tax Functionality
- Automated intra-state (CGST + SGST) vs. inter-state (IGST) tax derivation.
- Reverse Charge Mechanism (RCM) flags on purchase orders and bills.
- HSN / SAC code registry with state-wise GSTIN masters.
- GSTR-1 outward supply summaries, GSTR-3B tax liability calculations, and GSTR-2B ITC reconciliation history.
- **Status:** **Fully Implemented**.

### 11. Finance & Accounting
- Hierarchical Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses).
- Journal entries with automatic balancing validations (Debits = Credits).
- One-click financial reports: Trial Balance, Profit & Loss Statement, Balance Sheet, Ledger View.
- Bank accounts, bank transactions, and bank reconciliation statements.
- Accounts Payable (AP) and Accounts Receivable (AR) aging schedules.
- **Status:** **Fully Implemented**.

### 12. Sales & CRM
- Full sales order lifecycle: Customer Quotation &rarr; Sales Order &rarr; Delivery Challan &rarr; GST Tax Invoice &rarr; Payment Receipt Voucher.
- Customer management with credit limits, payment terms, and ledger balance tracking.
- Quotation PDF printing and public quotation acceptance links.
- **Status:** **Fully Implemented**.

### 13. Procurement & Vendor Management
- Full procure-to-pay lifecycle: Purchase Requisition (PR) &rarr; RFQ & Supplier Bidding &rarr; Purchase Order (PO) &rarr; Goods Receipt Note (GRN) &rarr; Vendor AP Bill &rarr; Payment Voucher.
- Vendor master data with PAN, GSTIN, bank details, and ledger statements.
- **Status:** **Fully Implemented**.

### 14. Inventory & Warehouse Management
- Multi-warehouse hierarchy with customizable bin locations.
- Real-time stock movement journals (receipts, issues, inter-warehouse transfers).
- Batch/Lot tracking and serial number management.
- Stock valuation models with FIFO cost layers and opening stock adjustments.
- **Status:** **Fully Implemented**.

### 15. Workflow & Approval System
- Dynamic multi-level approval definitions per company and document type.
- Approval matrices with transaction amount thresholds.
- Live approvals inbox with Approve, Reject, Return with comments.
- Immutable audit trails tracking user, timestamp, previous state, and action.
- **Status:** **Fully Implemented**.

### 16. Reports & Analytics
- Executive overview KPI cards (Gross Revenue, Total Receivables, Total Payables, Cash Balance).
- Export capabilities: Excel (via SheetJS/CSV), formatted printable PDF invoices and statements.
- Financial variance analysis and budget tracking.
- **Status:** **Fully Implemented**.

### 17. Security & Tenant Isolation
- Tenant scoping enforced in `RequestContext` using JWT claims (`organizationId`, `companyId`, `userId`, `roles`).
- Database foreign key constraints and repository filtering ensure no cross-tenant data exposure.
- Server-side rate limiting and CORS policy restricted to legitimate domain endpoints.
- XSS and open redirect defenses on login and return-to-route handlers.
- **Status:** **Fully Implemented**.

### 18. Existing Integrations
- **Razorpay**: Hosted orders, payment callbacks, webhooks, signature verification (**Fully Implemented**).
- **GST Portal Data Formats**: GSTR JSON/CSV exports matching India GSTN schemas (**Fully Implemented**).
- **Communication / SMTP**: Internal communication service with email notifications (**Partially Implemented**).
- **Third-Party Payroll / Banking API Direct Feeds**: **Planned / Unsupported**.
- **Third-Party CRM / Zapier Webhooks**: **Planned / Unsupported**.

### 19. Existing Reusable UI Components
- Design-system components in `ERP/src/components/common/`:
  - `MarkLogo.jsx` (corporate branding, dark & light variants)
  - `CustomSelect.jsx` (accessible dropdowns)
  - `Pagination.jsx`, `Modal.jsx`, `Tabs.jsx`, `Toast.jsx`, `Badge.jsx`
- Layouts: `AppShellLayout`, `CompanyLayout`, `OwnerLayout`, `SidebarContext`.
- **Status:** **Fully Implemented**.

### 20. Installed Packages & Animation Capabilities
- Installed: `lucide-react` (0.344.0), `recharts` (3.8.1), `date-fns` (4.4.0), `lodash` (4.18.1), `react-router-dom` (6.22.0).
- CSS Animations: Tailwind extended keyframes (`fadeIn`, `fadeInUp`, `slideUp`, `slideInRight`, `shimmer`, `blob`).
- GPU-Accelerated Hardware Transitions: `transform`, `opacity`, `backdrop-filter`, `transition-all`.
- **Status:** **Fully Implemented**.

---

## FEATURE CLASSIFICATION MATRIX

| Module / Capability | Implementation Status | Ground Truth Reality |
|---|---|---|
| **Multi-Tenant Org & Subsidiaries** | **Fully Implemented** | Full DB isolation, org login portal, company switcher |
| **Finance & General Ledger** | **Fully Implemented** | COA, journals, balance sheet, P&L, trial balance, bank reco |
| **Order-to-Cash (Sales)** | **Fully Implemented** | Quotes, sales orders, delivery challans, GST tax invoices |
| **Procure-to-Pay (Purchase)** | **Fully Implemented** | PR, RFQ, PO, GRN inward, vendor bills, AP payments |
| **Multi-Warehouse Inventory** | **Fully Implemented** | Multiple warehouses, bin locations, batches, serials, FIFO |
| **Statutory Indian GST** | **Fully Implemented** | POS logic, CGST/SGST/IGST, HSN/SAC master, GSTR-1/2B/3B |
| **Approval Workflows** | **Fully Implemented** | Multi-level rules, approval inboxes, immutable audit trail |
| **30-Day Free Trial Provisioning** | **Fully Implemented** | Real API (`/api/sso/auth/register-organization`) |
| **SaaS Subscription & Razorpay** | **Fully Implemented** | Trial, Basic (₹999), Pro (₹2,999), Business (₹19,999) |
| **Manufacturing (BOM & Work Orders)** | **Partially Implemented** | Backend services ready, frontend screens basic |
| **HR & Payroll** | **Partially Implemented** | Employees & attendance active; complex payroll planned |
| **Automated Bank Feed Scraping** | **Not Implemented** | Manual bank statement import & reco supported |
| **Third-Party CRM / Zapier Sync** | **Not Implemented** | Native internal CRM/Sales pipeline used |

---

## PART 2: LANDING PAGE GAP ANALYSIS

### Critical Deficiencies Identified in the Current Landing Page:
1. **Missing Interactive ROI Calculator**: B2B enterprise buyers evaluating an ERP require concrete return-on-investment estimates (hours saved on manual bookkeeping, speed of monthly GST filing, working capital freed from excess stock).
2. **Missing Direct Sign-In Portal Modal**: Currently, clicking "Sign In" either redirects to `/` or is absent in headers; enterprise users need a friction-free way to enter their organization slug (e.g., `mohit`, `apex`) and navigate directly to `/o/{slug}/login`.
3. **Static & Flat Demonstrations**: The existing `LandingDemoPreview.jsx` renders static tables with no animated KPI counts, micro-interactions, or live interactive toggle feel.
4. **Weak Visual Hierarchy in Hero**: The hero headline and preview card lack depth, floating elevation, and layered staggered entrance animations.
5. **No Pricing Plan Comparison Matrix**: Only the trial card and custom enterprise are displayed; the actual active plans (`Basic` ₹999, `Pro` ₹2,999, and `Business/Enterprise` ₹19,999) documented in `SubscriptionPlanBootstrap.java` are hidden from view.
6. **Incomplete Industry-Specific Workflows**: Manufacturers, distributors, and trading companies need targeted operational highlights showing how Mark2 solves their specific challenges.
7. **Repetitive Card Content**: The features and benefits grids repeat similar terminology ("Multi-Company", "Tenant Isolation") across multiple sections without showing distinctive operational depth.
8. **Sub-optimal Mobile Experience**: Long vertical content sections lack interactive collapsing or compact carousel/tabbed presentations on screens under 768px.
9. **Lack of Live Interactive Accordions**: FAQ is rudimentary; users cannot seamlessly toggle answers with smooth micro-animations.
10. **Absence of Grounded Trust Indicators**: Zero fake logos are permitted, but real security controls (AES-256 encryption, HttpOnly cookies, multi-tenant DB isolation, automated session timeouts, Razorpay PCI-DSS Level 1 compliance) are insufficiently highlighted.

---

## PART 3: PRIORITIZED IMPROVEMENT ROADMAP

### High Priority (Phase 3 & 4)
1. **Premium Sticky Navigation with Sign-In Portal Access**:
   - Organization portal quick-finder dialog (enter organization code &rarr; jump to `/o/:code/login`).
   - Sticky header with backdrop blur, scroll progress indicator, and active section spy.
2. **Hero Section Evolution**:
   - Floating enterprise ERP workspace preview with layered depth, badge pills, and staggered text entrance.
   - High-contrast conversion CTA ("Start 30-Day Free Trial" &rarr; `/try-free`) with zero-risk micro-copy.
3. **Interactive ERP Workspace Showcase**:
   - 5 interactive tabs: Finance & Ledger, Sales & Invoicing, Procurement & POs, Multi-Warehouse Inventory, and Statutory GST.
   - Interactive KPI counters and live chart previews using SVG/CSS.
4. **End-to-End Visual Workflow Engines**:
   - Interactive Order-to-Cash (Quote &rarr; Order &rarr; Challan &rarr; Invoice &rarr; Payment).
   - Interactive Procure-to-Pay (PR &rarr; RFQ &rarr; PO &rarr; GRN &rarr; AP Bill).
   - Clickable workflow steps with animated status chips and automatic GL posting indicators.

### Medium Priority (Phase 5 & 6)
5. **Interactive Business ROI & Savings Calculator**:
   - Dynamic sliders for Monthly Invoices (50 to 5,000+), Team Size (2 to 100), and Number of Companies (1 to 10).
   - Real-time computation of Estimated Monthly Hours Saved, Accelerated Cash Collection Days, and Annual Compliance Cost Reduction.
6. **Ground-Truth SaaS Pricing & Feature Matrix**:
   - 30-Day Free Trial (₹0) &rarr; `/try-free`.
   - Basic Plan (₹999/mo).
   - Pro Plan (₹2,999/mo).
   - Enterprise Plan (₹19,999/yr) with annual billing toggle (15% savings).
   - Accurate company/user/module limits matching the backend database schema.
7. **Multi-Company Architecture & Enterprise Security Showcase**:
   - Visual holding group entity hierarchy (HQ parent company &rarr; subsidiary branches &rarr; warehouse nodes).
   - Architectural security breakdown (Tenant scoping, JWT single-flight refresh, dynamic 2FA, session timeout).

### Low / Polish Priority (Phase 7 & 8)
8. **Interactive FAQ Accordion**:
   - Smooth opening/closing transitions with accessible ARIA tags (`aria-expanded`, `aria-controls`).
9. **Final High-Conversion Bottom CTA**:
   - Direct trial provisioning trigger + enterprise consultation request trigger.
10. **Enterprise Footer**:
    - Categorized links (Platform, Modules, Security, Legal, Support) with active smooth-scroll triggers.
11. **Comprehensive Accessibility & Performance**:
    - Semantic HTML5, full keyboard navigation, `@media (prefers-reduced-motion)` fallback, and Lighthouse score optimization.

