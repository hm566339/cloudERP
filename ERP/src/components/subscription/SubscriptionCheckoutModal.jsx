import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Zap,
  Building2,
  Users,
  Layers,
  ArrowRight,
  Clock,
  Loader2,
  Lock,
  Check,
} from 'lucide-react';
import {
  createSubscriptionCheckout,
  getOrganizationSubscription,
  verifySubscriptionPayment,
  cancelPendingCheckout,
} from '../../api/sso/subscriptionPlan.api';
import { useDispatch } from 'react-redux';
import { authApi } from '../../features/auth/services/authApi';
import { formatPlanLimit } from '../../utils/subscriptionPlanHelper';

/**
 * Standard module formatting helper for checkout summary.
 */
const MODULE_LABELS = {
  ACCOUNT: 'Account & Finance',
  ACCOUNTS: 'Account & Finance',
  INVENTORY: 'Inventory & Stock',
  CRM: 'Sales & CRM',
  WORKFLOW: 'Workflow & Automation',
  PURCHASES: 'Procurement',
  PURCHASE: 'Procurement',
  SSO: 'SSO & Security',
};

function formatModuleName(rawName) {
  if (!rawName) return 'Module';
  const upper = String(rawName).trim().toUpperCase();
  return MODULE_LABELS[upper] || upper.replace(/_/g, ' ');
}

import {
  computeCheckoutPricing,
  loadRazorpaySdk,
  validatePaymentGatewayConfig,
} from '../../utils/subscriptionCheckoutHelper.js';

export { computeCheckoutPricing, loadRazorpaySdk, validatePaymentGatewayConfig };

/**
 * Enterprise Subscription Checkout & Payment Modal
 * Handles plan review, tax breakdown, Razorpay SDK initialization, server payment confirmation,
 * error states, and cache invalidation.
 */
export default function SubscriptionCheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  organization,
  user,
  onSuccess,
}) {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const orgId = organization?.id;
  const orgName = organization?.name || organization?.displayName || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();
  const userEmail = user?.email || user?.username || '';
  const userName = user?.fullName || user?.name || orgName;

  const isSubmittingRef = useRef(false);
  const isVerifyingRef = useRef(false);

  // Pricing calculations
  const pricing = useMemo(() => {
    if (!selectedPlan) return computeCheckoutPricing(0);
    return computeCheckoutPricing(selectedPlan.price, selectedPlan.currency || 'INR');
  }, [selectedPlan]);

  // Active modules in the selected plan
  const activeModules = useMemo(() => {
    if (!selectedPlan?.modules || !Array.isArray(selectedPlan.modules)) return [];
    return selectedPlan.modules.filter((m) => m.active !== false);
  }, [selectedPlan]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setIsVerifying(false);
      isSubmittingRef.current = false;
      isVerifyingRef.current = false;
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || isLoading || isVerifying) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, isVerifying, onClose]);

  // Execute payment checkout flow
  const handleProceedToPayment = async () => {
    if (isSubmittingRef.current || isLoading || isVerifying) {
      return;
    }

    if (!orgId) {
      setErrorMessage('Organization context is missing. Please refresh and try again.');
      return;
    }
    if (!selectedPlan) {
      setErrorMessage('Please select a valid plan to proceed.');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Load Razorpay SDK
      const isSdkLoaded = await loadRazorpaySdk();
      if (!isSdkLoaded) {
        throw new Error('Unable to connect to the payment gateway (Checkout SDK). Please check your internet connection.');
      }

      // 2. Call backend checkout order creation API
      let checkoutData;
      try {
        checkoutData = await createSubscriptionCheckout(orgId, {
          planId: selectedPlan.code || selectedPlan.id,
          totalCount: 12, // 12 billing cycles / annual subscription
        });
      } catch (apiErr) {
        const backendMsg = apiErr.response?.data?.message || apiErr.message || '';
        if (
          backendMsg.toLowerCase().includes('razorpay') ||
          backendMsg.toLowerCase().includes('gateway') ||
          backendMsg.toLowerCase().includes('key') ||
          backendMsg.toLowerCase().includes('credential') ||
          apiErr.response?.status === 500
        ) {
          throw new Error('Payment gateway is not configured or unavailable on the server. Please contact support or system administrator.');
        }
        throw new Error(backendMsg || 'Failed to initiate subscription checkout on the server.');
      }

      // 3. Verify server checkout credentials
      if (!checkoutData) {
        throw new Error('Server returned an empty checkout response.');
      }

      const keyId = checkoutData.keyId;
      const orderId = checkoutData.orderId || checkoutData.subscriptionId;

      if (!keyId || typeof keyId !== 'string' || !keyId.trim()) {
        throw new Error('Payment gateway configuration is missing (Razorpay Key ID not configured on the server). Please contact administrator.');
      }

      if (!orderId) {
        throw new Error('Server did not return a valid payment order ID. Please try again.');
      }

      const amountPaise = checkoutData.amountInPaise || (checkoutData.amount ? Math.round(Number(checkoutData.amount) * 100) : undefined);

      // 4. Initialize Razorpay Checkout instance
      const options = {
        key: keyId.trim(),
        order_id: checkoutData.orderId || (orderId?.startsWith('order_') ? orderId : undefined),
        subscription_id: !checkoutData.orderId && orderId?.startsWith('sub_') ? orderId : undefined,
        name: 'Mark2 ERP',
        description: `${selectedPlan.name || 'ERP'} Plan Purchase`,
        currency: checkoutData.currency || selectedPlan.currency || 'INR',
        amount: amountPaise,
        handler: async function (response) {
          if (isVerifyingRef.current) {
            return;
          }
          isVerifyingRef.current = true;
          setIsVerifying(true);
          try {
            // Cryptographically verify payment on server and activate plan
            await verifySubscriptionPayment(orgId, {
              orderId: response.razorpay_order_id || checkoutData.orderId || orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            // Verify and refresh subscription from backend
            let updatedSub = null;
            try {
              updatedSub = await getOrganizationSubscription(orgId);
            } catch (err) {
              console.warn('Direct subscription fetch warning:', err.message);
            }

            // Force refresh of SSO /me session context
            try {
              dispatch(authApi.endpoints.ssoGetMe.initiate(undefined, { forceRefetch: true }));
            } catch (e) {
              console.warn('ssoGetMe refetch error:', e);
            }

            setSuccessMessage(`Payment confirmed! Your subscription has been successfully upgraded to ${selectedPlan.name}.`);
            setIsVerifying(false);
            isVerifyingRef.current = false;
            isSubmittingRef.current = false;

            if (onSuccess) {
              onSuccess(updatedSub);
            }

            setTimeout(() => {
              onClose();
            }, 2500);
          } catch (verifyErr) {
            console.error('Error during post-payment verification:', verifyErr);
            const errDetail = verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed.';
            setErrorMessage(`Payment verification error: ${errDetail}`);
            setIsVerifying(false);
            isVerifyingRef.current = false;
            isSubmittingRef.current = false;
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#18181b',
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            isSubmittingRef.current = false;
            if (orgId && orderId) {
              cancelPendingCheckout(orgId, orderId);
            }
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setIsLoading(false);
        isSubmittingRef.current = false;
        const failDesc = resp.error?.description || resp.error?.reason || 'Payment transaction failed or was cancelled.';
        setErrorMessage(failDesc);
        if (orgId && orderId) {
          cancelPendingCheckout(orgId, orderId);
        }
      });

      rzpInstance.open();
    } catch (err) {
      console.error('[SubscriptionCheckoutModal] Checkout error:', err);
      setErrorMessage(err.message || 'Payment processing failed. Please try again later.');
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };


  if (!isOpen || !selectedPlan) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white dark:bg-[#161922] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200/80 dark:border-[#2A2F3D] space-y-6 max-h-[92vh] overflow-y-auto no-scrollbar relative animate-scale-up">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">
                  Secure Checkout
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
                  <ShieldCheck size={11} className="text-emerald-600 dark:text-emerald-400" />
                  <span>256-Bit SSL</span>
                </span>
              </div>
              <h2 id="checkout-modal-title" className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight mt-0.5">
                Upgrade to {selectedPlan.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || isVerifying}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] dark:hover:bg-[#1D212C] transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Organization & Company Context Pill */}
        <div className="bg-zinc-50 dark:bg-[#1D212C]/60 rounded-xl p-3 border border-zinc-200/60 dark:border-[#2A2F3D] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 size={14} className="text-zinc-400 dark:text-[#6B7184] shrink-0" />
            <div className="truncate">
              <span className="text-zinc-500 dark:text-[#A0A6B5]">Subscribing for: </span>
              <strong className="text-zinc-900 dark:text-[#E6E8EE] font-semibold">{orgName}</strong>
              {orgCode && <span className="font-mono text-[10.5px] text-zinc-400 dark:text-[#6B7184] ml-1">({orgCode})</span>}
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/80 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D] shrink-0">
            OWNER AUTHORIZED
          </span>
        </div>

        {/* Plan Overview & Features Summary */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Plan Highlights</span>
            <span className="text-xs font-semibold text-zinc-400 dark:text-[#6B7184] flex items-center gap-1">
              <Clock size={12} />
              <span>{selectedPlan.durationDays || 30} Days Validity</span>
            </span>
          </div>

          <div className="bg-zinc-50/80 dark:bg-[#1D212C]/60 rounded-2xl p-4 border border-zinc-200/60 dark:border-[#2A2F3D] space-y-3">
            {/* Description */}
            <p className="text-xs text-zinc-600 dark:text-[#A0A6B5] leading-relaxed font-normal">
              {selectedPlan.description || 'Full enterprise tier with unlimited platform access and modular rights.'}
            </p>

            {/* Quota Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60 dark:border-[#2A2F3D] text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase">
                  <Building2 size={11} className="text-zinc-700 dark:text-[#A0A6B5]" />
                  <span>Max Companies</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                  {formatPlanLimit(selectedPlan.maxCompanies, 'companies')}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase">
                  <Users size={11} className="text-zinc-700 dark:text-[#A0A6B5]" />
                  <span>Users / Company</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                  {formatPlanLimit(selectedPlan.maxUsersPerCompany, 'users')}
                </div>
              </div>
            </div>

            {/* Included Modules list */}
            {activeModules.length > 0 && (
              <div className="pt-2 border-t border-zinc-200/60 dark:border-[#2A2F3D] space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider block">
                  Included Modules ({activeModules.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeModules.map((m, idx) => (
                    <span
                      key={m.moduleId || m.id || idx}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-800 shadow-2xs dark:bg-[#161922] dark:border-[#2A2F3D] dark:text-[#E6E8EE]"
                    >
                      <Check size={10} className="text-zinc-700 dark:text-emerald-400 stroke-[2.5]" />
                      <span>{m.moduleName || m.name ? formatModuleName(m.moduleName || m.name) : 'Module'}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider block">
            Payment Summary
          </span>

          <div className="bg-zinc-50 dark:bg-[#1D212C]/60 rounded-2xl p-4 border border-zinc-200/80 dark:border-[#2A2F3D] space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-zinc-600 dark:text-[#A0A6B5]">
              <span>Plan Subscription ({selectedPlan.durationDays || 30} days)</span>
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{pricing.formattedBasePrice}</span>
            </div>

            {pricing.taxAmount > 0 && (
              <div className="flex items-center justify-between text-zinc-600 dark:text-[#A0A6B5]">
                <span>Tax</span>
                <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{pricing.formattedTax}</span>
              </div>
            )}

            <div className="border-t border-zinc-200/80 dark:border-[#2A2F3D] pt-2.5 flex items-center justify-between text-sm">
              <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">Total Payable Amount</span>
              <span className="text-lg font-black font-display text-zinc-900 dark:text-[#E6E8EE]">
                {pricing.formattedTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-200 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900 dark:text-rose-200">Payment Issue</p>
              <p className="mt-0.5 text-rose-800 dark:text-rose-300 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Feedback Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-200 text-xs flex items-start gap-2.5 shadow-2xs">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-900 dark:text-emerald-200">Subscription Updated</p>
              <p className="mt-0.5 text-emerald-800 dark:text-emerald-300 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Verifying Spinner Indicator */}
        {isVerifying && (
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-800 dark:text-[#E6E8EE] text-xs flex items-center justify-center gap-2.5 font-bold">
            <Loader2 size={16} className="animate-spin text-zinc-700 dark:text-[#A0A6B5]" />
            <span>Verifying payment with billing server...</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || isVerifying}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C] dark:hover:text-[#E6E8EE] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProceedToPayment}
            disabled={isLoading || isVerifying || !!successMessage}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-[#4C8DFF] dark:hover:bg-[#3B7AE8] dark:text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Initiating Checkout...</span>
              </>
            ) : isVerifying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Confirming Payment...</span>
              </>
            ) : (
              <>
                <Lock size={13} />
                <span>Pay {pricing.formattedTotal} via Razorpay</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
