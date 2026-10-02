import CustomerCombobox from '../components/CustomerCombobox';
import DeliveryAddressField from '../../../components/erp/TransactionForm/fields/DeliveryAddressField';

export const quotationFormConfig = {
  documentType: 'quotation',
  title: 'Create Quotation',
  subtitle: 'Prepare a sales proposal',
  header: {
    title: 'Create Quotation',
    subtitle: 'Prepare a sales proposal',
    fields: [
      { key: 'referenceNumber', label: 'Ref No.', type: 'text', placeholder: 'Ref No.' },
      { key: 'quotationDate', label: 'Date', type: 'date', required: true },
      { key: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { key: 'quotationCurrency', label: 'Currency', type: 'text', required: true },
      { key: 'exchangeRate', label: 'Exchange', type: 'number' }
    ]
  },
  sidebar: {
    sections: [
      {
        id: 'customerDetails',
        title: 'Customer Details',
        fields: [
          { key: 'customerId', label: 'Customer', type: 'custom', required: true, component: CustomerCombobox },
          { key: 'deliveryAddressId', label: 'Delivery Address', type: 'custom', component: DeliveryAddressField },
          { key: 'placeOfSupplyStateId', label: 'Place of Supply', type: 'select', required: true, options: [] }
        ]
      },
      {
        id: 'quotationTerms',
        title: 'Quotation Terms',
        fields: [
          { key: 'paymentTermsId', label: 'Payment Terms', type: 'select', options: [] },
          { key: 'deliveryTermsId', label: 'Delivery Terms', type: 'select', options: [] },
          { key: 'warrantyTermsId', label: 'Warranty Terms', type: 'select', options: [] }
        ]
      },
      {
        id: 'notesConditions',
        title: 'Notes & Conditions',
        fields: [
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes for the customer...' },
          { key: 'termsConditionsId', label: 'Terms & Conditions', type: 'select', options: [] }
        ]
      }
    ]
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
      { type: 'checkbox', key: 'downloadPdf', label: 'Download PDF' },
      { type: 'checkbox', key: 'sendEmail', label: 'Send Email' },
      { type: 'button', key: 'print', label: 'Print Quotation', icon: 'print' }
    ],
    rightActions: [
      { type: 'button', key: 'cancel', label: 'Cancel', variant: 'secondary' },
      { type: 'submit', key: 'save', label: 'Save Quotation', variant: 'primary' }
    ]
  }
};

export default quotationFormConfig;
