import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflowsPagePath = path.resolve(__dirname, '../pages/WorkflowManagementPage.jsx');
const companyLayoutPath = path.resolve(__dirname, '../../../layouts/CompanyLayout.jsx');
const accountantLayoutPath = path.resolve(__dirname, '../../../layouts/AccountantLayout.jsx');
const approvalRequestsPagePath = path.resolve(__dirname, '../pages/ApprovalRequestsPage.jsx');

describe('Workflow & Approvals Full Page Scrolling & Layout Constraint Verification', () => {
  const workflowPageContent = fs.readFileSync(workflowsPagePath, 'utf-8');
  const companyLayoutContent = fs.readFileSync(companyLayoutPath, 'utf-8');
  const accountantLayoutContent = fs.readFileSync(accountantLayoutPath, 'utf-8');
  const approvalRequestsContent = fs.readFileSync(approvalRequestsPagePath, 'utf-8');

  it('1. WorkflowManagementPage root container must not allow vertical scrolling', () => {
    // The root div of WorkflowManagementPage must have overflow-hidden (not overflow-y-auto)
    assert.match(
      workflowPageContent,
      /className="animate-fade-in flex flex-col h-full min-h-0 [^"]*overflow-hidden"/,
      'WorkflowManagementPage root container must have overflow-hidden to prevent document-level scrolling'
    );
    assert.doesNotMatch(
      workflowPageContent,
      /animate-fade-in flex flex-col h-full min-h-0 [^"]*overflow-y-auto/,
      'WorkflowManagementPage root container must NOT have overflow-y-auto'
    );
  });

  it('2. WorkflowManagementPage header, scope notice, and module tabs must be fixed (flex-none)', () => {
    // Top header
    assert.ok(
      workflowPageContent.includes('{/* ── Top Header and Title ── */}\n      <div className="flex-none') ||
      workflowPageContent.includes('{/* ── Top Header and Title ── */}\r\n      <div className="flex-none'),
      'Top Header and Title must have flex-none'
    );

    // Configuration Scope Notice
    assert.ok(
      workflowPageContent.includes('{/* ── Configuration Scope Notice ── */}\n      <div className="flex-none') ||
      workflowPageContent.includes('{/* ── Configuration Scope Notice ── */}\r\n      <div className="flex-none'),
      'Configuration Scope Notice must have flex-none'
    );

    // Module Tabs Bar
    assert.ok(
      workflowPageContent.includes('{/* ── Module Tabs Bar ── */}\n      <div className="flex-none') ||
      workflowPageContent.includes('{/* ── Module Tabs Bar ── */}\r\n      <div className="flex-none'),
      'Module Tabs Bar must have flex-none'
    );
  });

  it('3. Responsive 3-Column Studio must be constrained with grid-rows-1, min-h-0, and overflow-y-hidden', () => {
    // Grid container must have flex-1 min-h-0 grid-rows-1 overflow-x-auto overflow-y-hidden
    assert.match(
      workflowPageContent,
      /className="flex-1 min-h-0 grid [^"]*grid-rows-1[^"]*overflow-x-auto overflow-y-hidden"/,
      'Studio grid must have flex-1 min-h-0 grid-rows-1 overflow-x-auto overflow-y-hidden'
    );
    assert.doesNotMatch(
      workflowPageContent,
      /grid-cols-1.*overflow-y-auto.*Studio/,
      'Studio grid container must NOT have grid-cols-1 or overflow-y-auto that stacks panels and causes full-page scrolling'
    );
  });

  it('4. Left, Center, and Right panels must have min-h-0, min-w-0, and independent vertical scroll', () => {
    // Left panel
    assert.ok(
      workflowPageContent.includes('section className="card flex flex-col min-h-0 min-w-0 h-full overflow-hidden'),
      'Left Column must have min-h-0 min-w-0 h-full overflow-hidden'
    );
    assert.match(
      workflowPageContent,
      /<div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1\.5 custom-scrollbar"/,
      'Left panel list must scroll independently'
    );

    // Center panel
    assert.match(
      workflowPageContent,
      /<div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 custom-scrollbar"/,
      'Center panel editor body must scroll independently'
    );

    // Right panel
    assert.match(
      workflowPageContent,
      /<div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar"/,
      'Right configuration form must scroll independently'
    );
  });

  it('5. Right configuration panel footer must be flex-none (sticky at bottom)', () => {
    assert.ok(
      workflowPageContent.includes('<div className="flex-none border-t border-zinc-100 p-3.5 bg-zinc-50/60 flex items-center justify-end gap-2">'),
      'Cancel and Save changes footer must have flex-none'
    );
    assert.ok(workflowPageContent.includes('Save changes'), 'Footer must contain Save changes');
    assert.ok(workflowPageContent.includes('Cancel'), 'Footer must contain Cancel');
  });

  it('6. CompanyLayout and AccountantLayout shells must designate /workflows and /workflow as isFullHeightPage with overflow-hidden', () => {
    // CompanyLayout
    assert.ok(
      companyLayoutContent.includes("location.pathname.includes('/workflows')"),
      'CompanyLayout must check /workflows in isFullHeightPage'
    );
    assert.ok(
      companyLayoutContent.includes("location.pathname.includes('/workflow')"),
      'CompanyLayout must check /workflow in isFullHeightPage'
    );
    assert.match(
      companyLayoutContent,
      /isFullHeightPage \? 'overflow-hidden p-0' : 'overflow-x-hidden overflow-y-auto'/,
      'CompanyLayout main must use overflow-hidden p-0 for full-height pages'
    );

    // AccountantLayout
    assert.ok(
      accountantLayoutContent.includes("location.pathname.includes('/workflows')"),
      'AccountantLayout must check /workflows in isFullHeightPage'
    );
    assert.ok(
      accountantLayoutContent.includes("location.pathname.includes('/workflow')"),
      'AccountantLayout must check /workflow in isFullHeightPage'
    );
    assert.match(
      accountantLayoutContent,
      /isFullHeightPage \? 'overflow-hidden p-0' : 'overflow-x-hidden overflow-y-auto'/,
      'AccountantLayout main must use overflow-hidden p-0 for full-height pages'
    );
  });

  it('7. ApprovalRequestsPage has independent vertical scrolling when embedded in full-height layout', () => {
    assert.match(
      approvalRequestsContent,
      /className="animate-fade-in h-full overflow-y-auto/,
      'ApprovalRequestsPage must have h-full overflow-y-auto'
    );
  });
});
