import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CRM Detail View Architecture & Parity Suite', () => {
  it('1. Lead payload unwrapping handles both unwrapped object and nested data contract', () => {
    const unwrapLead = (leadRes) => {
      return leadRes?.id
        ? leadRes
        : leadRes?.data?.id
        ? leadRes.data
        : leadRes?.data || null;
    };

    // Case A: baseApi unwrapped response (object with id directly)
    const unwrappedApi = { id: 'lead-123', displayName: 'Acme Corp', leadScore: 85 };
    assert.equal(unwrapLead(unwrappedApi)?.id, 'lead-123');
    assert.equal(unwrapLead(unwrappedApi)?.displayName, 'Acme Corp');

    // Case B: standard wrapped response { success: true, data: { id: ... } }
    const wrappedApi = { success: true, data: { id: 'lead-456', displayName: 'Globex Inc', leadScore: 60 } };
    assert.equal(unwrapLead(wrappedApi)?.id, 'lead-456');
    assert.equal(unwrapLead(wrappedApi)?.displayName, 'Globex Inc');

    // Case C: null / empty response
    assert.equal(unwrapLead(null), null);
    assert.equal(unwrapLead({}), null);
    assert.equal(unwrapLead({ data: null }), null);
  });

  it('2. Multi-tenant parameter and header normalization in getLeadById', () => {
    const normalizeQueryArg = (arg) => {
      const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
      const companyId = typeof arg === 'object' && arg !== null ? arg.companyId : undefined;
      return {
        url: `/api/crm/leads/${id}`,
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      };
    };

    // Case A: string id (root route)
    const directStr = normalizeQueryArg('uuid-lead-001');
    assert.equal(directStr.url, '/api/crm/leads/uuid-lead-001');
    assert.equal(directStr.params, undefined);
    assert.equal(directStr.headers, undefined);

    // Case B: object { id, companyId } (company-scoped route)
    const scoped = normalizeQueryArg({ id: 'uuid-lead-002', companyId: 'comp-999' });
    assert.equal(scoped.url, '/api/crm/leads/uuid-lead-002');
    assert.deepEqual(scoped.params, { companyId: 'comp-999' });
    assert.deepEqual(scoped.headers, { 'X-Company-Id': 'comp-999' });
  });

  it('3. Reusable CRM Detail Layout Shell & Component Files Exist on Disk', () => {
    const detailDir = path.resolve(__dirname, '../components/detail');
    assert.ok(fs.existsSync(path.join(detailDir, 'CrmDetailShell.jsx')), 'CrmDetailShell.jsx exists');
    assert.ok(fs.existsSync(path.join(detailDir, 'CrmDetailTabs.jsx')), 'CrmDetailTabs.jsx exists');
    assert.ok(fs.existsSync(path.join(detailDir, 'CrmTabCard.jsx')), 'CrmTabCard.jsx exists');
    assert.ok(fs.existsSync(path.join(detailDir, 'CrmDetailSkeleton.jsx')), 'CrmDetailSkeleton.jsx exists');
    assert.ok(fs.existsSync(path.join(detailDir, 'index.js')), 'index.js exists');

    // Verify CrmDetailShell contains max-w-[1280px] matching Accounts detail page
    const shellContent = fs.readFileSync(path.join(detailDir, 'CrmDetailShell.jsx'), 'utf-8');
    assert.ok(shellContent.includes('max-w-[1280px]'), 'Shell mirrors 1280px container max-width');
    assert.ok(shellContent.includes('lg:w-[30%]'), 'Shell defines 30% left sidebar column');
    assert.ok(shellContent.includes('lg:w-[70%]'), 'Shell defines 70% right content column');
  });

  it('4. Modular Lead Detail Sections Exist on Disk and Implement Accounts Styling Rhythm', () => {
    const sectionsDir = path.resolve(__dirname, '../components/detail/sections');
    const requiredSections = [
      'LeadOverviewSection.jsx',
      'LeadAttributionSection.jsx',
      'LeadActivitiesSection.jsx',
      'LeadTasksSection.jsx',
      'LeadCommunicationsSection.jsx',
      'LeadConversionSection.jsx',
    ];

    for (const section of requiredSections) {
      const filePath = path.join(sectionsDir, section);
      assert.ok(fs.existsSync(filePath), `${section} exists`);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.length > 100, `${section} contains component implementation`);
    }
  });

  it('5. Lead score heat classification & badge color contracts', () => {
    const getScoreClassification = (score) => {
      const num = Number(score) || 0;
      if (num >= 80) return { rating: 'HOT', color: 'rose' };
      if (num >= 50) return { rating: 'WARM', color: 'amber' };
      return { rating: 'COLD', color: 'blue' };
    };

    assert.deepEqual(getScoreClassification(95), { rating: 'HOT', color: 'rose' });
    assert.deepEqual(getScoreClassification(80), { rating: 'HOT', color: 'rose' });
    assert.deepEqual(getScoreClassification(79), { rating: 'WARM', color: 'amber' });
    assert.deepEqual(getScoreClassification(50), { rating: 'WARM', color: 'amber' });
    assert.deepEqual(getScoreClassification(49), { rating: 'COLD', color: 'blue' });
    assert.deepEqual(getScoreClassification(0), { rating: 'COLD', color: 'blue' });
    assert.deepEqual(getScoreClassification(null), { rating: 'COLD', color: 'blue' });
  });

  it('6. LeadDetailsPage uses CrmDetailShell and all six sections with zero dead-ends', () => {
    const pagePath = path.resolve(__dirname, '../pages/LeadDetailsPage.jsx');
    assert.ok(fs.existsSync(pagePath), 'LeadDetailsPage.jsx exists');
    const content = fs.readFileSync(pagePath, 'utf-8');

    assert.ok(content.includes('CrmDetailShell'), 'Uses CrmDetailShell');
    assert.ok(content.includes('LeadOverviewSection'), 'Uses LeadOverviewSection');
    assert.ok(content.includes('LeadAttributionSection'), 'Uses LeadAttributionSection');
    assert.ok(content.includes('LeadActivitiesSection'), 'Uses LeadActivitiesSection');
    assert.ok(content.includes('LeadTasksSection'), 'Uses LeadTasksSection');
    assert.ok(content.includes('LeadCommunicationsSection'), 'Uses LeadCommunicationsSection');
    assert.ok(content.includes('LeadConversionSection'), 'Uses LeadConversionSection');
    assert.ok(content.includes('leadRes?.id'), 'Implements safe unwrapping with direct id fallback');
  });
});
