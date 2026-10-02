export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phonePattern = /^[0-9]{10,15}$/
export const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
export const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

export const validateCustomerPayload = (payload) => {
 const errors = {}

 if (!payload.customerCode?.trim()) {
 errors.customerCode = 'Customer code is required.'
 }

 if (!payload.customerName?.trim()) {
 errors.customerName = 'Customer name is required.'
 }

 if (payload.email && !emailPattern.test(payload.email.trim())) {
 errors.email = 'Enter a valid email address.'
 }

 if (payload.phone && !phonePattern.test(payload.phone.trim())) {
 errors.phone = 'Enter a valid phone number.'
 }

 if (payload.gstin && !gstinPattern.test(payload.gstin.trim())) {
 errors.gstin = 'Enter a valid GSTIN.'
 }

 if (payload.panNo && !panPattern.test(payload.panNo.trim())) {
 errors.panNo = 'Enter a valid PAN number.'
 }

 if (payload.creditLimit == null || payload.creditLimit === '') {
 errors.creditLimit = 'Credit limit is required.'
 } else if (Number.isNaN(Number(payload.creditLimit)) || Number(payload.creditLimit) < 0) {
 errors.creditLimit = 'Credit limit must be a number greater than or equal to 0.'
 }

 return errors
}
