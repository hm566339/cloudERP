/**
 * Expense Storage & Accounting Service
 * Provides tenant-isolated persistence, seeded demo data, and automated double-entry GL journal posting.
 */

const getStorageKey = (type, companyId) => `erp_${type}_${companyId || 'default'}`;

const INITIAL_REQUESTS = [
  {
    id: 'REQ-2026-001',
    requestNumber: 'REQ-2026-001',
    date: '2026-08-24',
    requesterName: 'Ramesh Kumar',
    employeeType: 'Driver',
    employeeId: 'EMP-DRV-001',
    requestType: 'Advance',
    category: 'Travel & Conveyance',
    purpose: 'Interstate delivery run Mumbai to Pune - Fuel & Toll advance',
    requestedAmount: 2500,
    approvedAmount: 2000,
    status: 'Approved',
    approvedBy: 'Finance Manager',
    approvedDate: '2026-08-24',
    notes: 'Approved ₹2,000 as per trip allowance limit.'
  },
  {
    id: 'REQ-2026-002',
    requestNumber: 'REQ-2026-002',
    date: '2026-08-25',
    requesterName: 'Pooja Sharma',
    employeeType: 'Employee',
    employeeId: 'EMP-SALES-004',
    requestType: 'Expense',
    category: 'Client Entertainment',
    purpose: 'Lunch meeting with client stakeholders for Q3 renewal',
    requestedAmount: 3800,
    approvedAmount: 3800,
    status: 'Pending Approval',
    notes: 'Awaiting executive sign-off.'
  },
  {
    id: 'REQ-2026-003',
    requestNumber: 'REQ-2026-003',
    date: '2026-08-26',
    requesterName: 'Vikram Patil',
    employeeType: 'Driver',
    employeeId: 'EMP-DRV-002',
    requestType: 'Expense',
    category: 'Vehicle Maintenance',
    purpose: 'Urgent tire puncture repair and engine oil top-up during transit',
    requestedAmount: 1450,
    approvedAmount: 1450,
    status: 'Approved',
    approvedBy: 'Logistics Head',
    approvedDate: '2026-08-26',
    notes: 'Bills attached.'
  }
];

const INITIAL_EXPENSES = [
  {
    id: 'EXP-2026-001',
    expenseNumber: 'EXP-2026-001',
    date: '2026-08-24',
    employeeName: 'Ramesh Kumar',
    employeeType: 'Driver',
    employeeId: 'EMP-DRV-001',
    category: 'Travel & Conveyance',
    purpose: 'Delivery trip delivery route fuel, toll and parking charges',
    paymentType: 'Self Paid', // 'Self Paid' | 'Company Paid' | 'Advance'
    requestRef: 'REQ-2026-001',
    salesOrderRef: 'SO-2026-001',
    deliveryChallanRef: 'DC-2026-004',
    vehicleNo: 'MH-12-RN-4821',
    receiptAttachment: 'fuel_receipt_1024.pdf',
    items: [
      { id: '1', description: 'Diesel Fuel (40L)', category: 'Fuel', quantity: 40, rate: 30, amount: 1200 },
      { id: '2', description: 'Expressway Toll Booth', category: 'Toll', quantity: 1, rate: 350, amount: 350 },
      { id: '3', description: 'Warehouse Parking Fee', category: 'Parking', quantity: 1, rate: 100, amount: 100 }
    ],
    totalAmount: 1650,
    status: 'Approved',
    accountingStatus: 'Posted',
    journalVoucherNo: 'JV-2026-0842',
    notes: 'Driver paid from pocket. Reimbursement created.'
  },
  {
    id: 'EXP-2026-002',
    expenseNumber: 'EXP-2026-002',
    date: '2026-08-25',
    employeeName: 'Amit Verma',
    employeeType: 'Employee',
    employeeId: 'EMP-OPS-009',
    category: 'Office Supplies',
    purpose: 'Monthly warehouse stationery and thermal printer rolls',
    paymentType: 'Company Paid',
    requestRef: '',
    salesOrderRef: '',
    deliveryChallanRef: '',
    vehicleNo: '',
    receiptAttachment: 'stationery_bill_981.pdf',
    items: [
      { id: '1', description: 'Barcode Thermal Rolls (Pack of 10)', category: 'Office Supplies', quantity: 10, rate: 120, amount: 1200 },
      { id: '2', description: 'Packing Tapes & Scissors', category: 'Office Supplies', quantity: 1, rate: 450, amount: 450 }
    ],
    totalAmount: 1650,
    status: 'Approved',
    accountingStatus: 'Posted',
    journalVoucherNo: 'JV-2026-0843',
    notes: 'Paid using corporate card.'
  },
  {
    id: 'EXP-2026-003',
    expenseNumber: 'EXP-2026-003',
    date: '2026-08-26',
    employeeName: 'Vikram Patil',
    employeeType: 'Driver',
    employeeId: 'EMP-DRV-002',
    category: 'Vehicle Maintenance',
    purpose: 'Emergency breakdown mechanical assistance',
    paymentType: 'Self Paid',
    requestRef: 'REQ-2026-003',
    salesOrderRef: '',
    deliveryChallanRef: 'DC-2026-009',
    vehicleNo: 'MH-14-GH-9011',
    receiptAttachment: 'mechanic_repair_slip.pdf',
    items: [
      { id: '1', description: 'Tire Tube Vulcanizing & Valve Replacement', category: 'Vehicle Maintenance', quantity: 1, rate: 650, amount: 650 },
      { id: '2', description: 'Engine Coolant Top-up (2L)', category: 'Vehicle Maintenance', quantity: 2, rate: 400, amount: 800 }
    ],
    totalAmount: 1450,
    status: 'Submitted',
    accountingStatus: 'Unposted',
    journalVoucherNo: null,
    notes: 'Pending manager review.'
  }
];

const INITIAL_REIMBURSEMENTS = [
  {
    id: 'RMB-2026-001',
    reimbursementNumber: 'RMB-2026-001',
    employeeName: 'Ramesh Kumar',
    employeeType: 'Driver',
    employeeId: 'EMP-DRV-001',
    expenseRef: 'EXP-2026-001',
    expenseDate: '2026-08-24',
    approvedAmount: 1650,
    reimbursedAmount: 1650,
    balanceAmount: 0,
    paymentMethod: 'Bank Transfer (IMPS)',
    bankAccount: 'HDFC Bank - Current A/C (...8891)',
    paymentDate: '2026-08-25',
    status: 'Paid',
    referenceTransactionId: 'IMPS/624918294102',
    journalVoucherNo: 'JV-2026-0850'
  },
  {
    id: 'RMB-2026-002',
    reimbursementNumber: 'RMB-2026-002',
    employeeName: 'Vikram Patil',
    employeeType: 'Driver',
    employeeId: 'EMP-DRV-002',
    expenseRef: 'EXP-2026-003',
    expenseDate: '2026-08-26',
    approvedAmount: 1450,
    reimbursedAmount: 0,
    balanceAmount: 1450,
    paymentMethod: 'Pending',
    bankAccount: 'Not Assigned',
    paymentDate: null,
    status: 'Pending',
    referenceTransactionId: null,
    journalVoucherNo: null
  }
];

export const expenseStorageService = {
  // ── Requests ──
  getRequests(companyId) {
    const key = getStorageKey('expense_requests', companyId);
    const existing = localStorage.getItem(key);
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    try {
      return JSON.parse(existing);
    } catch {
      return INITIAL_REQUESTS;
    }
  },

  saveRequest(companyId, request) {
    const list = this.getRequests(companyId);
    let updated;
    if (request.id) {
      updated = list.map(r => r.id === request.id ? { ...r, ...request } : r);
    } else {
      const seq = String(list.length + 1).padStart(3, '0');
      const newReq = {
        ...request,
        id: `REQ-${new Date().getFullYear()}-${seq}`,
        requestNumber: `REQ-${new Date().getFullYear()}-${seq}`,
        date: request.date || new Date().toISOString().split('T')[0],
        status: request.status || 'Pending Approval'
      };
      updated = [newReq, ...list];
    }
    localStorage.setItem(getStorageKey('expense_requests', companyId), JSON.stringify(updated));
    return updated;
  },

  updateRequestStatus(companyId, id, status, approvedAmount = null) {
    const list = this.getRequests(companyId);
    const updated = list.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          approvedAmount: approvedAmount !== null ? Number(approvedAmount) : r.approvedAmount || r.requestedAmount,
          approvedDate: status === 'Approved' ? new Date().toISOString().split('T')[0] : r.approvedDate
        };
      }
      return r;
    });
    localStorage.setItem(getStorageKey('expense_requests', companyId), JSON.stringify(updated));
    return updated;
  },

  // ── Expenses ──
  getExpenses(companyId) {
    const key = getStorageKey('expenses', companyId);
    const existing = localStorage.getItem(key);
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    try {
      return JSON.parse(existing);
    } catch {
      return INITIAL_EXPENSES;
    }
  },

  saveExpense(companyId, expense) {
    const list = this.getExpenses(companyId);
    let updated;
    const items = expense.items && expense.items.length > 0
      ? expense.items
      : [{ id: '1', description: expense.description || 'Expense Item', category: expense.category || 'General', quantity: 1, rate: Number(expense.amount) || 0, amount: Number(expense.amount) || 0 }];

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    if (expense.id) {
      updated = list.map(e => e.id === expense.id ? { ...e, ...expense, items, totalAmount } : e);
    } else {
      const seq = String(list.length + 1).padStart(3, '0');
      const newExp = {
        ...expense,
        id: `EXP-${new Date().getFullYear()}-${seq}`,
        expenseNumber: `EXP-${new Date().getFullYear()}-${seq}`,
        date: expense.date || new Date().toISOString().split('T')[0],
        items,
        totalAmount,
        status: expense.status || 'Submitted',
        accountingStatus: expense.accountingStatus || 'Unposted',
        journalVoucherNo: expense.journalVoucherNo || null
      };
      updated = [newExp, ...list];

      // If Self Paid, automatically create corresponding reimbursement entry
      if (newExp.paymentType === 'Self Paid') {
        this.createReimbursementFromExpense(companyId, newExp);
      }
    }
    localStorage.setItem(getStorageKey('expenses', companyId), JSON.stringify(updated));
    return updated;
  },

  postExpenseToAccounting(companyId, expenseId) {
    const expenses = this.getExpenses(companyId);
    let targetExpense = null;

    const updated = expenses.map(exp => {
      if (exp.id === expenseId) {
        const jvNo = exp.journalVoucherNo || `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        targetExpense = {
          ...exp,
          status: 'Approved',
          accountingStatus: 'Posted',
          journalVoucherNo: jvNo
        };
        return targetExpense;
      }
      return exp;
    });

    localStorage.setItem(getStorageKey('expenses', companyId), JSON.stringify(updated));

    // If Self Paid, ensure reimbursement entry exists and is approved
    if (targetExpense && targetExpense.paymentType === 'Self Paid') {
      const reimbursements = this.getReimbursements(companyId);
      const exists = reimbursements.find(r => r.expenseRef === targetExpense.expenseNumber);
      if (!exists) {
        this.createReimbursementFromExpense(companyId, targetExpense);
      }
    }

    return targetExpense;
  },

  // ── Reimbursements ──
  getReimbursements(companyId) {
    const key = getStorageKey('expense_reimbursements', companyId);
    const existing = localStorage.getItem(key);
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(INITIAL_REIMBURSEMENTS));
      return INITIAL_REIMBURSEMENTS;
    }
    try {
      return JSON.parse(existing);
    } catch {
      return INITIAL_REIMBURSEMENTS;
    }
  },

  createReimbursementFromExpense(companyId, expense) {
    const list = this.getReimbursements(companyId);
    const seq = String(list.length + 1).padStart(3, '0');
    const newRmb = {
      id: `RMB-${new Date().getFullYear()}-${seq}`,
      reimbursementNumber: `RMB-${new Date().getFullYear()}-${seq}`,
      employeeName: expense.employeeName || 'Staff',
      employeeType: expense.employeeType || 'Employee',
      employeeId: expense.employeeId || 'EMP-001',
      expenseRef: expense.expenseNumber || expense.id,
      expenseDate: expense.date,
      approvedAmount: expense.totalAmount,
      reimbursedAmount: 0,
      balanceAmount: expense.totalAmount,
      paymentMethod: 'Pending',
      bankAccount: 'Not Assigned',
      paymentDate: null,
      status: 'Pending',
      referenceTransactionId: null,
      journalVoucherNo: null
    };
    const updated = [newRmb, ...list];
    localStorage.setItem(getStorageKey('expense_reimbursements', companyId), JSON.stringify(updated));
    return updated;
  },

  processReimbursementPayment(companyId, reimbursementId, paymentData) {
    const list = this.getReimbursements(companyId);
    const updated = list.map(rmb => {
      if (rmb.id === reimbursementId) {
        const paidAmount = Number(paymentData.amount) || rmb.balanceAmount;
        const newReimbursed = (rmb.reimbursedAmount || 0) + paidAmount;
        const newBalance = Math.max(0, rmb.approvedAmount - newReimbursed);
        const jvNo = rmb.journalVoucherNo || `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        return {
          ...rmb,
          reimbursedAmount: newReimbursed,
          balanceAmount: newBalance,
          paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
          bankAccount: paymentData.bankAccount || 'Main Operational Bank',
          paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
          referenceTransactionId: paymentData.referenceTransactionId || `TXN-${Date.now().toString().slice(-8)}`,
          status: newBalance === 0 ? 'Paid' : 'Approved',
          journalVoucherNo: jvNo
        };
      }
      return rmb;
    });

    localStorage.setItem(getStorageKey('expense_reimbursements', companyId), JSON.stringify(updated));
    return updated;
  },

  // ── Accounting Entry Generation ──
  getAccountingEntryForExpense(expense) {
    if (!expense) return null;
    const amount = Number(expense.totalAmount) || 0;
    const isSelfPaid = expense.paymentType === 'Self Paid';
    const isAdvance = expense.paymentType === 'Advance';

    // Automated Double-Entry Rules:
    // 1. Self Paid (Employee spent out of pocket):
    //    Debit  → Expense Account (e.g., Fuel / Conveyance / Office Expense)
    //    Credit → Employee / Driver Payable
    // 2. Company Paid (Corporate card / cash):
    //    Debit  → Expense Account
    //    Credit → Bank Account / Petty Cash
    // 3. Advance:
    //    Debit  → Expense Account
    //    Credit → Employee Advance Account
    let creditAccount = 'Staff / Driver Payable A/C';
    let creditCode = '2100-PAYABLE';
    if (!isSelfPaid && !isAdvance) {
      creditAccount = 'Corporate Bank Account (HDFC Bank)';
      creditCode = '1010-BANK';
    } else if (isAdvance) {
      creditAccount = 'Employee Advance Ledger A/C';
      creditCode = '1050-ADVANCE';
    }

    return {
      voucherNumber: expense.journalVoucherNo || `JV-DRAFT-${expense.id}`,
      voucherDate: expense.date,
      sourceModule: 'Expenses',
      referenceNumber: expense.expenseNumber || expense.id,
      notes: `Automated posting for expense ${expense.expenseNumber} (${expense.purpose})`,
      lines: [
        {
          id: 'line-1',
          accountCode: '5100-EXP',
          accountName: `${expense.category || 'General'} Expense A/C`,
          nature: 'EXPENSE',
          debit: amount,
          credit: 0,
          description: expense.purpose || 'Expense record'
        },
        {
          id: 'line-2',
          accountCode: creditCode,
          accountName: creditAccount,
          nature: isSelfPaid ? 'LIABILITY' : 'ASSET',
          debit: 0,
          credit: amount,
          description: `Payable settlement liability for ${expense.employeeName || 'Staff'}`
        }
      ],
      totalDebit: amount,
      totalCredit: amount,
      isBalanced: true
    };
  },

  getAccountingEntryForReimbursement(reimbursement) {
    if (!reimbursement) return null;
    const amount = Number(reimbursement.reimbursedAmount || reimbursement.approvedAmount) || 0;

    return {
      voucherNumber: reimbursement.journalVoucherNo || `JV-REIMB-${reimbursement.id}`,
      voucherDate: reimbursement.paymentDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Reimbursements',
      referenceNumber: reimbursement.reimbursementNumber || reimbursement.id,
      notes: `Reimbursement payout to ${reimbursement.employeeName} for ${reimbursement.expenseRef}`,
      lines: [
        {
          id: 'line-1',
          accountCode: '2100-PAYABLE',
          accountName: 'Staff / Driver Payable A/C',
          nature: 'LIABILITY',
          debit: amount,
          credit: 0,
          description: `Settlement of expense ${reimbursement.expenseRef}`
        },
        {
          id: 'line-2',
          accountCode: '1010-BANK',
          accountName: reimbursement.bankAccount || 'HDFC Bank - Current A/C',
          nature: 'ASSET',
          debit: 0,
          credit: amount,
          description: `Payment via ${reimbursement.paymentMethod || 'Bank Transfer'}`
        }
      ],
      totalDebit: amount,
      totalCredit: amount,
      isBalanced: true
    };
  }
};
