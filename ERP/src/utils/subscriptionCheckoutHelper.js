/**
 * Subscription Checkout & Payment Processing Helpers
 * Centralized utility functions for pricing, taxes, gateway validation, and active subscription detection.
 */

/**
 * Checks whether a given catalog plan corresponds to the active company / organization subscription.
 *
 * @param {Object} plan - Catalog plan object
 * @param {Object} activeSub - Active subscription object from SSO /me or subscription API
 * @returns {boolean}
 */
export function isCurrentPlan(plan, activeSub) {
  if (!plan || !activeSub) return false;
  const subCode = String(activeSub.planCode || activeSub.code || '').trim().toUpperCase();
  const subName = String(activeSub.planName || activeSub.name || '').trim().toLowerCase();
  const planCode = String(plan.code || '').trim().toUpperCase();
  const planName = String(plan.name || '').trim().toLowerCase();
  const planId = String(plan.id || '').trim();
  const subPlanId = String(activeSub.planId || activeSub.subscriptionPlanId || activeSub.id || '').trim();

  if (subPlanId && planId && subPlanId === planId) return true;
  if (subCode && planCode && (subCode === planCode || subCode.replace(/_/g, '') === planCode.replace(/_/g, ''))) return true;
  if (subName && planName && (subName === planName || subName.includes(planName) || planName.includes(subName))) return true;
  if (activeSub.trialing && (plan.isTrial || planCode.includes('TRIAL'))) return true;
  return false;
}

/**
 * Computes base price and total payable amount without adding GST from frontend.
 *
 * @param {number|string} price - Base plan price
 * @param {string} currency - Currency code (e.g. 'INR')
 * @param {number} taxRate - Tax percentage (default 0; frontend does not add GST)
 * @returns {Object}
 */
export function computeCheckoutPricing(price, currency = 'INR', taxRate = 0) {
  const numPrice = Number(price ?? 0);
  if (isNaN(numPrice) || numPrice <= 0) {
    return {
      isFree: true,
      basePrice: 0,
      taxAmount: 0,
      totalAmount: 0,
      currencySymbol: currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : `${currency} `),
      formattedBasePrice: 'Free',
      formattedTax: '₹0',
      formattedTotal: 'Free',
    };
  }

  const symbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : `${currency} `);
  const tax = Math.round(numPrice * taxRate * 100) / 100;
  const total = Math.round((numPrice + tax) * 100) / 100;

  return {
    isFree: false,
    basePrice: numPrice,
    taxAmount: tax,
    totalAmount: total,
    currencySymbol: symbol,
    formattedBasePrice: `${symbol}${numPrice.toLocaleString('en-IN')}`,
    formattedTax: `${symbol}${tax.toLocaleString('en-IN')}`,
    formattedTotal: `${symbol}${total.toLocaleString('en-IN')}`,
  };
}

/**
 * Validates backend payment gateway configuration from checkout API response.
 *
 * @param {Object} checkoutData - Server response from POST /api/sso/subscriptions/:orgId/checkout
 * @throws {Error} if gateway credentials (keyId) or subscription ID are missing
 * @returns {boolean}
 */
export function validatePaymentGatewayConfig(checkoutData) {
  if (!checkoutData) {
    throw new Error('Server returned an empty checkout response.');
  }

  const keyId = checkoutData.keyId;
  if (!keyId || typeof keyId !== 'string' || !keyId.trim()) {
    throw new Error('Payment gateway configuration is missing (Razorpay Key ID not configured on the server). Please contact support or administrator.');
  }

  if (!checkoutData.orderId && !checkoutData.subscriptionId) {
    throw new Error('Server did not return a valid payment order or subscription ID. Please try again.');
  }

  return true;
}

/**
 * Dynamically loads the Razorpay checkout script if not already present on window.
 *
 * @returns {Promise<boolean>}
 */
export function loadRazorpaySdk() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
