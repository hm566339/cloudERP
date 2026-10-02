const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const hasId = value => value !== undefined && value !== null && String(value).trim() !== '';

export function buildQuotationPayload(formValues, items, quotationId) {
  const isNewDeliveryAddress = formValues.deliveryAddressMode === 'new' || formValues.deliveryAddressId === 'NEW';
  const deliveryAddressId = !isNewDeliveryAddress && hasId(formValues.deliveryAddressId)
    ? formValues.deliveryAddressId
    : null;
  const newDeliveryAddress = isNewDeliveryAddress
    ? {
        addressLine1: formValues.newDeliveryAddress?.addressLine1?.trim() || '',
        addressLine2: formValues.newDeliveryAddress?.addressLine2?.trim() || '',
        city: formValues.newDeliveryAddress?.city?.trim() || '',
        gstStateId: formValues.newDeliveryAddress?.gstStateId || null,
        country: formValues.newDeliveryAddress?.country?.trim() || '',
        postalCode: formValues.newDeliveryAddress?.postalCode?.trim() || ''
      }
    : null;

  return {
    customerId: formValues.customerId,
    deliveryAddressId,
    newDeliveryAddress,
    saveNewDeliveryAddress: isNewDeliveryAddress && Boolean(formValues.saveNewDeliveryAddress),
    quotationNumber: formValues.quotationNumber || '',
    quotationDate: formValues.quotationDate,
    validUntil: formValues.validUntil,
    referenceNumber: formValues.referenceNumber || '',
    quotationCurrency: formValues.quotationCurrency || 'INR',
    exchangeRate: Number(formValues.exchangeRate) || 1,
    freightCharges: Number(formValues.freightCharges) || 0,
    otherCharges: Number(formValues.otherCharges) || 0,
    placeOfSupplyStateId: formValues.placeOfSupplyStateId,
    items: items.filter(item => item.itemId).map(item => ({
      id: quotationId && isUuid(item.id) ? item.id : null,
      itemId: item.itemId,
      hsnSacCode: item.hsnSacCode || '',
      itemName: item.itemName || '',
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'Pieces',
      unitPrice: Number(item.unitPrice) || 0,
      discountPercent: Number(item.discountPercent) || 0,
      notes: item.notes || ''
    })),
    paymentTermId: formValues.paymentTermId === 'CUSTOM' ? null : (formValues.paymentTermId || null),
    paymentTerms: formValues.paymentTerms || '',
    deliveryTermId: formValues.deliveryTermId === 'CUSTOM' ? null : (formValues.deliveryTermId || null),
    deliveryTerms: formValues.deliveryTerms || '',
    warrantyTermId: formValues.warrantyTermId === 'CUSTOM' ? null : (formValues.warrantyTermId || null),
    warrantyTerms: formValues.warrantyTerms || '',
    termsConditionId: formValues.termsConditionId === 'CUSTOM' ? null : (formValues.termsConditionId || null),
    termsAndConditions: formValues.termsAndConditions || '',
    notes: formValues.notes || ''
  };
}

export { isUuid };