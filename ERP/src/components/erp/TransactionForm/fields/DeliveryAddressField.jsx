import React, { useEffect, useMemo, useRef } from 'react';
import { useGetCustomerByIdQuery } from '../../../../api/sales-crm';
import CustomSelect from '../../../common/CustomSelect';

const emptyAddress = () => ({
  addressLine1: '',
  addressLine2: '',
  city: '',
  gstStateId: '',
  country: '',
  postalCode: ''
});

const hasAddressId = value => value !== undefined && value !== null && String(value).trim() !== '';

export const extractCustomer = response => {
  const candidates = [response?.data?.data, response?.data, response];
  return candidates.find(candidate => Array.isArray(candidate?.addresses)) || candidates.find(Boolean) || null;
};

const formatAddress = address => [
  address.addressType,
  address.addressLine1,
  address.addressLine2,
  address.city,
  address.gstStateName,
  address.postalCode,
  address.country
].filter(Boolean).join(', ');

export default function DeliveryAddressField({
  value,
  onChange,
  formValues,
  setFormValue,
  errors,
  disabled,
  context = {}
}) {
  const { companyId, gstStates = [] } = context;
  const customerId = formValues?.customerId;
  const { data: customerResponse, isFetching: addressesLoading, error: addressesError } = useGetCustomerByIdQuery(
    { id: customerId, companyId },
    { skip: !customerId }
  );
  const customer = extractCustomer(customerResponse);
  const previousSavedAddressId = useRef(value || '');
  const clearedError = useRef(null);
  const mode = formValues?.deliveryAddressMode === 'new' ? 'new' : 'existing';

  const addresses = useMemo(() => {
    if (addressesLoading || addressesError) return [];
    const responseCustomerId = customer?.id || customer?.customerId;
    if (responseCustomerId && String(responseCustomerId) !== String(customerId)) return [];
    return (customer?.addresses || []).filter(address => address.isActive !== false && hasAddressId(address.id));
  }, [addressesError, addressesLoading, customer, customerId]);

  const addressOptions = useMemo(() => [
    { value: '', label: 'Select Delivery Address...' },
    ...addresses.map(address => ({
      value: address.id,
      label: formatAddress(address) || 'Address'
    })),
    { value: 'NEW', label: '+ Add New Address' }
  ], [addresses]);

  useEffect(() => {
    if (!addressesError) {
      clearedError.current = null;
      return;
    }
    const errorKey = JSON.stringify(addressesError);
    if (clearedError.current === errorKey) return;
    clearedError.current = errorKey;
    onChange(null);
    setFormValue('deliveryAddressMode', 'existing');
    setFormValue('newDeliveryAddress', null);
    setFormValue('saveNewDeliveryAddress', false);
  }, [addressesError, onChange, setFormValue]);

  useEffect(() => {
    if (!customerId || mode === 'new' || addresses.length === 0) return;
    const selectedStillBelongs = addresses.some(address => String(address.id) === String(value));
    if (selectedStillBelongs) {
      previousSavedAddressId.current = value;
      return;
    }
    const defaultAddress = addresses.find(address => address.isDefault || address.defaultAddress || address.isPrimary || address.primary) || addresses[0];
    previousSavedAddressId.current = defaultAddress.id;
    onChange(defaultAddress.id);
    setFormValue('newDeliveryAddress', null);
    setFormValue('saveNewDeliveryAddress', false);
  }, [addresses, customerId, mode, onChange, setFormValue, value]);

  const selectAddress = nextValue => {
    if (nextValue === 'NEW') {
      previousSavedAddressId.current = value || previousSavedAddressId.current || '';
      onChange(null);
      setFormValue('deliveryAddressMode', 'new');
      setFormValue('newDeliveryAddress', emptyAddress());
      setFormValue('saveNewDeliveryAddress', false);
      return;
    }
    previousSavedAddressId.current = nextValue || '';
    onChange(nextValue || '');
    setFormValue('deliveryAddressMode', 'existing');
    setFormValue('newDeliveryAddress', null);
    setFormValue('saveNewDeliveryAddress', false);
  };

  const useSavedAddress = () => {
    const savedId = addresses.some(address => String(address.id) === String(previousSavedAddressId.current))
      ? previousSavedAddressId.current
      : (addresses[0]?.id || '');
    selectAddress(savedId);
  };

  const updateCustomAddress = (key, nextValue) => {
    setFormValue('newDeliveryAddress', {
      ...(formValues?.newDeliveryAddress || emptyAddress()),
      [key]: nextValue
    });
  };

  return (
    <div>
      <label className="block mb-1 text-[8.5px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Delivery Address</label>
      {mode === 'existing' ? (
        <CustomSelect
          value={value || ''}
          options={addressOptions}
          onChange={event => selectAddress(event.target.value)}
          placeholder="Select Delivery Address..."
          emptyMessage={customerId ? 'No delivery addresses available' : 'Select a customer first'}
          isLoading={addressesLoading}
          disabled={disabled || !customerId}
          className="w-full"
          buttonClassName="w-full h-8 px-2.5 border border-zinc-200 rounded-md bg-white dark:bg-[#1D212C] dark:border-[#2A2F3D] text-[10px] text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-between outline-none focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 disabled:bg-zinc-50 dark:disabled:bg-[#161922] disabled:text-zinc-400 dark:disabled:text-[#6B7184]"
        />
      ) : (
        <div className="space-y-1.5 rounded-md border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] p-2">
          {[
            ['addressLine1', 'Address Line 1', true],
            ['addressLine2', 'Address Line 2', false],
            ['city', 'City', true],
            ['country', 'Country', true],
            ['postalCode', 'Postal Code', true]
          ].map(([key, placeholder, required]) => (
            <input
              key={key}
              value={formValues?.newDeliveryAddress?.[key] || ''}
              onChange={event => updateCustomAddress(key, event.target.value)}
              placeholder={`${placeholder}${required ? ' *' : ''}`}
              disabled={disabled}
              className="input-field w-full h-7 text-[8.8px]"
            />
          ))}
          <CustomSelect
            value={formValues?.newDeliveryAddress?.gstStateId || ''}
            options={[{ value: '', label: 'Select Address State...' }, ...gstStates.map(state => ({ value: state.id, label: state.stateName || state.name || state.code }))]}
            onChange={event => updateCustomAddress('gstStateId', event.target.value)}
            placeholder="Select Address State..."
            searchable
            disabled={disabled}
            className="w-full"
            buttonClassName="w-full h-7 px-2 border border-zinc-200 dark:border-[#2A2F3D] rounded-md bg-white dark:bg-[#1D212C] text-[8.8px] text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-between outline-none focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 disabled:bg-zinc-50 dark:disabled:bg-[#161922] disabled:text-zinc-400 dark:disabled:text-[#6B7184]"
          />
          <label className="flex items-center gap-1.5 text-[8px] text-zinc-600 dark:text-[#A0A6B5]">
            <input
              type="checkbox"
              checked={Boolean(formValues?.saveNewDeliveryAddress)}
              onChange={event => setFormValue('saveNewDeliveryAddress', event.target.checked)}
              disabled={disabled}
            />
            Save this address for this customer
          </label>
          <button type="button" onClick={useSavedAddress} disabled={disabled} className="text-[8px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] disabled:text-zinc-400 dark:disabled:text-[#6B7184]">
            Use a saved address
          </button>
        </div>
      )}
      {mode === 'existing' && !addressesLoading && !addressesError && addresses.length === 0 && customerId && <p className="mt-1 text-[8px] text-zinc-400 dark:text-[#A0A6B5]">No delivery addresses available</p>}
      {errors?.deliveryAddressId && <p className="mt-1 text-[8px] text-red-600 dark:text-[#F0616D]">{errors.deliveryAddressId}</p>}
    </div>
  );
}