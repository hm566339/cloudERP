import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflowsDir = path.resolve(__dirname, '..');
const componentsDir = path.resolve(workflowsDir, 'components');
const pagesDir = path.resolve(workflowsDir, 'pages');

const customSelectPath = path.resolve(__dirname, '../../../components/common/CustomSelect.jsx');
const buildingSelectorPath = path.resolve(componentsDir, 'WorkflowBuildingSelector.jsx');
const configFormPath = path.resolve(componentsDir, 'WorkflowConfigurationForm.jsx');
const diagramPath = path.resolve(componentsDir, 'WorkflowDiagram.jsx');
const dynamicFieldRendererPath = path.resolve(componentsDir, 'DynamicFieldRenderer.jsx');
const workflowManagementPagePath = path.resolve(pagesDir, 'WorkflowManagementPage.jsx');
const approvalRequestsPagePath = path.resolve(pagesDir, 'ApprovalRequestsPage.jsx');
const settingsSelectPath = path.resolve(__dirname, '../../../components/settings/shared/SettingsSelect.jsx');

describe('Workflow Module Dropdowns Audit & Verification', () => {
  describe('1. Zero Raw <select> Tags Across All Workflow Components', () => {
    it('verifies no raw <select> elements exist in src/features/workflows/components', () => {
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
      const violations = [];
      for (const file of files) {
        const content = fs.readFileSync(path.resolve(componentsDir, file), 'utf-8');
        // Look for <select opening tag (case-insensitive)
        if (/<select\b[^>]*>/i.test(content)) {
          violations.push(file);
        }
      }
      assert.deepStrictEqual(violations, [], `Found raw <select> tags in: ${violations.join(', ')}`);
    });

    it('verifies no raw <select> elements exist in src/features/workflows/pages', () => {
      const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
      const violations = [];
      for (const file of files) {
        const content = fs.readFileSync(path.resolve(pagesDir, file), 'utf-8');
        if (/<select\b[^>]*>/i.test(content)) {
          violations.push(file);
        }
      }
      assert.deepStrictEqual(violations, [], `Found raw <select> tags in: ${violations.join(', ')}`);
    });
  });

  describe('2. CustomSelect Enterprise Features & Standards', () => {
    const customSelectCode = fs.readFileSync(customSelectPath, 'utf-8');

    it('renders menu via createPortal into document.body to prevent container clipping', () => {
      assert.ok(
        customSelectCode.includes('createPortal(') && customSelectCode.includes('document.body'),
        'CustomSelect must render dropdown menu inside createPortal to document.body'
      );
      assert.ok(
        customSelectCode.includes('zIndex: 99999'),
        'CustomSelect menu portal must use high z-index (99999) to overlay all modals and drawers'
      );
    });

    it('uses type="button" on trigger button to prevent unintended form submission', () => {
      assert.ok(
        customSelectCode.includes('type="button"'),
        'CustomSelect trigger element must explicitly declare type="button"'
      );
    });

    it('implements collision detection to flip menu upward when space is constrained', () => {
      assert.ok(
        customSelectCode.includes('openUpward') || customSelectCode.includes('spaceBelow'),
        'CustomSelect must calculate viewport boundaries to avoid bottom screen overflow'
      );
    });

    it('supports keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)', () => {
      assert.ok(customSelectCode.includes("'Escape'") || customSelectCode.includes('"Escape"'), 'Supports Escape key');
      assert.ok(customSelectCode.includes("'ArrowDown'") || customSelectCode.includes('"ArrowDown"'), 'Supports ArrowDown key');
      assert.ok(customSelectCode.includes("'ArrowUp'") || customSelectCode.includes('"ArrowUp"'), 'Supports ArrowUp key');
      assert.ok(customSelectCode.includes("'Enter'") || customSelectCode.includes('"Enter"'), 'Supports Enter key');
    });

    it('provides dual onChange signatures (syntheticEvent and direct value)', () => {
      assert.ok(
        customSelectCode.includes('onChange?.(') || customSelectCode.includes('onChange('),
        'Calls onChange callback'
      );
      assert.ok(
        customSelectCode.includes('target:') && customSelectCode.includes('value:'),
        'Emits synthetic event with target.value for compatibility with standard form handlers'
      );
    });

    it('supports multi-select mode (isMulti)', () => {
      assert.ok(customSelectCode.includes('isMulti'), 'CustomSelect declares isMulti prop support');
    });

    it('supports searchable dropdowns with clear action', () => {
      assert.ok(customSelectCode.includes('searchable'), 'Supports searchable prop');
      assert.ok(customSelectCode.includes('searchTerm'), 'Maintains internal search state');
    });
  });

  describe('3. Component-Specific Dropdown Migrations', () => {
    it('WorkflowBuildingSelector uses CustomSelect with search and Building2 icon', () => {
      const code = fs.readFileSync(buildingSelectorPath, 'utf-8');
      assert.ok(code.includes('import CustomSelect'), 'Imports CustomSelect');
      assert.ok(code.includes('<CustomSelect'), 'Renders CustomSelect component');
      assert.ok(code.includes('searchable'), 'Enables searchable options');
      assert.ok(code.includes('options='), 'Passes company options');
      assert.doesNotMatch(code, /<select\b/i, 'Has no raw select');
    });

    it('WorkflowConfigurationForm uses CustomSelect for all 4 configuration dropdowns', () => {
      const code = fs.readFileSync(configFormPath, 'utf-8');
      assert.ok(code.includes('import CustomSelect'), 'Imports CustomSelect');

      // 1. Document Type selector
      assert.ok(code.includes('id="wf-doc-type"'), 'Contains Document Type CustomSelect');
      // 2. Initiated By Role selector
      assert.ok(code.includes('id="wf-initiated-by-role"'), 'Contains Initiated By Role CustomSelect');
      // 3. Applicable Customers selector
      assert.ok(code.includes('id="wf-applicable-customers"'), 'Contains Applicable Customers CustomSelect');
      // 4. Approver Role in WorkflowSettingRow
      assert.ok(code.includes('id="wf-approver-role"'), 'Contains Approver Role CustomSelect in setting row');

      assert.doesNotMatch(code, /<select\b/i, 'Has no raw select');
    });

    it('WorkflowDiagram step drawer uses CustomSelect for all 4 step configuration dropdowns', () => {
      const code = fs.readFileSync(diagramPath, 'utf-8');
      assert.ok(code.includes('import CustomSelect'), 'Imports CustomSelect');

      // 1. Assigned Role / Approver
      assert.ok(code.includes('id="step-assigned-role"'), 'Contains Assigned Role CustomSelect');
      // 2. Approval Rule
      assert.ok(code.includes('id="step-approval-rule"'), 'Contains Approval Rule CustomSelect');
      // 3. Condition Fail Action
      assert.ok(code.includes('id="step-if-condition-fails"'), 'Contains If Condition Fails CustomSelect');
      // 4. Notification Channel
      assert.ok(code.includes('id="step-notification-channel"'), 'Contains Notification Channel CustomSelect');

      assert.doesNotMatch(code, /<select\b/i, 'Has no raw select');
    });

    it('ApprovalRequestsPage uses CustomSelect for page size and status filtering', () => {
      const code = fs.readFileSync(approvalRequestsPagePath, 'utf-8');
      assert.ok(code.includes('import CustomSelect'), 'Imports CustomSelect');
      assert.ok(code.includes('id="approval-status-filter"'), 'Contains Status Filter CustomSelect');
      assert.ok(code.includes('id="approval-rows-per-page"'), 'Contains Rows Per Page CustomSelect');
      assert.doesNotMatch(code, /<select\b/i, 'Has no raw select');
    });

    it('WorkflowManagementPage left panel uses CustomSelect for status filtering', () => {
      const code = fs.readFileSync(workflowManagementPagePath, 'utf-8');
      assert.ok(code.includes('import CustomSelect'), 'Imports CustomSelect');
      assert.ok(code.includes('id="workflow-status-filter"'), 'Contains workflow-status-filter CustomSelect');
      assert.ok(code.includes('statusFilter'), 'Filters workflows by statusFilter');
      assert.doesNotMatch(code, /<select\b/i, 'Has no raw select');
    });

    it('DynamicFieldRenderer uses CustomSelect for dynamic select fields', () => {
      const code = fs.readFileSync(dynamicFieldRendererPath, 'utf-8');
      assert.ok(code.includes('import CustomSelect'), 'Imports CustomSelect');
      assert.ok(code.includes('<CustomSelect'), 'Renders CustomSelect in case select');
      assert.doesNotMatch(code, /<select\b/i, 'Has no raw select');
    });

    it('SettingsSelect uses CustomSelect for WorkflowSettingsPage and other settings', () => {
      const code = fs.readFileSync(settingsSelectPath, 'utf-8');
      assert.ok(code.includes('import CustomSelect'), 'Imports CustomSelect');
      assert.ok(code.includes('<CustomSelect'), 'Renders CustomSelect');
      assert.doesNotMatch(code, /<select\b/i, 'Has no raw select');
    });
  });
});
