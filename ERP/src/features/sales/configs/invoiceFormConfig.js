import CustomerCombobox from '../components/CustomerCombobox';
import DeliveryAddressField from '../../../components/erp/TransactionForm/fields/DeliveryAddressField';

export const invoiceFormConfig = {
  documentType: 'invoice',
  title: 'Generate Sales Invoice',
  subtitle: 'Create a sales invoice and record revenue',
  header: {
    title: 'Generate Sales Invoice',
    subtitle: 'Create a sales invoice and record revenue',
    fields: [
      { key: 'invoiceNumber', label: 'Invoice No.', type: 'text', placeholder: 'Auto-generated' },
      { key: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { key: 'invoiceCurrency', label: 'Currency', type: 'text', required: true },
      { key: 'exchangeRate', label: 'Exchange Rate', type: 'number' }
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
        id: 'transportDetails',
        title: 'Transport Details',
        fields: [
          { key: 'transporter', label: 'Transporter', type: 'text', placeholder: 'Transporter Name' },
          { key: 'transportDocNo', label: 'Doc No', type: 'text', placeholder: 'LR / Doc No' },
          { key: 'vehicleNo', label: 'Vehicle No', type: 'text', placeholder: 'Vehicle Number' }
        ]
      },
      {
        id: 'invoiceTerms',
        title: 'Invoice Terms',
        fields: [
          { key: 'paymentTermId', label: 'Payment Terms', type: 'select', options: [] },
          { key: 'deliveryTermId', label: 'Delivery Terms', type: 'select', options: [] }
        ]
      },
      {
        id: 'notesConditions',
        title: 'Notes & Conditions',
        fields: [
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes for the customer...' },
          { key: 'termsConditionId', label: 'Terms & Conditions', type: 'select', options: [] }
        ]
      }
    ]
  },
  items: {
    title: 'Items',
    addButtonLabel: 'Add Item',
    gridTemplateColumns: '18% 12% 18% 7% 10% 7% 8% 7% 9% 4%',
    itemDefaults: { quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'NOS' },
    columns: [
      { key: 'itemId', label: 'Product', required: true },
      { key: 'hsnSacCode', label: 'HSN / SAC' },
      { key: 'description', label: 'Description' },
      { key: 'quantity', label: 'Qty', required: true },
      { key: 'unitPrice', label: 'Price', required: true },
      { key: 'unit', label: 'Unit' },
      { key: 'discountPercentage', label: 'Disc %' },
      { key: 'tax', label: 'Tax' },
      { key: 'total', label: 'Total' }
    ]
  },
  summary: {
    title: 'Invoice Summary',
    rows: [
      { key: 'subtotal', label: 'Sub Total', type: 'currency', readOnly: true },
      { key: 'freightCharges', label: 'Freight Charges', type: 'currency-input' },
      { key: 'otherCharges', label: 'Other Charges', type: 'currency-input' },
      { key: 'taxAmount', label: 'Tax Amount', type: 'currency', readOnly: true },
      { key: 'roundOff', label: 'Round Off', type: 'currency', readOnly: true },
      { key: 'grandTotal', label: 'Grand Total', type: 'currency', readOnly: true, emphasis: true },
      { key: 'receivedAmount', label: 'Received Amount', type: 'currency-input' }
    ]
  },
  footer: {
    leftActions: [
      { type: 'checkbox', key: 'downloadPdf', label: 'Download PDF' },
      { type: 'checkbox', key: 'sendEmail', label: 'Send Email' },
      { type: 'button', key: 'print', label: 'Print Invoice', icon: 'print' }
    ],
    rightActions: [
      { type: 'button', key: 'cancel', label: 'Cancel', variant: 'secondary' },
      { type: 'submit', key: 'save', label: 'Generate Invoice', variant: 'primary' }
    ]
  }
};

export default invoiceFormConfig;
