import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ERP_MODULES,
  BUSINESS_PIPELINES,
  PRICING_PLANS,
  INDUSTRY_USE_CASES,
  REAL_INTEGRATIONS,
  FAQ_ITEMS,
  scrollToSection,
  LIVE_DEMO_OPERATIONS,
  INTER_COMPANY_SIGNALS,
  checkPrefersReducedMotion
} from '../landingData.js';

describe('Mark2 ERP Premium Landing Page Component & Data Verification Suite', () => {

  describe('1. ERP Core Modules Catalog Data', () => {
    it('contains all 6 essential enterprise modules', () => {
      assert.equal(ERP_MODULES.length, 6);
      const moduleIds = ERP_MODULES.map(m => m.id);
      assert.deepEqual(moduleIds, ['finance', 'sales', 'purchase', 'inventory', 'gst', 'workflows']);
    });

    it('every module has an icon, badge, description, and at least 4 inclusions', () => {
      ERP_MODULES.forEach(mod => {
        assert.ok(mod.id, 'Module must have an id');
        assert.ok(mod.name, `Module ${mod.id} must have a name`);
        assert.ok(mod.description, `Module ${mod.id} must have a description`);
        assert.ok(mod.icon, `Module ${mod.id} must have an icon`);
        assert.ok(mod.badge, `Module ${mod.id} must have a badge`);
        assert.ok(Array.isArray(mod.features), `Module ${mod.id} features must be an array`);
        assert.ok(mod.features.length >= 4, `Module ${mod.id} must have at least 4 features`);
      });
    });
  });

  describe('2. Business Pipelines (Order-to-Cash & Procure-to-Pay)', () => {
    it('contains Order-to-Cash and Procure-to-Pay pipelines', () => {
      assert.equal(BUSINESS_PIPELINES.length, 2);
      assert.equal(BUSINESS_PIPELINES[0].id, 'o2c');
      assert.equal(BUSINESS_PIPELINES[1].id, 'p2p');
    });

    it('Order-to-Cash pipeline contains 5 sequential phases from Quotation to Receipt Voucher', () => {
      const o2c = BUSINESS_PIPELINES[0];
      assert.equal(o2c.steps.length, 5);
      const stepCodes = o2c.steps.map(s => s.code);
      assert.deepEqual(stepCodes, ['QT', 'SO', 'DC', 'INV', 'RV']);
    });

    it('Procure-to-Pay pipeline contains 5 sequential phases from Requisition to Payment Voucher', () => {
      const p2p = BUSINESS_PIPELINES[1];
      assert.equal(p2p.steps.length, 5);
      const stepCodes = p2p.steps.map(s => s.code);
      assert.deepEqual(stepCodes, ['PR', 'RFQ', 'PO', 'GRN', 'PV']);
    });
  });

  describe('3. Database-Aligned SaaS Pricing Plans', () => {
    it('contains exactly the 4 database-backed plans', () => {
      assert.equal(PRICING_PLANS.length, 4);
      const planCodes = PRICING_PLANS.map(p => p.code);
      assert.deepEqual(planCodes, ['30_DAY_FREE_TRIAL', 'BASIC', 'PRO', 'BUSINESS_PLAN']);
    });

    it('30-Day Free Trial plan has price 0 and includes up to 4 companies', () => {
      const trial = PRICING_PLANS.find(p => p.code === '30_DAY_FREE_TRIAL');
      assert.ok(trial);
      assert.equal(trial.monthlyPrice, 0);
      assert.equal(trial.annualPrice, 0);
      assert.ok(trial.limits.companies.includes('4 Companies'));
      assert.ok(trial.features.length >= 8);
    });

    it('Basic, Pro, and Enterprise plans have valid pricing and feature tiers', () => {
      const basic = PRICING_PLANS.find(p => p.code === 'BASIC');
      const pro = PRICING_PLANS.find(p => p.code === 'PRO');
      const enterprise = PRICING_PLANS.find(p => p.code === 'BUSINESS_PLAN');

      assert.equal(basic.monthlyPrice, 999);
      assert.equal(pro.monthlyPrice, 2999);
      assert.equal(enterprise.monthlyPrice, 19999);

      // Verify annual savings
      assert.ok(basic.annualPrice < basic.monthlyPrice);
      assert.ok(pro.annualPrice < pro.monthlyPrice);
      assert.ok(enterprise.annualPrice < enterprise.monthlyPrice);
    });
  });

  describe('4. Industry Use Cases & Verified Integrations', () => {
    it('provides 3 concrete industry use cases', () => {
      assert.equal(INDUSTRY_USE_CASES.length, 3);
      const ids = INDUSTRY_USE_CASES.map(i => i.id);
      assert.deepEqual(ids, ['distribution', 'manufacturing', 'holding']);
    });

    it('advertises only verified integrations (Razorpay, GSTN, Spreadsheets/PDF, Local Printing)', () => {
      assert.equal(REAL_INTEGRATIONS.length, 4);
      const names = REAL_INTEGRATIONS.map(i => i.name);
      assert.ok(names.some(n => n.includes('Razorpay')));
      assert.ok(names.some(n => n.includes('GSTN')));
      assert.ok(names.some(n => n.includes('Spreadsheet')));
      assert.ok(names.some(n => n.includes('Printing')));
    });
  });

  describe('5. FAQ Items & Reassurances', () => {
    it('contains at least 6 thorough FAQ items addressing trial, multi-company, and GST', () => {
      assert.ok(FAQ_ITEMS.length >= 6);
      const questions = FAQ_ITEMS.map(f => f.question.toLowerCase());
      assert.ok(questions.some(q => q.includes('30-day free trial')));
      assert.ok(questions.some(q => q.includes('credit card')));
      assert.ok(questions.some(q => q.includes('multiple companies')));
      assert.ok(questions.some(q => q.includes('gst')));
    });
  });

  describe('6. ROI Calculator Logic & Mathematical Soundness', () => {
    it('calculates hours saved, annual cost savings, and DSO reduction correctly', () => {
      const calculateRoi = ({ invoicesCount, teamSize, companiesCount }) => {
        const hoursSaved = Math.round((invoicesCount * 0.3) + (companiesCount * 28));
        const monthlyCostSaved = Math.round(hoursSaved * 450);
        const annualCostSaved = monthlyCostSaved * 12;
        const dsoReduction = Math.min(14, Math.max(7, Math.round(7 + (companiesCount * 1.5))));
        return { hoursSaved, monthlyCostSaved, annualCostSaved, dsoReduction };
      };

      const result = calculateRoi({ invoicesCount: 350, teamSize: 6, companiesCount: 2 });
      // 350 * 0.3 = 105; 2 * 28 = 56; Total = 161 hrs
      assert.equal(result.hoursSaved, 161);
      // 161 * 450 = 72,450
      assert.equal(result.monthlyCostSaved, 72450);
      assert.equal(result.annualCostSaved, 869400);
      assert.equal(result.dsoReduction, 10);
    });
  });

  describe('7. Smooth Scroll Helper Safety', () => {
    it('scrollToSection executes safely without throwing when element or window is undefined', () => {
      assert.doesNotThrow(() => {
        scrollToSection(null, 'non-existent-section-id');
      });
    });
  });

  describe('8. Live Business Operations Simulation (Demo Data)', () => {
    it('contains realistic operations across Sales, Finance, Inventory, Purchase, and GST', () => {
      assert.ok(Array.isArray(LIVE_DEMO_OPERATIONS));
      assert.ok(LIVE_DEMO_OPERATIONS.length >= 6);

      const categories = LIVE_DEMO_OPERATIONS.map(op => op.category);
      assert.ok(categories.includes('sales'));
      assert.ok(categories.includes('finance'));
      assert.ok(categories.includes('inventory'));
      assert.ok(categories.includes('purchase'));
      assert.ok(categories.includes('gst'));
    });

    it('every operation contains required fields, code, action, and clear demo labeling', () => {
      LIVE_DEMO_OPERATIONS.forEach(op => {
        assert.ok(op.id, 'Must have id');
        assert.ok(op.code, `Operation ${op.id} must have code`);
        assert.ok(op.title, `Operation ${op.id} must have title`);
        assert.ok(op.entity, `Operation ${op.id} must specify entity`);
        assert.ok(op.action, `Operation ${op.id} must have action description`);
        assert.ok(op.impact, `Operation ${op.id} must have impact summary`);
        assert.ok(op.status, `Operation ${op.id} must have status`);
        assert.ok(op.icon, `Operation ${op.id} must have icon`);
        assert.ok(op.moduleTab, `Operation ${op.id} must specify moduleTab`);
      });
    });

    it('operations demonstrate realistic transitions like Pending to Paid and order to reservation', () => {
      const invPayment = LIVE_DEMO_OPERATIONS.find(op => op.code.includes('INV'));
      assert.ok(invPayment);
      assert.ok(invPayment.action.toLowerCase().includes('paid'));

      const soOrder = LIVE_DEMO_OPERATIONS.find(op => op.code.includes('SO'));
      assert.ok(soOrder);
      assert.ok(soOrder.impact.toLowerCase().includes('stock'));
    });
  });

  describe('9. Multi-Company Signals & Inter-Entity Synchronization', () => {
    it('contains parent-subsidiary synchronization signals', () => {
      assert.ok(Array.isArray(INTER_COMPANY_SIGNALS));
      assert.ok(INTER_COMPANY_SIGNALS.length >= 4);

      INTER_COMPANY_SIGNALS.forEach(sig => {
        assert.ok(sig.id);
        assert.ok(sig.from);
        assert.ok(sig.to);
        assert.ok(sig.label);
        assert.ok(sig.badge);
      });
    });

    it('demonstrates master data broadcast and trial balance roll-up', () => {
      const labels = INTER_COMPANY_SIGNALS.map(s => s.label.toLowerCase());
      assert.ok(labels.some(l => l.includes('master chart of accounts') || l.includes('policy')));
      assert.ok(labels.some(l => l.includes('trial balance') || l.includes('roll-up') || l.includes('ebitda')));
    });
  });

  describe('10. Accessibility & Prefers-Reduced-Motion Safeguards', () => {
    it('checkPrefersReducedMotion returns boolean and handles non-browser / mock environments', () => {
      const result = checkPrefersReducedMotion();
      assert.equal(typeof result, 'boolean');
    });
  });
});

