/**
 * customerFormConfig.js
 *
 * Customer entity form sections configuration.
 * Consumed by CustomerFormModal → UpdateModal.
 *
 * This file contains ONLY data — labels, field names, types, placeholders.
 * No React, no JSX, no UI code.
 *
 * To add/remove/reorder fields: edit this file only.
 * The modal renders automatically from this config.
 *
 * Reuse pattern for other entities:
 *   vendorFormConfig.js   → vendorFormSections
 *   productFormConfig.js  → productFormSections
 *   employeeFormConfig.js → employeeFormSections
 */

/**
 * Two-column sectioned layout for the Customer create/edit form.
 *
 * Sections render left-to-right in a 2-column grid:
 *   Left column:  Basic Information, Tax Information
 *   Right column: Address Details, Account Settings
 *
 * @type {Array<{ title: string, fields: FieldConfig[] }>}
 */
export const customerFormSections = [
  // ── LEFT COLUMN ──────────────────────────────────────────────────────
  {
    title: 'Basic Information',
    fields: [
      {
        key:         'customerCode',
        label:       'Customer Code',
        type:        'text',
        placeholder: 'e.g. CUST-001',
        uppercase:   true,
      },
      {
        key:         'customerName',
        label:       'Customer Name',
        type:        'text',
        required:    true,
        placeholder: 'e.g. Acme Corp',
      },
      {
        key:         'email',
        label:       'Email Address',
        type:        'email',
        placeholder: 'contact@company.com',
      },
      {
        key:         'phone',
        label:       'Phone Number',
        type:        'tel',
        placeholder: '+91 98765 43210',
      },
    ],
  },
  {
    title: 'Tax Information',
    fields: [
      {
        key:         'gstin',
        label:       'GSTIN',
        type:        'text',
        placeholder: '22AAAAA0000A1Z5',
        uppercase:   true,
        maxLength:   15,
      },
      {
        key:         'panNo',
        label:       'PAN Number',
        type:        'text',
        placeholder: 'ABCDE1234F',
        uppercase:   true,
        maxLength:   10,
      },
    ],
  },

  // ── RIGHT COLUMN ─────────────────────────────────────────────────────
  {
    title: 'Address Details',
    fields: [
      {
        key:         'addressLine1',
        label:       'Street Address',
        type:        'text',
        placeholder: 'Street address, company name, c/o',
        span:        'full',
      },
      {
        key:         'city',
        label:       'City',
        type:        'text',
        placeholder: 'e.g. Mumbai',
      },
      {
        key:         'state',
        label:       'State / Province',
        type:        'text',
        placeholder: 'e.g. Maharashtra',
      },
      {
        key:         'country',
        label:       'Country',
        type:        'text',
        placeholder: 'e.g. India',
      },
    ],
  },
  {
    title: 'Account Settings',
    fields: [
      {
        key:          'creditLimit',
        label:        'Credit Limit (₹)',
        type:         'number',
        placeholder:  '0.00',
        min:          0,
        step:         '0.01',
        defaultValue: 0,
      },
      {
        key:          'isActive',
        label:        'Active Customer',
        type:         'boolean',
        defaultValue: true,
      },
    ],
  },
];
