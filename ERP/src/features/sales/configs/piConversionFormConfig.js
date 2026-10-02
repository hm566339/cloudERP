/**
 * piConversionFormConfig.js
 *
 * Proforma Invoice conversion form sections configuration.
 * Consumed by PIConversionFormModal → UpdateModal.
 *
 * Same pattern as customerFormConfig.js.
 * This file contains ONLY data — labels, field names, types, placeholders.
 * No React, no JSX, no UI code.
 */

/**
 * Two-column sectioned layout for the Quotation → PI conversion form.
 *
 * Sections render left-to-right in a 2-column grid:
 *   Left column:  Source Quotation (read-only), PI Details
 *   Right column: Advance & Payment, Accounts
 *
 * @type {Array<{ title: string, fields: FieldConfig[] }>}
 */
export const piConversionFormSections = [
  // ── LEFT COLUMN ──────────────────────────────────────────────────────
  {
    title: 'Source Quotation',
    fields: [
      {
        key:         'quotationNumber',
        label:       'Quotation Number',
        type:        'text',
        disabled:    true,
      },
      {
        key:         'customerName',
        label:       'Customer',
        type:        'text',
        disabled:    true,
      },
    ],
  },
  {
    title: 'PI Details',
    fields: [
      {
        key:         'piDate',
        label:       'PI Date',
        type:        'date',
        required:    true,
      },
      {
        key:         'piValidTill',
        label:       'Valid Until',
        type:        'date',
        required:    true,
      },
    ],
  },

  // ── RIGHT COLUMN ─────────────────────────────────────────────────────
  {
    title: 'Advance & Payment',
    fields: [
      {
        key:          'advanceRequired',
        label:        'Advance Payment Required',
        type:         'boolean',
        defaultValue: false,
      },
      {
        key:          'advanceAmount',
        label:        'Advance Amount (₹)',
        type:         'number',
        placeholder:  '0.00',
        min:          0,
        step:         '0.01',
        defaultValue: 0,
        hidden:       (data) => !data.advanceRequired,
      },
      {
        key:         'paymentCondition',
        label:       'Payment Condition',
        type:        'text',
        placeholder: 'e.g. 50% advance, 50% on delivery',
        hidden:      (data) => !data.advanceRequired,
      },
      {
        key:         'paymentMode',
        label:       'Payment Mode',
        type:        'select',
        hidden:      (data) => !data.advanceRequired,
        options:     [
          { value: 'CASH',          label: 'Cash' },
          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
          { value: 'UPI',           label: 'UPI' },
          { value: 'CHEQUE',        label: 'Cheque' },
          { value: 'CARD',          label: 'Card' },
        ],
      },
    ],
  },
  {
    title: 'Accounts',
    fields: [
      {
        key:     'bankAccountId',
        label:   'Bank Account',
        type:    'select',
        hidden:  (data) => !data.advanceRequired,
        options: [], // injected dynamically
      },
      {
        key:     'receivableAccountId',
        label:   'Receivable Account',
        type:    'select',
        hidden:  (data) => !data.advanceRequired,
        options: [], // injected dynamically
      },
      {
        key:     'receiptAccountId',
        label:   'Receipt Account',
        type:    'select',
        hidden:  (data) => !data.advanceRequired,
        options: [], // injected dynamically
      },
    ],
  },
];
