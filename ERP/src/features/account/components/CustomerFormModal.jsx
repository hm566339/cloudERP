import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import UpdateModal from '../../../components/common/UpdateModal';
import { customerFormSections } from '../customerFormConfig';
import { useGetCompaniesQuery } from '../../../api/sso';
import { useGetGstStatesQuery } from '../../../api/account/accounting.api';
import { emailPattern, gstinPattern, panPattern } from '../../../validation/customerValidation';

const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem('auth_user')) || {};
  } catch {
    return {};
  }
};

const hasSystemAdminRole = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const roleValues = [user?.role, ...roles].map((role) => (
    typeof role === 'object' ? role?.name || role?.role : role
  ));

  return user?.loginType === 'ADMIN' || roleValues.some((role) => {
    const normalized = String(role || '').toUpperCase();
    return normalized === 'SYSTEM_ADMIN' || normalized === 'ROLE_SYSTEM_ADMIN';
  });
};

const sanitizePhone = (val) => {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
};

const getGstStates = (response) => {
  if (Array.isArray(response)) return response;
  return response?.data?.records || response?.records || response?.data?.states ||
    response?.states || (Array.isArray(response?.data) ? response.data : []) ||
    response?.content || [];
};

/**
 * CustomerFormModal
 *
 * Thin wrapper around the generic <UpdateModal>.
 * All UI (layout, fields, validation banner, footer) is handled by UpdateModal.
 * This component owns only Customer-specific business logic:
 *   - companyId resolution
 *   - payload construction (creditLimit → parseFloat, null-coercion)
 *   - create vs. edit label switching
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   onSubmit     (payload) => void   — called with the final API payload
 *   initialData  object | null       — pre-fills edit mode; null = create mode
 */
export default function CustomerFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const routeCompanyId = useParams().companyId;
  const selectedCompany = (() => {
    try {
      return JSON.parse(localStorage.getItem('selected_company')) || {};
    } catch {
      return {};
    }
  })();
  const authUser = getStoredAuthUser();
  const isEditMode = !!initialData?.id;
  const isSystemAdmin = hasSystemAdminRole(authUser);
  const companyId = routeCompanyId || selectedCompany.id || authUser.companyCode;

  const { data: companiesData } = useGetCompaniesQuery(
    { page: 0, pageSize: 1000, active: true },
    { skip: !isOpen || !isSystemAdmin }
  );
  const { data: gstStatesData } = useGetGstStatesQuery(
    { companyId, active: true },
    { skip: !isOpen }
  );

  const companies = companiesData?.companies || companiesData?.content ||
    (Array.isArray(companiesData) ? companiesData : []);
  const gstStates = getGstStates(gstStatesData);

  const mappedInitialData = useMemo(() => {
    if (!initialData) {
      return {
        country: 'India',
        isActive: true,
        creditLimit: 0,
      };
    }
    const defaultAddress = (initialData.addresses && initialData.addresses.length > 0)
      ? (initialData.addresses.find((a) => a.isDefault) || initialData.addresses[0])
      : {};

    return {
      ...initialData,
      addressLine1: defaultAddress.addressLine1 || '',
      city: defaultAddress.city || '',
      state: defaultAddress.gstStateName || defaultAddress.state || '',
      postalCode: defaultAddress.postalCode || '',
      country: defaultAddress.country || 'India',
      addressId: defaultAddress.id || undefined,
      isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      creditLimit: initialData.creditLimit ?? 0,
    };
  }, [initialData]);

  const sections = useMemo(() => {
    if (!isSystemAdmin) return customerFormSections;
    return customerFormSections.map((section, index) => index === 0 ? {
      ...section,
      fields: [{
        key: 'companyId',
        label: 'Company',
        type: 'select',
        required: true,
        options: companies
          .filter((company) => company?.id || company?.companyId)
          .map((company) => ({
            value: company.id || company.companyId,
            label: company.name || company.companyName || company.code || company.companyCode,
          })),
      }, ...section.fields],
    } : section);
  }, [companies, isSystemAdmin]);

  const validate = (formData) => {
    const errors = {};
    const email = formData.email?.trim();
    const gstin = formData.gstin?.trim().toUpperCase();
    const panNo = formData.panNo?.trim().toUpperCase();

    if (!formData.customerName?.trim()) errors.customerName = 'Customer name is required.';
    if (isSystemAdmin && !formData.companyId) errors.companyId = 'Company is required.';
    if (email && !emailPattern.test(email)) errors.email = 'Enter a valid email address.';

    if (formData.phone?.trim()) {
      const cleanPhone = sanitizePhone(formData.phone);
      if (!cleanPhone || cleanPhone.length !== 10) {
        errors.phone = 'Phone number must be a 10-digit number (e.g. 9876543210).';
      }
    }

    if (gstin && !gstinPattern.test(gstin)) errors.gstin = 'Enter a valid GSTIN.';
    if (panNo && !panPattern.test(panNo)) errors.panNo = 'Enter a valid PAN number.';
    if (gstin && !panNo && (!gstinPattern.test(gstin) || gstin.length < 12)) {
      errors.panNo = 'PAN number is required when GSTIN is provided.';
    }

    const hasAddressInfo = Boolean(
      formData.addressLine1?.trim() ||
      formData.city?.trim() ||
      formData.state?.trim() ||
      formData.postalCode?.trim()
    );

    if (hasAddressInfo) {
      if (!formData.addressLine1?.trim()) {
        errors.addressLine1 = 'Street Address is required for customer address.';
      }
      if (!formData.city?.trim()) {
        errors.city = 'City is required for customer address.';
      }
    }

    if (formData.creditLimit === '' || formData.creditLimit === null || Number.isNaN(Number(formData.creditLimit)) || Number(formData.creditLimit) < 0) {
      errors.creditLimit = 'Credit limit must be a non-negative number.';
    }
    return errors;
  };

  /**
   * handleSubmit — receives the flat formData from UpdateModal and builds
   * the final API payload with Customer-specific transformations.
   */
  const handleSubmit = (formData) => {
    const stateValue = formData.state?.trim().toLowerCase();
    const matchedState = gstStates.find((state) => [
      state.stateName, state.name, state.stateCode, state.code,
    ].filter(Boolean).some((value) => String(value).trim().toLowerCase() === stateValue));
    
    const hasAddressInfo = Boolean(
      formData.addressLine1?.trim() ||
      formData.city?.trim() ||
      formData.state?.trim() ||
      formData.postalCode?.trim()
    );

    let addresses = undefined;
    if (hasAddressInfo) {
      const address = {
        addressType: 'BILLING',
        addressLine1: formData.addressLine1?.trim() || '',
        addressLine2: '',
        city: formData.city?.trim() || '',
        country: formData.country?.trim() || 'India',
        postalCode: formData.postalCode?.trim() || '',
        isDefault: true,
        isActive: true,
      };

      if (isEditMode && formData.addressId) {
        address.id = formData.addressId;
      }
      
      if (matchedState?.id) address.gstStateId = matchedState.id;
      addresses = [address];
    }

    const cleanPhone = sanitizePhone(formData.phone);
    const gstin = formData.gstin?.trim().toUpperCase() || null;
    let panNo = formData.panNo?.trim().toUpperCase() || null;
    if (gstin && !panNo && gstin.length >= 12) {
      panNo = gstin.substring(2, 12);
    }

    if (!isEditMode) {
      return onSubmit({
        ...(isSystemAdmin ? { companyId: formData.companyId, includeCompanyId: true } : {}),
        data: {
          customerCode: formData.customerCode?.trim() || null,
          customerName: formData.customerName?.trim() || '',
          gstin: gstin,
          panNo: panNo,
          email: formData.email?.trim() || null,
          phone: cleanPhone || null,
          creditLimit: Number(formData.creditLimit) || 0,
          isActive: formData.isActive !== false,
          ...(addresses ? { addresses } : {}),
        },
      });
    }

    const payloadId = formData.id ?? (isEditMode ? initialData.id : undefined);

    const payload = {
      companyId,
      id:           payloadId,
      customerName: formData.customerName?.trim() || '',
      customerCode: formData.customerCode?.trim() || null,
      email:        formData.email?.trim() || null,
      phone:        cleanPhone || null,
      gstin:        gstin,
      panNo:        panNo,
      creditLimit:  Number(formData.creditLimit) || 0,
      isActive:     formData.isActive ?? true,
      ...(addresses ? { addresses } : {}),
    };

    if (!payload.id) delete payload.id;

    // Delegate to parent (CustomerManagement or CustomerDetails)
    return onSubmit(payload);
  };

  return (
    <UpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Customer' : 'Add New Customer'}
      sections={sections}
      initialData={mappedInitialData}
      onSubmit={handleSubmit}
      validate={validate}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Customer'}
      cancelLabel="Cancel"
    />
  );
}
