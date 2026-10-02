import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAcceptQuotationByTokenMutation } from '../../../api/sales-crm/sales.api';
import { CheckCircle2, XCircle, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function QuotationAcceptancePage() {
  const { token } = useParams();
  const [acceptQuotation, { isLoading }] = useAcceptQuotationByTokenMutation();
  const [status, setStatus] = useState('initial'); // 'initial' | 'loading' | 'success' | 'invalid' | 'already_accepted' | 'error'
  const [message, setMessage] = useState('');

  const handleAccept = async () => {
    if (!token || isLoading) return;
    setStatus('loading');
    try {
      const response = await acceptQuotation({ token }).unwrap();
      setStatus('success');
      setMessage(response?.message || 'Quotation Accepted Successfully');
    } catch (error) {
      if (error?.status === 400 || error?.status === 404) {
        const errorMsg = error?.data?.message?.toLowerCase() || '';
        if (errorMsg.includes('already') || errorMsg.includes('accepted')) {
          setStatus('already_accepted');
          setMessage('This quotation has already been accepted.');
        } else if (errorMsg.includes('invalid') || errorMsg.includes('expired')) {
          setStatus('invalid');
          setMessage('This quotation acceptance link is invalid or has expired.');
        } else {
          setStatus('invalid');
          setMessage(error?.data?.message || 'This quotation acceptance link is invalid.');
        }
      } else {
        setStatus('error');
        setMessage('Unable to process your request right now. Please try again later.');
      }
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6 mx-auto animate-in zoom-in" />;
      case 'invalid':
      case 'error':
        return <XCircle className="w-16 h-16 text-rose-500 mb-6 mx-auto animate-in zoom-in" />;
      case 'already_accepted':
        return <AlertCircle className="w-16 h-16 text-amber-500 mb-6 mx-auto animate-in zoom-in" />;
      case 'loading':
        return <Loader2 className="w-16 h-16 text-primary-500 mb-6 mx-auto animate-spin" />;
      default:
        return (
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-primary-100">
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <div className="text-center">
            {renderIcon()}
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Thank You!</h2>
            <p className="text-zinc-600 mb-6">{message}</p>
            <p className="text-sm text-zinc-500">You may now close this window.</p>
          </div>
        );
      
      case 'invalid':
      case 'error':
      case 'already_accepted':
        return (
          <div className="text-center">
            {renderIcon()}
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              {status === 'already_accepted' ? 'Already Accepted' : 'Request Failed'}
            </h2>
            <p className="text-zinc-600 mb-6">{message}</p>
            <p className="text-sm text-zinc-500">If you believe this is an error, please contact support.</p>
          </div>
        );

      default:
        return (
          <div className="text-center">
            {renderIcon()}
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Accept Quotation</h2>
            <p className="text-zinc-600 mb-8">
              Please confirm your acceptance of this quotation to proceed.
            </p>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium text-[12px] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Accepting Quotation...
                </>
              ) : (
                'Accept Quotation'
              )}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-[352px] animate-fade-in-up bg-white rounded-2xl p-8 lg:p-10 shadow-xl border border-zinc-100">
      {renderContent()}
    </div>
  );
}
