export const proformaInvoiceFormConfig = {
  documentType: 'proforma-invoice',
  title: 'Create Direct Proforma Invoice',
  subtitle: 'Prepare a proforma invoice',
  header: {
    title: 'Create Direct Proforma Invoice',
    subtitle: 'Prepare a proforma invoice',
    fields: [
      { key: 'piDate', label: 'PI Date', type: 'date', required: true },
      { key: 'piValidTill', label: 'Valid Until', type: 'date', required: true },
    ],
  },
  sidebar: {
    sections: [
      {
        id: 'customerDetails',
        title: 'Customer Details',
        fields: [
          { key: 'customerId', label: 'Customer', type: 'custom', required: true },
          { key: 'placeOfSupplyStateId', label: 'Place of Supply', type: 'select', required: true, options: [] },
        ],
      },
      {
        id: 'paymentTerms',
        title: 'Payment & Terms',
        fields: [
          { key: 'paymentTermId', label: 'Payment Terms', type: 'select', options: [] },
          { key: 'deliveryTerms', label: 'Delivery Terms', type: 'textarea', rows: 2 },
          { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 },
        ],
      },
      {
        id: 'advancePayment',
        title: 'Advance & Payment',
        fields: [
          { key: 'advanceRequired', checkboxLabel: 'Advance Payment Required', type: 'checkbox' },
          { key: 'advanceAmount', label: 'Advance Amount', type: 'currency', min: 0, hidden: ({ values }) => !values.advanceRequired },
          { key: 'paymentMode', label: 'Payment Mode', type: 'select', options: [], hidden: ({ values }) => !values.advanceRequired },
          { key: 'bankAccountId', label: 'Bank Account', type: 'select', options: [], hidden: ({ values }) => !values.advanceRequired },
          { key: 'receivableAccountId', label: 'Receivable Account', type: 'select', options: [], hidden: ({ values }) => !values.advanceRequired },
          { key: 'receiptAccountId', label: 'Receipt Account', type: 'select', options: [], hidden: ({ values }) => !values.advanceRequired },
        ],
      },
    ],
  },
  items: {
    title: 'Items',
    addButtonLabel: 'Add Item',
    gridTemplateColumns: 'minmax(150px, 1.5fr) minmax(110px, 1.1fr) minmax(130px, 1.3fr) minmax(70px, .7fr) minmax(100px, 1fr) minmax(70px, .7fr) minmax(75px, .75fr) minmax(90px, .9fr) minmax(95px, .95fr) 34px',
    itemDefaults: { quantity: 1, unitPrice: 0, discountPercent: 0, unit: 'NOS' },
    columns: [
      { key: 'itemId', label: 'Product', type: 'searchable-select', required: true, options: [] },

      { key: 'hsnSacCode', label: 'HSN / SAC', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'quantity', label: 'Qty', type: 'number', required: true, min: 0.01 },
      { key: 'unitPrice', label: 'Price', type: 'currency', required: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'text' },
      { key: 'discountPercent', label: 'Disc %', type: 'number', min: 0, max: 100 },
      { key: 'tax', label: 'Tax', type: 'currency', readOnly: true },
      { key: 'total', label: 'Total', type: 'currency', readOnly: true }
    ],
    allowDelete: true,
  },
  summary: {
    title: 'Proforma Invoice Summary',
    rows: [
      { key: 'subtotal', label: 'Sub Total', type: 'currency', readOnly: true },
      { key: 'discount', label: 'Discount', type: 'currency', readOnly: true },
      { key: 'taxableAmount', label: 'Taxable Amount', type: 'currency', readOnly: true },
      { key: 'taxAmount', label: 'Tax Amount', type: 'currency', readOnly: true },
      { key: 'freightCharges', label: 'Freight Charges', type: 'currency-input', min: 0 },
      { key: 'otherCharges', label: 'Other Charges', type: 'currency-input', min: 0 },
      { key: 'roundOff', label: 'Round Off', type: 'currency', readOnly: true },
      { key: 'grandTotal', label: 'Grand Total', type: 'currency', readOnly: true, emphasis: true },
      { key: 'advanceAmount', label: 'Advance Payment', type: 'currency', readOnly: true },
      { key: 'balanceDue', label: 'Balance Due', type: 'currency', readOnly: true, emphasis: true },
    ],
  },
  footer: {
    leftActions: [
      { type: 'checkbox', key: 'downloadPdf', label: 'Download PDF' },
      { type: 'checkbox', key: 'sendEmail', label: 'Send Email' },
      { type: 'button', key: 'print', label: 'Print Invoice', icon: 'print' },
    ],
    rightActions: [
      { type: 'button', key: 'cancel', label: 'Cancel', variant: 'secondary' },
      { type: 'submit', key: 'save', label: 'Create Proforma Invoice', variant: 'primary' },
    ],
  },
};

export default proformaInvoiceFormConfig;
