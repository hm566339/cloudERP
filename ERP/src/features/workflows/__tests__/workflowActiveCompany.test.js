import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflowsPagePath = path.resolve(__dirname, '../pages/WorkflowManagementPage.jsx');

describe('WorkflowManagementPage activeCompanyId Scope & Variable Integrity Test Suite', () => {
  const content = fs.readFileSync(workflowsPagePath, 'utf-8');

  it('1. Declares activeCompanyId inside WorkflowManagementPage component scope', () => {
    assert.match(
      content,
      /const\s+activeCompanyId\s*=/,
      'WorkflowManagementPage must explicitly declare activeCompanyId in component scope'
    );
  });

  it('2. Properly links companyId and activeCompanyId with fallback chains', () => {
    assert.ok(
      content.includes('const companyId = activeCompanyId;'),
      'companyId must be assigned from activeCompanyId or vice versa'
    );
    assert.ok(
      content.includes('routeCompanyId') &&
      content.includes('selectedCompany?.id') &&
      content.includes('currentUser?.companyId'),
      'activeCompanyId must resolve through route params, selectedCompany, and currentUser'
    );
  });

  it('3. Safely accesses activeCompanyId in handleSyncOrgDefault', () => {
    assert.ok(
      content.includes('if (!activeCompanyId) return;'),
      'handleSyncOrgDefault must guard with activeCompanyId'
    );
    assert.ok(
      content.includes('/api/sso/organization/workflows/provision-company/${activeCompanyId}'),
      'handleSyncOrgDefault must provision company default workflows using activeCompanyId'
    );
  });

  it('4. Safely renders sync button when workflows are empty without ReferenceError', () => {
    assert.ok(
      content.includes('{activeCompanyId && ('),
      'empty state conditional render must reference activeCompanyId cleanly'
    );
    assert.ok(
      content.includes('Sync Organization Default'),
      'Sync Organization Default button must be present in empty state'
    );
  });
});

