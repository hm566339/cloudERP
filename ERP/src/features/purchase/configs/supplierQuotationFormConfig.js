export const supplierQuotationFormConfig = {
  documentType: 'supplier-quotation',
  title: 'Create Supplier Quotation',
  subtitle: 'Submit a supplier quotation against RFQ',
  header: {
    title: 'Create Quotation',
    subtitle: 'Prepare a sales proposal', // Overridden in context
    fields: [
      { key: 'quotationNumber', label: 'Ref No.', type: 'text', placeholder: 'Auto Generated', disabled: true },
      { key: 'quotationDate', label: 'Quotation Date', type: 'date', required: true },
      { key: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { key: 'currency', label: 'Currency', type: 'text', required: true },
      { key: 'exchangeRate', label: 'Exchange', type: 'number' }
    ]
  },
  sidebar: {
    sections: [
      {
        id: 'vendorDetails',
        title: 'Vendor Details',
        fields: [
          { key: 'vendorId', label: 'Vendor', type: 'custom', required: true },
          { key: 'placeOfSupplyStateId', label: 'Place of Supply', type: 'select', required: true, options: [] }
        ]
      },
      {
        id: 'quotationTerms',
        title: 'Quotation Terms',
        fields: [
          { key: 'paymentTermId', label: 'Payment Terms', type: 'select', options: [] },
          { key: 'deliveryTermId', label: 'Delivery Terms', type: 'select', options: [] },
          { key: 'warrantyTermId', label: 'Warranty Terms', type: 'select', options: [] }
        ]
      },
      {
        id: 'notesConditions',
        title: 'Notes & Conditions',
        fields: [
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
          { key: 'termsConditionId', label: 'Terms & Conditions', type: 'select', options: [] }
        ]
      }
    ]
  },
  items: {
    title: 'Items',
    addButtonLabel: 'Add Item',
    gridTemplateColumns: 'minmax(150px, 1.5fr) minmax(110px, 1.1fr) minmax(130px, 1.3fr) minmax(70px, .7fr) minmax(100px, 1fr) minmax(70px, .7fr) minmax(75px, .75fr) minmax(90px, .9fr) minmax(95px, .95fr) 34px',
    itemDefaults: { quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'NOS' },
    columns: [
      { key: 'itemId', label: 'Product', type: 'searchable-select', required: true, options: [] },
      { key: 'hsnSacCode', label: 'HSN / SAC', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'quantity', label: 'Qty', type: 'number', required: true, min: 0.01 },
      { key: 'unitPrice', label: 'Price', type: 'currency', required: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'text' },
      { key: 'discountPercentage', label: 'Disc %', type: 'number', min: 0, max: 100 },
      { key: 'tax', label: 'Tax', type: 'currency', readOnly: true },
      { key: 'total', label: 'Total', type: 'currency', readOnly: true }
    ]
  },
  summary: {
    title: 'Quotation Summary',
    rows: [
      { key: 'subtotal', label: 'Sub Total', type: 'currency', readOnly: true },
      { key: 'freightCharges', label: 'Freight Charges', type: 'currency-input' },
      { key: 'otherCharges', label: 'Other Charges', type: 'currency-input' },
      { key: 'taxAmount', label: 'Tax Amount', type: 'currency', readOnly: true },
      { key: 'roundOff', label: 'Round Off', type: 'currency', readOnly: true },
      { key: 'grandTotal', label: 'Grand Total', type: 'currency', readOnly: true, emphasis: true }
    ]
  },
  footer: {
    leftActions: [
      { type: 'button', key: 'print', label: 'Print Quotation', icon: 'print' }
    ],
    rightActions: [
      { type: 'button', key: 'cancel', label: 'Cancel', variant: 'secondary' },
      { type: 'submit', key: 'save', label: 'Save Quotation', variant: 'primary' }
    ]
  }
};

export default supplierQuotationFormConfig;
