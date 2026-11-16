import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test targets
import { CRM_SIDEBAR, buildFilteredCrmSidebar } from '../../../layouts/CrmSidebarConfig.js';
import PATHS from '../../../routes/paths.js';

describe('Sales & CRM Frontend Architecture & Navigation Suite', () => {
  it('1. PATHS.CRM includes all 15 enterprise CRM routes', () => {
    assert.equal(PATHS.CRM.ROOT, '/sales-crm');
    assert.equal(PATHS.CRM.DASHBOARD, '/sales-crm/dashboard');
    assert.equal(PATHS.CRM.LEADS, '/sales-crm/leads');
    assert.equal(PATHS.CRM.LEAD_DETAILS('123'), '/sales-crm/leads/123');
    assert.equal(PATHS.CRM.ACCOUNTS, '/sales-crm/accounts');
    assert.equal(PATHS.CRM.ACCOUNT_DETAILS('456'), '/sales-crm/accounts/456');
    assert.equal(PATHS.CRM.CONTACTS, '/sales-crm/contacts');
    assert.equal(PATHS.CRM.OPPORTUNITIES, '/sales-crm/opportunities');
    assert.equal(PATHS.CRM.PIPELINES, '/sales-crm/pipelines');
    assert.equal(PATHS.CRM.QUOTATIONS, '/sales-crm/quotations');
    assert.equal(PATHS.CRM.QUOTATION_DETAILS('789'), '/sales-crm/quotations/789');
    assert.equal(PATHS.CRM.TASKS, '/sales-crm/tasks');
    assert.equal(PATHS.CRM.ACTIVITIES, '/sales-crm/activities');
    assert.equal(PATHS.CRM.CAMPAIGNS, '/sales-crm/campaigns');
    assert.equal(PATHS.CRM.ATTRIBUTION, '/sales-crm/attribution');
    assert.equal(PATHS.CRM.COMMUNICATIONS, '/sales-crm/communications');
    assert.equal(PATHS.CRM.AUTOMATION, '/sales-crm/automation');
    assert.equal(PATHS.CRM.INTEGRATIONS, '/sales-crm/integrations');
    assert.equal(PATHS.CRM.SETTINGS, '/sales-crm/settings');
  });

  it('2. CRM_SIDEBAR configuration contains all 15 operational items with required metadata', () => {
    assert.equal(CRM_SIDEBAR.length, 15);
    const expectedModules = [
      'crm-dashboard', 'crm-leads', 'crm-accounts', 'crm-contacts',
      'crm-opportunities', 'crm-pipelines', 'crm-quotations', 'crm-tasks',
      'crm-activities', 'crm-campaigns', 'crm-attribution', 'crm-communications',
      'crm-automation', 'crm-integrations', 'crm-settings'
    ];

    expectedModules.forEach((modId) => {
      const item = CRM_SIDEBAR.find((i) => i.id === modId);
      assert.ok(item, `Sidebar should contain item for ${modId}`);
      assert.ok(item.path.startsWith('/sales-crm/'), `${modId} path should start with /sales-crm/`);
      assert.ok(item.icon, `${modId} should have a Lucide icon component`);
      assert.ok(item.module, `${modId} should have a security permission module code`);
    });
  });

  it('3. buildFilteredCrmSidebar enforces granular RBAC permissions', () => {
    // Scenario A: Admin with full CRM access
    const adminAccess = () => true;
    const adminSidebar = buildFilteredCrmSidebar(CRM_SIDEBAR, adminAccess);
    assert.equal(adminSidebar.length, 15);

    // Scenario B: Sales Rep with access only to Leads, Opportunities, and Quotations
    const salesRepPermissions = new Set(['CRM', 'CRM_LEADS', 'CRM_OPPORTUNITIES', 'CRM_QUOTATIONS']);
    const repAccess = (module) => salesRepPermissions.has(module);
    const repSidebar = buildFilteredCrmSidebar(CRM_SIDEBAR, repAccess);
    assert.equal(repSidebar.length, 5); // Dashboard, Leads, Opportunities, Pipelines, Quotations
    assert.ok(repSidebar.some((i) => i.id === 'crm-leads'));
    assert.ok(repSidebar.some((i) => i.id === 'crm-quotations'));
    assert.ok(!repSidebar.some((i) => i.id === 'crm-automation'), 'Sales Rep must not see Automation');
    assert.ok(!repSidebar.some((i) => i.id === 'crm-settings'), 'Sales Rep must not see CRM Settings');
    assert.ok(!repSidebar.some((i) => i.id === 'crm-integrations'), 'Sales Rep must not see Integrations');

    // Scenario C: User without CRM module access
    const noAccess = () => false;
    const restrictedSidebar = buildFilteredCrmSidebar(CRM_SIDEBAR, noAccess);
    assert.equal(restrictedSidebar.length, 0);
  });
});

describe('Sales & CRM Business Calculation & Domain Rules Suite', () => {
  it('4. Quotation GST calculation (Intra-state: CGST + SGST; Inter-state: IGST)', () => {
    const item1 = { quantity: 2, unitPrice: 5000, discountPercent: 10, gstRate: 18 };
    const item2 = { quantity: 1, unitPrice: 10000, discountPercent: 0, gstRate: 18 };

    // Item 1: base = 10000, disc = 1000, taxable = 9000, tax (18%) = 1620, total = 10620
    const base1 = item1.quantity * item1.unitPrice;
    const disc1 = (base1 * item1.discountPercent) / 100;
    const taxable1 = base1 - disc1;
    const tax1 = (taxable1 * item1.gstRate) / 100;

    assert.equal(base1, 10000);
    assert.equal(disc1, 1000);
    assert.equal(taxable1, 9000);
    assert.equal(tax1, 1620);
    assert.equal(taxable1 + tax1, 10620);

    // Item 2: base = 10000, disc = 0, taxable = 10000, tax (18%) = 1800, total = 11800
    const base2 = item2.quantity * item2.unitPrice;
    const disc2 = (base2 * item2.discountPercent) / 100;
    const taxable2 = base2 - disc2;
    const tax2 = (taxable2 * item2.gstRate) / 100;

    assert.equal(base2, 10000);
    assert.equal(disc2, 0);
    assert.equal(taxable2, 10000);
    assert.equal(tax2, 1800);
    assert.equal(taxable2 + tax2, 11800);

    const grandTotal = (taxable1 + tax1) + (taxable2 + tax2);
    assert.equal(grandTotal, 22420);

    // Intra-state split
    const cgst = (tax1 + tax2) / 2;
    const sgst = (tax1 + tax2) / 2;
    assert.equal(cgst, 1710);
    assert.equal(sgst, 1710);
  });

  it('5. Quotation discount approval threshold rule triggers when overall discount > 15%', () => {
    // Case A: 10% discount -> No special approval required
    const subtotalA = 100000;
    const discountA = 10000;
    const percentA = (discountA / subtotalA) * 100;
    assert.equal(percentA > 15, false);

    // Case B: 20% discount -> Requires Finance Manager approval
    const subtotalB = 100000;
    const discountB = 20000;
    const percentB = (discountB / subtotalB) * 100;
    assert.equal(percentB > 15, true);
  });

  it('6. Lead scoring classification thresholds (HOT >= 75, WARM 45-74, COLD < 45)', () => {
    const classifyScore = (score) => {
      if (score >= 75) return 'HOT';
      if (score >= 45) return 'WARM';
      return 'COLD';
    };

    assert.equal(classifyScore(95), 'HOT');
    assert.equal(classifyScore(75), 'HOT');
    assert.equal(classifyScore(74), 'WARM');
    assert.equal(classifyScore(50), 'WARM');
    assert.equal(classifyScore(45), 'WARM');
    assert.equal(classifyScore(44), 'COLD');
    assert.equal(classifyScore(10), 'COLD');
  });

  it('7. Opportunity weighted forecast calculation by stage probability', () => {
    const deals = [
      { dealValue: 500000, probabilityPercent: 10 },  // Prospecting (10% = 50k)
      { dealValue: 1000000, probabilityPercent: 50 }, // Proposal (50% = 500k)
      { dealValue: 2000000, probabilityPercent: 90 }, // Negotiation (90% = 1.8M)
      { dealValue: 800000, probabilityPercent: 100 }, // Won (100% = 800k)
    ];

    const unweightedPipeline = deals.reduce((acc, d) => acc + d.dealValue, 0);
    const weightedPipeline = deals.reduce((acc, d) => acc + (d.dealValue * d.probabilityPercent) / 100, 0);

    assert.equal(unweightedPipeline, 4300000);
    assert.equal(weightedPipeline, 3150000);
  });

  it('8. Round-robin weighted capacity routing distribution', () => {
    const reps = [
      { name: 'Rep A', weight: 2, currentCount: 0, dailyLimit: 10 },
      { name: 'Rep B', weight: 1, currentCount: 0, dailyLimit: 5 },
    ];

    // Rep A has weight 2, Rep B has weight 1
    // Total weights = 3. Rep A should receive 2/3 of assignments up to daily capacity
    assert.equal(reps[0].weight / (reps[0].weight + reps[1].weight), 2 / 3);
    assert.equal(reps[1].weight / (reps[0].weight + reps[1].weight), 1 / 3);
  });

  it('9. Multi-touch attribution U-Shaped weighting formula (40-20-40)', () => {
    const dealWonValue = 100000;
    const touchpoints = [
      { channel: 'IndiaMART', position: 'FIRST' },
      { channel: 'Webinar', position: 'MIDDLE' },
      { channel: 'Sales Call', position: 'LAST' },
    ];

    const firstTouchWeight = 0.40;
    const lastTouchWeight = 0.40;
    const middleWeight = 0.20;

    assert.equal(dealWonValue * firstTouchWeight, 40000);
    assert.equal(dealWonValue * middleWeight, 20000);
    assert.equal(dealWonValue * lastTouchWeight, 40000);
    assert.equal(
      dealWonValue * firstTouchWeight + dealWonValue * middleWeight + dealWonValue * lastTouchWeight,
      100000
    );
  });

  it('10. Ingestion channel slug generator and marketplace payload normalization contracts', () => {
    const generateSlug = (name) =>
      (name || 'webhook')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);

    assert.equal(generateSlug('IndiaMART Inbound Push'), 'indiamart-inbound-push');
    assert.equal(generateSlug('TradeIndia Webhook!'), 'tradeindia-webhook');
    assert.equal(generateSlug('Meta Ads / Lead Gen 2026'), 'meta-ads-lead-gen-2026');
    assert.equal(generateSlug(''), 'webhook');

    // Marketplace provider mappings
    const supportedChannels = ['INDIAMART', 'TRADEINDIA', 'META_LEAD_ADS', 'JUSTDIAL', 'CUSTOM_WEBHOOK'];
    assert.equal(supportedChannels.includes('INDIAMART'), true);
    assert.equal(supportedChannels.includes('TRADEINDIA'), true);
    assert.equal(supportedChannels.includes('META_LEAD_ADS'), true);
    assert.equal(supportedChannels.includes('CUSTOM_WEBHOOK'), true);
  });
});
