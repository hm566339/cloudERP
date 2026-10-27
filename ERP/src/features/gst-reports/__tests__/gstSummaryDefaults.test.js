import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getIndianFinancialYearDates,
  getDefaultGstSummaryFilters,
  findCurrentFiscalYear,
  cleanFilterId,
  cleanFilterDate,
  buildGstSummaryPayload,
} from '../gstSummaryConfig.js';

describe('GST Summary Dashboard Defaults and Date Calculation', () => {
  describe('getIndianFinancialYearDates (Indian Financial Year: April 1 to March 31)', () => {
    it('calculates default dates for date in October (mid-financial year)', () => {
      // 2026-10-27 (October 2026 is in FY 2026-27)
      const octDate = new Date(2026, 9, 27); // month index 9 is October
      const { fromDate, toDate } = getIndianFinancialYearDates(octDate);

      assert.equal(fromDate, '2026-04-01', 'From Date should be first day of FY 2026 (2026-04-01)');
      assert.equal(toDate, '2026-10-27', "To Date should be today's date (2026-10-27)");
    });

    it('calculates default dates for date in January (spans previous calendar year April 1)', () => {
      // 2027-01-15 (January 2027 is in FY 2026-27, which started 2026-04-01)
      const janDate = new Date(2027, 0, 15); // month index 0 is January
      const { fromDate, toDate } = getIndianFinancialYearDates(janDate);

      assert.equal(fromDate, '2026-04-01', 'From Date in January should be 2026-04-01');
      assert.equal(toDate, '2027-01-15', 'To Date should be 2027-01-15');
    });

    it('calculates default dates for date in March (end of financial year)', () => {
      // 2027-03-31 (March 31, 2027 is the last day of FY 2026-27)
      const marDate = new Date(2027, 2, 31); // month index 2 is March
      const { fromDate, toDate } = getIndianFinancialYearDates(marDate);

      assert.equal(fromDate, '2026-04-01', 'From Date on March 31 should be 2026-04-01');
      assert.equal(toDate, '2027-03-31', 'To Date should be 2027-03-31');
    });

    it('calculates default dates for date on April 1 (first day of new financial year)', () => {
      // 2027-04-01 (April 1, 2027 starts FY 2027-28)
      const aprDate = new Date(2027, 3, 1); // month index 3 is April
      const { fromDate, toDate } = getIndianFinancialYearDates(aprDate);

      assert.equal(fromDate, '2027-04-01', 'From Date on April 1 should be 2027-04-01');
      assert.equal(toDate, '2027-04-01', 'To Date should be 2027-04-01');
    });

    it('dynamically computes valid dates when called without arguments', () => {
      const { fromDate, toDate } = getIndianFinancialYearDates();
      assert.match(fromDate, /^\d{4}-04-01$/, 'From date must match YYYY-04-01');
      assert.match(toDate, /^\d{4}-\d{2}-\d{2}$/, 'To date must match YYYY-MM-DD');
      assert.ok(toDate >= fromDate, 'To date must be >= from date');
    });
  });

  describe('getDefaultGstSummaryFilters', () => {
    it('returns the expected default values for all filters', () => {
      const fixedDate = new Date(2026, 9, 27);
      const companyId = 'ea811382-0afc-4908-a209-9bedcc63c445';
      const defaults = getDefaultGstSummaryFilters(companyId, fixedDate);

      assert.deepEqual(defaults, {
        companyId: 'ea811382-0afc-4908-a209-9bedcc63c445',
        branchId: '',
        gstRegistrationId: '',
        financialYearId: '',
        fromDate: '2026-04-01',
        toDate: '2026-10-27',
        invoiceType: 'ALL',
        stateCode: '',
        gstRate: '',
        hsn: '',
        customerId: '',
        vendorId: '',
        sortBy: 'invoiceDate',
        sortDirection: 'DESC',
        pageSize: '20',
      });
    });

    it('preserves empty companyId when none is provided', () => {
      const defaults = getDefaultGstSummaryFilters();
      assert.equal(defaults.companyId, '');
      assert.equal(defaults.branchId, '');
      assert.equal(defaults.invoiceType, 'ALL');
      assert.equal(defaults.sortBy, 'invoiceDate');
      assert.equal(defaults.sortDirection, 'DESC');
      assert.equal(defaults.pageSize, '20');
    });
  });

  describe('findCurrentFiscalYear', () => {
    const fiscalYears = [
      { id: 'fy-2024-25', name: 'FY 2024-25', startDate: '2024-04-01', endDate: '2025-03-31', status: 'CLOSED' },
      { id: 'fy-2025-26', name: 'FY 2025-26', startDate: '2025-04-01', endDate: '2026-03-31', status: 'CLOSED' },
      { id: 'fy-2026-27', name: 'FY 2026-27', startDate: '2026-04-01', endDate: '2027-03-31', status: 'ACTIVE', isActive: true },
      { id: 'fy-2027-28', name: 'FY 2027-28', startDate: '2027-04-01', endDate: '2028-03-31', status: 'PLANNED' },
    ];

    it('identifies current fiscal year by explicit isActive/status ACTIVE', () => {
      const current = findCurrentFiscalYear(fiscalYears, new Date(2026, 9, 27));
      assert.ok(current, 'Should find active fiscal year');
      assert.equal(current.id, 'fy-2026-27');
    });

    it('identifies current fiscal year by date range when active flag is absent', () => {
      const listWithoutActiveFlag = fiscalYears.map((fy) => ({ ...fy, status: 'OPEN', isActive: false }));
      const current = findCurrentFiscalYear(listWithoutActiveFlag, new Date(2026, 9, 27));
      assert.ok(current);
      assert.equal(current.id, 'fy-2026-27');
    });

    it('identifies current fiscal year by year label when dates are absent', () => {
      const listWithoutDates = [
        { id: 'fy-old', name: 'FY 2024-25' },
        { id: 'fy-curr', name: 'FY 2026-27' },
      ];
      const current = findCurrentFiscalYear(listWithoutDates, new Date(2026, 9, 27));
      assert.ok(current);
      assert.equal(current.id, 'fy-curr');
    });

    it('returns null when list is empty or undefined', () => {
      assert.equal(findCurrentFiscalYear([]), null);
      assert.equal(findCurrentFiscalYear(null), null);
    });
  });

  describe('buildGstSummaryPayload', () => {
    it('normalizes empty dropdown strings to null without sending labels', () => {
      const filters = {
        companyId: 'ea811382-0afc-4908-a209-9bedcc63c445',
        branchId: '',
        gstRegistrationId: '',
        financialYearId: '',
        fromDate: '2026-04-01',
        toDate: '2026-10-27',
        invoiceType: 'ALL',
        stateCode: '',
        gstRate: '',
        hsn: '',
        customerId: '',
        vendorId: '',
        sortBy: 'invoiceDate',
        sortDirection: 'DESC',
        pageSize: '20',
      };

      const payload = buildGstSummaryPayload(filters);

      assert.equal(payload.companyId, 'ea811382-0afc-4908-a209-9bedcc63c445');
      assert.equal(payload.branchId, null);
      assert.equal(payload.gstRegistrationId, null);
      assert.equal(payload.financialYearId, null);
      assert.equal(payload.fromDate, '2026-04-01');
      assert.equal(payload.toDate, '2026-10-27');
      assert.equal(payload.invoiceType, 'ALL');
      assert.equal(payload.stateCode, '');
      assert.equal(payload.gstRate, null);
      assert.equal(payload.hsn, '');
      assert.equal(payload.customerId, null);
      assert.equal(payload.vendorId, null);
      assert.equal(payload.page, 0);
      assert.equal(payload.size, 20);
      assert.equal(payload.sortBy, 'invoiceDate');
      assert.equal(payload.sortDirection, 'DESC');
    });

    it('strips accidental display labels such as "All Branches" or "Select Company"', () => {
      const filters = {
        companyId: 'Select Company',
        branchId: 'All Branches',
        gstRegistrationId: 'All Registrations',
        financialYearId: 'All Financial Years',
        customerId: 'All Customers',
        vendorId: 'All Vendors',
        hsn: 'All HSN Codes',
        stateCode: 'All States',
        invoiceType: 'All Invoice Types',
      };

      const payload = buildGstSummaryPayload(filters, 'company-uuid-1234');

      assert.equal(payload.companyId, 'company-uuid-1234');
      assert.equal(payload.branchId, null);
      assert.equal(payload.gstRegistrationId, null);
      assert.equal(payload.financialYearId, null);
      assert.equal(payload.customerId, null);
      assert.equal(payload.vendorId, null);
      assert.equal(payload.hsn, '');
      assert.equal(payload.stateCode, '');
      assert.equal(payload.invoiceType, 'ALL');
    });

    it('handles numeric gstRate correctly', () => {
      const payloadWithRate = buildGstSummaryPayload({ gstRate: '18' });
      assert.equal(payloadWithRate.gstRate, 18);

      const payloadWithZeroRate = buildGstSummaryPayload({ gstRate: 0 });
      assert.equal(payloadWithZeroRate.gstRate, 0);

      const payloadWithEmptyRate = buildGstSummaryPayload({ gstRate: '' });
      assert.equal(payloadWithEmptyRate.gstRate, null);
    });
  });
});
